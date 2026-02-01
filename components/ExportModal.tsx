
import React from 'react';
import Icon from './Icon';

interface ExportModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onExport: (format: 'html' | 'json') => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onCancel, onExport }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
      aria-labelledby="export-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="export-modal-title" className="text-2xl font-serif text-amber-200">Export Timeline</h2>
          <button onClick={onCancel} className="p-1 -mt-1 -mr-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700" aria-label="Close modal">
            <Icon type="close" className="h-6 w-6" />
          </button>
        </div>
        
        <p className="text-amber-100/90 mb-6">Choose a format to export your timeline. HTML is best for sharing and viewing, while JSON is ideal for backups.</p>

        <div className="space-y-4">
          <button
            onClick={() => onExport('html')}
            className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-amber-600 rounded-lg transition-all"
          >
            <h3 className="font-bold text-lg text-amber-300">Interactive HTML File</h3>
            <p className="text-sm text-amber-200/80">A single, self-contained file with text, images, and playable audio narration. Perfect for sharing.</p>
          </button>
          
          <button
            onClick={() => onExport('json')}
            className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-amber-600 rounded-lg transition-all"
          >
            <h3 className="font-bold text-lg text-amber-300">Timeline Data (JSON)</h3>
            <p className="text-sm text-amber-200/80">A compact data file containing all text content. Ideal for saving space and backing up your work.</p>
          </button>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-amber-100 rounded-md hover:bg-gray-500 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;