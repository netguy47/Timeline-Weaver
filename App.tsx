
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTimelineStorage } from './hooks/useTimelineStorage';
import { generateArticleContent, generateImage, generateArtifact, generateHistoricalEcho } from './services/geminiService';
import TimelineHome from './components/TimelineHome';
import ArticleView from './components/ArticleView';
import LoadingSpinner from './components/LoadingSpinner';
import Icon from './components/Icon';
import ConfirmationModal from './components/ConfirmationModal';
import ExportModal from './components/ExportModal';
import ChronoscopeModal from './components/ChronoscopeModal';
import BranchingMap from './components/BranchingMap';
import type { Article, Timeline } from './types';

const App: React.FC = () => {
  const [activeTimeline, setActiveTimeline] = useState<Timeline | null>(null);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { timelines, addTimeline, updateTimeline, deleteTimeline, importTimeline } = useTimelineStorage();
  
  const [timelineToDelete, setTimelineToDelete] = useState<Timeline | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isChronoscopeOpen, setIsChronoscopeOpen] = useState(false);
  const [isChronoscopeLoading, setIsChronoscopeLoading] = useState(false);

  useEffect(() => {
    if (timelines.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const tId = params.get('t');
    const aId = params.get('a');

    if (tId) {
      const found = timelines.find(t => t.id === tId);
      if (found) {
        setActiveTimeline(found);
        setCurrentArticleId(aId || found.articles[0]?.id || null);
      }
    }
  }, [timelines]);

  const handleStartTimeline = useCallback(async (prompt: string, minWordCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateArticleContent(prompt, minWordCount);
      const firstArticle: Article = {
        ...data,
        id: crypto.randomUUID(),
        parentId: null,
        branchPrompt: prompt,
        imageUrl: '', 
      };
      
      const newTimeline: Timeline = {
        id: crypto.randomUUID(),
        title: data.headline,
        initialPrompt: prompt,
        minWordCount: minWordCount,
        articles: [firstArticle],
        createdAt: new Date().toISOString(),
      };

      addTimeline(newTimeline);
      setActiveTimeline(newTimeline);
      setCurrentArticleId(firstArticle.id);
      setIsLoading(false);

      generateImage(firstArticle.imagePrompt).then(({ imageUrl }) => {
        setActiveTimeline(curr => {
          if (!curr || curr.id !== newTimeline.id) return curr;
          const updated = curr.articles.map(a => a.id === firstArticle.id ? { ...a, imageUrl } : a);
          const t = { ...curr, articles: updated };
          updateTimeline(t);
          return t;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Temporal failure.");
      setIsLoading(false);
    }
  }, [addTimeline, updateTimeline]);

  const handleSelectBranch = useCallback(async (prompt: string, parent: Article) => {
    if (!activeTimeline) return;
    setIsLoading(true);
    try {
      const data = await generateArticleContent(prompt, activeTimeline.minWordCount || 1200, parent);
      const newArticle: Article = {
        ...data,
        id: crypto.randomUUID(),
        parentId: parent.id,
        branchPrompt: prompt,
        imageUrl: '',
      };

      const updatedTimeline = { ...activeTimeline, articles: [...activeTimeline.articles, newArticle] };
      updateTimeline(updatedTimeline);
      setActiveTimeline(updatedTimeline);
      setCurrentArticleId(newArticle.id);
      setIsLoading(false);

      generateImage(newArticle.imagePrompt).then(({ imageUrl }) => {
        setActiveTimeline(curr => {
          if (!curr || curr.id !== activeTimeline.id) return curr;
          const updated = curr.articles.map(a => a.id === newArticle.id ? { ...a, imageUrl } : a);
          const t = { ...curr, articles: updated };
          updateTimeline(t);
          return t;
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Branching error.");
      setIsLoading(false);
    }
  }, [activeTimeline, updateTimeline]);

  const currentArticle = useMemo(() => 
    activeTimeline?.articles.find(a => a.id === currentArticleId), 
    [activeTimeline, currentArticleId]
  );

  const handleActivateChronoscope = async (article: Article) => {
    if (!activeTimeline) return;
    setIsChronoscopeOpen(true);
    if (article.recoveredArtifact && article.historicalEcho) return;
    setIsChronoscopeLoading(true);
    try {
      const [artifact, echo] = await Promise.all([generateArtifact(article), generateHistoricalEcho(article.branchPrompt)]);
      const updatedArticle = { ...article, recoveredArtifact: artifact, historicalEcho: echo };
      const t = { ...activeTimeline, articles: activeTimeline.articles.map(a => a.id === article.id ? updatedArticle : a) };
      setActiveTimeline(t);
      updateTimeline(t);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChronoscopeLoading(false);
    }
  };

  return (
    <main className="bg-gray-900 min-h-screen font-sans text-white">
      <div className="relative">
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          {activeTimeline && (
            <>
              <button 
                onClick={() => setActiveTimeline(null)} 
                className="px-4 py-2 bg-gray-800/50 text-amber-300 rounded-full hover:bg-gray-700 transition-colors flex items-center gap-2 border border-amber-900/30 shadow-lg"
              >
                <Icon type="back" className="h-4 w-4" /> Home
              </button>
              <button 
                onClick={() => setIsMapViewOpen(true)} 
                className="px-4 py-2 bg-amber-900/40 text-amber-200 rounded-full hover:bg-amber-900/60 transition-colors flex items-center gap-2 border border-amber-500/30 shadow-lg"
              >
                <Icon type="map" className="h-4 w-4" /> Nexus Map
              </button>
            </>
          )}
        </div>

        {error && (
            <div className="fixed top-20 right-4 bg-red-800/90 text-white p-4 rounded z-50 animate-fade-in border border-red-500">
                {error} <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
            </div>
        )}

        {isLoading && !activeTimeline ? (
          <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>
        ) : activeTimeline && currentArticle ? (
          <ArticleView
            article={currentArticle}
            allArticles={activeTimeline.articles}
            onSelectBranch={handleSelectBranch}
            isLoadingNext={isLoading}
            timelineTitle={activeTimeline.title}
            timelineId={activeTimeline.id}
            onNavigateTo={setCurrentArticleId}
            onActivateChronoscope={handleActivateChronoscope}
          />
        ) : (
          <TimelineHome
            timelines={timelines}
            onStartTimeline={handleStartTimeline}
            onSelectTimeline={(t) => { setActiveTimeline(t); setCurrentArticleId(t.articles[0]?.id); }}
            onDeleteTimeline={(id) => setTimelineToDelete(timelines.find(t => t.id === id) || null)}
            onImportTimeline={importTimeline}
          />
        )}

        <ConfirmationModal isOpen={!!timelineToDelete} onConfirm={() => { deleteTimeline(timelineToDelete!.id); setTimelineToDelete(null); }} onCancel={() => setTimelineToDelete(null)} title="Collapse Timeline">
          Are you sure? This branch of history will be permanently erased.
        </ConfirmationModal>

        {isMapViewOpen && activeTimeline && (
          <BranchingMap 
            timeline={activeTimeline} 
            currentArticleId={currentArticleId} 
            onNavigateTo={setCurrentArticleId} 
            onClose={() => setIsMapViewOpen(false)} 
          />
        )}

        {currentArticle && (
            <ChronoscopeModal 
              isOpen={isChronoscopeOpen} 
              onClose={() => setIsChronoscopeOpen(false)} 
              isLoading={isChronoscopeLoading} 
              article={currentArticle} 
              articleIndex={0} 
              totalArticles={1} 
              onNavigate={() => {}} 
            />
        )}
      </div>
    </main>
  );
};

export default App;
