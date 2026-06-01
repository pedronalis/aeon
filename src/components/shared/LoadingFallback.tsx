import React from 'react';

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Carregando...',
}) => (
  <div className="flex items-center justify-center min-h-[60vh] bg-background text-text">
    <div className="text-center space-y-4">
      <div className="text-4xl animate-torch-flicker">&#128293;</div>
      <p className="font-heading text-text-secondary">{message}</p>
    </div>
  </div>
);
