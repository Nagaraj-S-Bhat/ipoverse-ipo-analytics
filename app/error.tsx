'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Unhandled runtime routing error:', error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto px-4 py-12 select-none">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Application Error</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-6 leading-relaxed">
        An unexpected error occurred while loading this page. This could be due to network fluctuations.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()} variant="outline" className="h-9 rounded-xl text-xs">
          Reload Page
        </Button>
        <Button onClick={() => reset()} className="h-9 rounded-xl text-xs gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
