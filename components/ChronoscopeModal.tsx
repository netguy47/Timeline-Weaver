
import React from 'react';
import Icon from './Icon';
import type { Article } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ChronoscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  article: Article | null;
  onNavigate: (direction: 'prev' | 'next') => void;
  articleIndex: number;
  totalArticles: number;
}

const ChronoscopeModal: React.FC<ChronoscopeModalProps> = ({ isOpen, onClose, isLoading, article, onNavigate, articleIndex, totalArticles }) => {
  if (!isOpen) {
    return null;
  }

  const { recoveredArtifact, historicalEcho } = article || {};

  const hasPrevious = articleIndex > 0;
  const hasNext = articleIndex < totalArticles - 1;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      aria-labelledby="chronoscope-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border-2 border-sky-500/30 rounded-lg shadow-2xl p-6 md:p-8 max-w-2xl w-full mx-4 text-sky-100 flex flex-col transform transition-all"
        onClick={(e) => e.stopPropagation()}
        style={{fontFamily: `'Courier New', Courier, monospace`}}
      >
        <div className="flex justify-between items-start">
          <h2 id="chronoscope-title" className="text-2xl text-sky-300 tracking-widest">[CHRONOSCOPE]</h2>
          <button onClick={onClose} className="p-1 -mt-1 -mr-1 rounded-full text-sky-300 hover:text-white hover:bg-sky-700/50" aria-label="Close Chronoscope">
            <Icon type="close" className="h-6 w-6" />
          </button>
        </div>
        <div className="w-full h-px bg-sky-500/30 my-4"></div>
        
        <div className="min-h-[350px]">
          {isLoading ? (
              <div className="h-full flex items-center justify-center">
                  <LoadingSpinner text="Calibrating Temporal Resonators..." />
              </div>
          ) : (
              <div className="space-y-8">
                  {recoveredArtifact && (
                      <div className="p-4 bg-black/30 border border-sky-800 rounded animate-fade-in">
                          <h3 className="text-lg text-sky-300 mb-1">// RECOVERED ARTIFACT //</h3>
                          <p className="text-sky-400 text-sm mb-3">TYPE: {recoveredArtifact.type}</p>
                          <div className="bg-gray-800/50 p-4 rounded-sm border border-gray-700 max-h-40 overflow-y-auto">
                             <h4 className="font-bold text-sky-200 mb-2">{recoveredArtifact.title}</h4>
                             <p className="text-sky-200 whitespace-pre-wrap leading-relaxed">{recoveredArtifact.content}</p>
                          </div>
                      </div>
                  )}

                  {historicalEcho && (
                      <div className="p-4 bg-black/30 border border-sky-800 rounded animate-fade-in">
                          <h3 className="text-lg text-sky-300 mb-2">// HISTORICAL ECHO //</h3>
                           <div className="bg-gray-800/50 p-4 rounded-sm border border-gray-700">
                             <p className="text-sky-200 leading-relaxed">{historicalEcho}</p>
                          </div>
                      </div>
                  )}

                  {!recoveredArtifact && !historicalEcho && !isLoading && (
                      <div className="text-center py-8 text-sky-400 h-full flex items-center justify-center">
                          <p>No additional data available for this temporal signature.</p>
                      </div>
                  )}
              </div>
          )}
        </div>

        <div className="w-full h-px bg-sky-500/30 my-4"></div>
        <div className="flex justify-between items-center">
            <button
                onClick={() => onNavigate('prev')}
                disabled={!hasPrevious || isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sky-300 rounded-md hover:bg-sky-800/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <Icon type="back" className="h-5 w-5" />
                Previous
            </button>
            <span className="text-sky-400 text-sm">
                ECHO {articleIndex + 1} / {totalArticles}
            </span>
            <button
                onClick={() => onNavigate('next')}
                disabled={!hasNext || isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sky-300 rounded-md hover:bg-sky-800/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Next
                <Icon type="forward" className="h-5 w-5" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChronoscopeModal;