import * as React from 'react';
import { LoadingSpinner } from '@/components/ui-custom/states';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner label="Loading dashboard assets..." />
    </div>
  );
}
