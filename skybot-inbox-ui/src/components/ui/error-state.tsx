'use client';

import * as React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  heightClass?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this content.',
  onRetry,
  heightClass = 'h-64'
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-500/10 bg-red-500/5 ${heightClass}`}>
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="ui-btn ui-btn--primary flex items-center gap-2 text-xs h-9"
        >
          <RefreshCcw size={14} />
          Try Again
        </button>
      )}
    </div>
  );
}
