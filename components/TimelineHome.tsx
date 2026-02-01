
import React, { useState, useRef } from 'react';
import type { Timeline } from '../types';
import Icon from './Icon';

interface TimelineHomeProps {
  timelines: Timeline[];
  onStartTimeline: (prompt: string, minWordCount: number) => void;
  onSelectTimeline: (timeline: Timeline) => void;
  onDeleteTimeline: (timelineId: string) => void;
  onImportTimeline: (file: File) => void;
}

const examplePrompts = [
  "What if a Roman Legion discovered steam power in 50 CE?",
  "What if the internet was invented in the 1920s using radio tubes?",
  "What if Genghis Khan turned West toward Europe with an army of engineers?"
];

const TimelineHome: React.FC<TimelineHomeProps> = ({ timelines, onStartTimeline, onSelectTimeline, onDeleteTimeline, onImportTimeline }) => {
  const [prompt, setPrompt] = useState('');
  const [minWords, setMinWords] = useState(1200);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-12 text-amber-50 animate-fade-in">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-amber-600">
          Timeline Weaver
        </h1>
        <p className="text-xl text-amber-500 font-mono tracking-widest uppercase">Systemic Causal Simulation Engine</p>
      </div>

      <div className="bg-gray-800/30 backdrop-blur-md p-8 rounded-2xl border border-amber-900/50 shadow-2xl mb-16">
        <h2 className="text-3xl font-serif text-amber-200 mb-6">Initiate Simulation</h2>
        <form onSubmit={(e) => { e.preventDefault(); onStartTimeline(prompt, minWords); }} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Introduce a historical causality shift..."
              className="flex-grow bg-black/40 border-2 border-amber-900/50 rounded-xl px-6 py-4 text-amber-100 placeholder-amber-700 focus:border-amber-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-10 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-amber-900/20"
            >
              Compute Reality
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-xs font-mono text-amber-600 uppercase tracking-widest">Article Min Word Count:</label>
            <input 
              type="number"
              value={minWords}
              onChange={(e) => setMinWords(parseInt(e.target.value) || 1200)}
              className="w-24 bg-black/40 border border-amber-900/50 rounded-lg px-3 py-1 text-amber-100 text-center outline-none focus:border-amber-500"
              min="500"
              max="5000"
              step="100"
            />
            <span className="text-[10px] text-amber-500/40 italic">Deep simulation requires higher word counts for causality resolution.</span>
          </div>
        </form>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {examplePrompts.map((p, i) => (
            <button key={i} onClick={() => setPrompt(p)} className="text-xs text-amber-500 hover:text-amber-300 p-2 border border-amber-900/30 rounded-lg hover:border-amber-700 transition-all text-left">
              "{p}"
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-serif text-amber-200">Simulation Registry</h2>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-amber-400 border border-amber-900/50 hover:bg-gray-700 transition-colors">
                <Icon type="import" /> Import Trace
            </button>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onImportTimeline(e.target.files[0])} accept=".json" className="hidden" />
        </div>
        
        {timelines.length === 0 ? (
          <div className="p-20 border-2 border-dashed border-amber-900/30 rounded-2xl text-center text-amber-700 font-serif italic text-lg">
            No causal data found in local matrix.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {timelines.slice().reverse().map(t => (
              <div key={t.id} className="group relative bg-gray-800/20 border border-amber-900/30 p-6 rounded-2xl hover:border-amber-600 transition-all cursor-pointer overflow-hidden" onClick={() => onSelectTimeline(t)}>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex-grow">
                    <h3 className="text-xl font-serif text-amber-100 group-hover:text-amber-300 transition-colors mb-2">{t.title}</h3>
                    <div className="flex gap-4 text-[10px] text-amber-600 font-mono tracking-tighter uppercase">
                        <span>{t.articles.length} Nodes</span>
                        <span>Min {t.minWordCount || 1200} words</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteTimeline(t.id); }} className="p-2 text-gray-600 hover:text-red-500">
                    <Icon type="delete" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineHome;
