
import React from 'react';
import Icon from './Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, title, children }) => {
  if (!isOpen) {
    return null;
  }

  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl p-6 md:p-8 max-w-md w-full mx-4 transform transition-all"
        onClick={handleModalContentClick}
      >
        <div className="flex justify-between items-start">
            <h2 id="modal-title" className="text-2xl font-serif text-amber-200">{title}</h2>
            <button onClick={onCancel} className="p-1 -mt-1 -mr-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" aria-label="Close modal">
                <Icon type="close" className="h-6 w-6" />
            </button>
        </div>
        <div className="mt-4 text-amber-100/90">
            {children}
        </div>
        <div className="mt-8 flex justify-end gap-4">
            <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 text-amber-100 rounded-md hover:bg-gray-600 transition-colors font-semibold"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-700 text-white font-bold rounded-md hover:bg-red-600 transition-colors"
            >
                Confirm Delete
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;