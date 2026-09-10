import React from 'react';

interface ErrorDisplayProps {
  error: Error | null;
  onRetry?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center ${className}`}>
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-red-400 mb-2">Произошла ошибка</h3>
      <p className="text-red-300 text-sm mb-4">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
        >
          Попробовать снова
        </button>
      )}
    </div>
  );
};

interface LoadingDisplayProps {
  message?: string;
  className?: string;
}

export const LoadingDisplay: React.FC<LoadingDisplayProps> = ({ 
  message = 'Загрузка...', 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center p-20 ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <div className="text-white text-xl animate-pulse">{message}</div>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = '📭', 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <div className={`text-center py-20 animate-fade-in ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
};
