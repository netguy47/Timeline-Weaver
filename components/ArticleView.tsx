
import React, { useEffect, useState, useMemo } from 'react';
import type { Article, Artifact } from '../types';
import { useSpeech } from '../hooks/useSpeech';
import Icon from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface ArticleViewProps {
  article: Article;
  allArticles: Article[];
  onSelectBranch: (prompt: string, parent: Article) => void;
  isLoadingNext: boolean;
  timelineTitle: string;
  timelineId: string;
  onNavigateTo: (id: string) => void;
  onActivateChronoscope: (article: Article) => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ 
  article, 
  allArticles,
  onSelectBranch, 
  isLoadingNext, 
  timelineTitle, 
  timelineId,
  onNavigateTo, 
  onActivateChronoscope 
}) => {
  const narration = useSpeech();
  const ambient = useSpeech();
  
  const [pov, setPov] = useState<'archive' | 'ground'>('archive');
  const [showShareToast, setShowShareToast] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const povParam = params.get('pov');
    if (povParam === 'ground') setPov('ground');
  }, []);

  const currentText = pov === 'archive' 
    ? [article.headline, `By ${article.byline}`, article.intro, ...article.body].join('\n\n')
    : [`Perspective: ${article.groundPOV.format}`, article.groundPOV.content].join('\n\n');

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?t=${timelineId}&a=${article.id}&pov=${pov}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy share link: ', err);
    }
  };

  const breadcrumbs = useMemo(() => {
    const path: Article[] = [];
    let curr: Article | undefined = article;
    while (curr) {
      path.unshift(curr);
      curr = allArticles.find(a => a.id === curr?.parentId);
    }
    return path;
  }, [article, allArticles]);

  const currentIndex = useMemo(() => allArticles.findIndex(a => a.id === article.id), [allArticles, article.id]);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null;

  const handleNarrationAction = () => {
    // Explicitly resume audio context on user gesture
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    if (narration.isPreparing) return;
    if (narration.isSpeaking) {
      if (narration.isPaused) narration.resume();
      else narration.pause();
    } else {
      narration.speak(currentText, article.soundscapePrompt);
    }
  };

  const handleAmbientAction = () => {
    // Explicitly resume audio context on user gesture
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();

    if (ambient.isPreparing) return;
    if (ambient.isSpeaking) {
      if (ambient.isPaused) ambient.resume();
      else ambient.pause();
    } else {
      ambient.speak("", article.soundscapePrompt, true);
    }
  };

  const handleDiscoverArtifact = async () => {
    setIsDiscovering(true);
    await onActivateChronoscope(article);
    setIsDiscovering(false);
  };

  const ImpactBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-tighter text-amber-400/60">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 animate-fade-in relative font-serif">
      {showShareToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-amber-700/90 text-white px-6 py-3 rounded-full shadow-2xl z-50 border border-amber-500 font-serif flex items-center gap-2 transition-all animate-bounce">
          <Icon type="share" className="h-4 w-4" /> Temporal Link Captured
        </div>
      )}

      {/* Sequential Nav */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/20 pb-4">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-amber-500/50">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.id}>
              <button onClick={() => onNavigateTo(b.id)} className={`hover:text-amber-300 transition-colors ${b.id === article.id ? 'text-amber-300' : ''}`}>
                {b.headline.slice(0, 15)}...
              </button>
              {i < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </nav>
        
        <div className="flex items-center gap-3">
          <button disabled={!prevArticle} onClick={() => prevArticle && onNavigateTo(prevArticle.id)} className="px-3 py-1 bg-gray-800/50 border border-amber-900/30 rounded text-[10px] uppercase text-amber-500 hover:text-amber-200 disabled:opacity-20">
            <Icon type="back" className="h-3 w-3" /> Previous
          </button>
          <span className="text-[10px] font-mono text-amber-900">{currentIndex + 1} / {allArticles.length}</span>
          <button disabled={!nextArticle} onClick={() => nextArticle && onNavigateTo(nextArticle.id)} className="px-3 py-1 bg-gray-800/50 border border-amber-900/30 rounded text-[10px] uppercase text-amber-500 hover:text-amber-200 disabled:opacity-20">
            Next <Icon type="forward" className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <div className="bg-amber-950/20 p-5 rounded-lg border border-amber-600/30 sticky top-8">
            <h4 className="text-[10px] text-amber-400 mb-3 uppercase tracking-widest font-mono">Archive Atmosphere</h4>
            <button 
              onClick={handleAmbientAction}
              disabled={ambient.isPreparing}
              className={`w-full py-2 rounded flex items-center justify-center gap-2 text-[10px] font-mono tracking-widest uppercase transition-all ${ambient.isPreparing ? 'bg-amber-800/20 text-amber-500' : 'bg-amber-700/20 text-amber-300 hover:bg-amber-700/40 border border-amber-600/30'}`}
            >
              {ambient.isPreparing ? 'Connecting...' : ambient.isSpeaking && !ambient.isPaused ? 'Pause AMB' : 'Play AMB'}
            </button>
            <p className="mt-3 text-[9px] text-amber-100/30 leading-tight italic">Immersive historical foley is generated for this specific timeline nexus.</p>
          </div>

          <div className="bg-gray-800/40 p-5 rounded-lg border border-amber-900/30">
            <h4 className="text-[10px] text-amber-400 mb-4 uppercase tracking-widest font-mono">Causal Metrics</h4>
            <div className="space-y-4">
              <ImpactBar label="Technological" value={article.systemicConsequences.technological} color="bg-blue-500" />
              <ImpactBar label="Cultural" value={article.systemicConsequences.cultural} color="bg-purple-500" />
              <ImpactBar label="Political" value={article.systemicConsequences.political} color="bg-red-500" />
            </div>
          </div>
          
          {/* Artifact discovery */}
          <div className="bg-sky-950/20 p-5 rounded-lg border border-sky-500/30">
             <h4 className="text-[10px] text-sky-400 mb-2 uppercase tracking-widest font-mono">Discovery Log</h4>
             {article.recoveredArtifact ? (
               <div className="animate-fade-in">
                 <h5 className="text-xs font-bold text-sky-100 mb-2">{article.recoveredArtifact.title}</h5>
                 <button onClick={() => onActivateChronoscope(article)} className="text-[10px] text-sky-400 underline uppercase tracking-tighter">Read in Chronoscope</button>
               </div>
             ) : (
               <button onClick={handleDiscoverArtifact} disabled={isDiscovering} className="w-full py-2 rounded border border-sky-500/30 text-[10px] font-mono text-sky-400 bg-sky-500/10 hover:bg-sky-500/20">
                 {isDiscovering ? 'Decoding...' : 'Extract Artifact'}
               </button>
             )}
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-9 order-1 lg:order-2">
          <header className="mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
              <h1 className="text-5xl md:text-6xl font-serif font-black text-amber-100 leading-tight flex-grow">{article.headline}</h1>
              <div className="flex shrink-0 gap-2">
                <button 
                  onClick={handleShare} 
                  className="flex items-center gap-2 px-4 py-2 bg-amber-700/20 text-amber-300 border border-amber-800 rounded-full hover:bg-amber-700/40 transition-all text-xs font-bold font-mono tracking-widest uppercase"
                >
                  <Icon type="share" className="h-4 w-4" /> Share Article
                </button>
                <button 
                  onClick={() => onActivateChronoscope(article)} 
                  className="p-2 bg-sky-900 rounded-full text-white hover:bg-sky-800 transition-all shadow-lg"
                  title="Activate Chronoscope"
                >
                  <Icon type="chronoscope" className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-lg text-amber-500/70 italic border-l-4 border-amber-600 pl-6 py-2">{article.byline}</p>
          </header>

          <div className="mb-12">
            {article.imageUrl ? (
              <div className="relative group">
                <img src={article.imageUrl} className="w-full rounded-lg shadow-2xl sepia-[0.3] brightness-90 border border-amber-900/40 transition-all duration-700 group-hover:sepia-0 group-hover:brightness-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none rounded-lg" />
              </div>
            ) : <LoadingSpinner text="Synthesizing visual record..." />}
          </div>

          {/* Narration Queue Progress */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-12 bg-amber-900/10 p-6 rounded-xl border border-amber-900/30">
            <button 
              onClick={handleNarrationAction} 
              disabled={narration.isPreparing}
              className={`p-4 rounded-full text-white shadow-2xl transition-all hover:scale-110 ${narration.isPreparing ? 'bg-gray-600 animate-pulse' : 'bg-amber-700 hover:bg-amber-600'}`}
            >
              {narration.isPreparing ? <Icon type="stop" /> : narration.isSpeaking && !narration.isPaused ? <Icon type="pause" /> : <Icon type="play" />}
            </button>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-mono text-amber-400 tracking-widest">
                  {narration.isSpeaking ? `Transmitting Node ${narration.currentIndex + 1} of ${narration.totalChunks}` : 'High-Fidelity Narration Available'}
                </span>
                {narration.isSpeaking && <span className="text-[10px] font-mono text-amber-600">{Math.round((narration.currentIndex / narration.totalChunks) * 100)}% Complete</span>}
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${(narration.currentIndex / narration.totalChunks) * 100}%` }} />
              </div>
            </div>
            {narration.isSpeaking && (
              <button onClick={narration.cancel} className="text-[10px] uppercase font-mono text-red-500 hover:text-red-400">Kill Link</button>
            )}
          </div>

          {/* Long Form Article Content */}
          <div className="max-w-none">
            <div className="flex bg-gray-900/50 p-1 rounded-full w-fit mb-10 border border-amber-900/20">
              <button onClick={() => setPov('archive')} className={`px-8 py-2 rounded-full text-xs font-bold transition-all ${pov === 'archive' ? 'bg-amber-700 text-white' : 'text-amber-500/40 hover:text-amber-400'}`}>THE ARCHIVE</button>
              <button onClick={() => setPov('ground')} className={`px-8 py-2 rounded-full text-xs font-bold transition-all ${pov === 'ground' ? 'bg-sky-800 text-white' : 'text-sky-500/40 hover:text-sky-400'}`}>GROUND ZERO</button>
            </div>

            <div className={`prose prose-invert prose-lg max-w-none leading-relaxed transition-opacity duration-500 ${pov === 'archive' ? 'opacity-100' : 'opacity-100'}`}>
              {pov === 'archive' ? (
                <>
                  <p className="text-2xl font-serif text-amber-100 mb-10 first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-amber-600 leading-snug">
                    {article.intro}
                  </p>
                  <div className="space-y-8 text-amber-50/80">
                    {article.body.map((p, i) => <p key={i} className="mb-6">{p}</p>)}
                  </div>
                </>
              ) : (
                <div className="bg-sky-950/10 p-10 rounded border-l-8 border-sky-800 italic text-sky-50/90 font-serif">
                   <h3 className="not-italic font-mono text-xs text-sky-500 mb-6 uppercase tracking-widest">Transcript Recovered: {article.groundPOV.format}</h3>
                   {article.groundPOV.content.split('\n\n').map((p, i) => <p key={i} className="mb-6">{p}</p>)}
                </div>
              )}
            </div>
          </div>

          {/* Pivot Points */}
          <section className="mt-24 pt-12 border-t border-amber-900/30">
            <h3 className="text-3xl font-serif text-amber-200 mb-10">Historical Divergence Vectors</h3>
            {isLoadingNext ? <LoadingSpinner text="Computing Causal Rip... " /> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {article.pivotPoints.map((point) => (
                  <button key={point.id} onClick={() => onSelectBranch(point.description, article)} className="group p-8 bg-gray-800/20 border border-amber-900/50 rounded-xl text-left hover:border-amber-400 transition-all hover:-translate-y-2">
                    <span className="text-[10px] font-mono text-amber-600 block mb-4 tracking-widest uppercase">Select Vector</span>
                    <h4 className="text-amber-100 font-bold text-xl mb-3 group-hover:text-amber-400">{point.title}</h4>
                    <p className="text-xs text-amber-100/50 leading-relaxed">{point.description}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
