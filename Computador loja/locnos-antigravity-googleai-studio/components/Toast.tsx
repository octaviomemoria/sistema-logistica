import React, { useEffect } from 'react';
import { CheckCircleIcon } from './Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-5 right-5 z-50">
      <div className={`${bgColor} text-white font-bold rounded-lg shadow-lg flex items-center p-4`}>
        <CheckCircleIcon className="w-6 h-6 mr-3" />
        <p>{message}</p>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;