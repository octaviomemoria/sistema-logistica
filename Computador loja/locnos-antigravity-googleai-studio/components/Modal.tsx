import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" 
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
      onClick={onClose}
    >
      {/* FIX: Increased max-width from md to 4xl to better accommodate complex forms and provide a better user experience on larger screens. */}
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 m-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3">
          <h3 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;