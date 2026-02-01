
import { useState, useCallback, useEffect } from 'react';
import type { Timeline, Article } from '../types';

const STORAGE_KEY = 'timeline_weaver_timelines_v2';

const validateArticle = (article: any): Article => ({
  id: article.id || crypto.randomUUID(),
  parentId: article.parentId || null,
  headline: article.headline || 'Untitled Chapter',
  byline: article.byline || '',
  intro: article.intro || '',
  body: Array.isArray(article.body) ? article.body : [],
  groundPOV: article.groundPOV || { format: 'Account', content: '' },
  imageUrl: article.imageUrl || '',
  imagePrompt: article.imagePrompt || '',
  branchPrompt: article.branchPrompt || '',
  soundscapePrompt: article.soundscapePrompt || 'Default historical atmosphere.',
  pivotPoints: Array.isArray(article.pivotPoints) ? article.pivotPoints : [],
  systemicConsequences: article.systemicConsequences || { technological: 50, cultural: 50, political: 50, summary: '' },
  plausibility: article.plausibility || { score: 100, frictionNote: '' },
  recoveredArtifact: article.recoveredArtifact,
  historicalEcho: article.historicalEcho,
});

export const useTimelineStorage = () => {
  const [timelines, setTimelines] = useState<Timeline[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setTimelines(parsed.map((t: any) => ({
        ...t,
        minWordCount: typeof t.minWordCount === 'number' ? t.minWordCount : 1200,
        articles: t.articles.map(validateArticle)
      })));
    }
  }, []);

  const saveTimelines = useCallback((updated: Timeline[]) => {
    setTimelines(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addTimeline = (t: Timeline) => saveTimelines([...timelines, t]);
  
  const updateTimeline = (updatedTimeline: Timeline) => {
    const updated = timelines.map(t => t.id === updatedTimeline.id ? updatedTimeline : t);
    saveTimelines(updated);
  };

  const deleteTimeline = (id: string) => saveTimelines(timelines.filter(t => t.id !== id));

  const importTimeline = (data: any) => {
    const validated = { 
      ...data, 
      minWordCount: typeof data.minWordCount === 'number' ? data.minWordCount : 1200,
      articles: data.articles.map(validateArticle) 
    };
    addTimeline(validated);
  };

  return { timelines, addTimeline, updateTimeline, deleteTimeline, importTimeline };
};
