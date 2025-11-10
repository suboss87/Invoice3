import React, { useState, useEffect } from 'react';
import { 
  CheckCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

type ToastType = 'success' | 'warning' | 'info' | 'error';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  id,
  message, 
  type, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for fade-out animation
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose, id]);
  
  const getToastIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getToastClasses = () => {
    switch (type) {
      case 'success':
        return 'border-green-100 bg-green-50';
      case 'warning':
        return 'border-yellow-100 bg-yellow-50';
      case 'error':
        return 'border-red-100 bg-red-50';
      case 'info':
      default:
        return 'border-blue-100 bg-blue-50';
    }
  };
  
  return (
    <div 
      className={`transform transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
    >
      <div className={`flex items-start p-3 border rounded-md shadow-sm ${getToastClasses()}`}>
        <div className="flex-shrink-0 mr-3">
          {getToastIcon()}
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <button 
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(id), 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {children}
    </div>
  );
};