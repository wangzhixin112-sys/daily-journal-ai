import React from 'react';

interface ToastNotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  show: boolean;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  message, 
  type, 
  onClose, 
  show 
}) => {
  if (!show) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-500 border-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-2 15-5-5 1.414-1.414L10 14.172l7.586-7.586L19 8l-9 9z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bg: 'bg-red-500 border-red-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-500 border-blue-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-amber-500 border-amber-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
      <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-xl shadow-slate-200 ${typeConfig[type].bg} border-l-4 text-white max-w-xs transform hover:scale-105 transition-transform duration-200`}>
        <div className="text-white">
          {typeConfig[type].icon}
        </div>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose} 
          className="text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
