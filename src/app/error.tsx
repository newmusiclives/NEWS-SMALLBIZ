'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-8">
      <div className="bg-surface rounded-xl border border-line p-8 max-w-md text-center">
        <h2 className="text-xl font-bold text-danger mb-4">Something went wrong</h2>
        <p className="text-text-secondary mb-2">{error.message}</p>
        <p className="text-text-muted text-sm mb-6">Check the browser console for details.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
