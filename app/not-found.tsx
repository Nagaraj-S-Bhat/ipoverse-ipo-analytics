import * as React from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center max-w-md mx-auto px-4 select-none">
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 flex items-center justify-center text-neutral-400 dark:text-zinc-500 mb-4">
        <HelpCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Page Not Found</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-6 leading-relaxed">
        The page you are looking for does not exist or may have been relocated.
      </p>
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'default' }),
          'h-9 rounded-xl text-xs px-5'
        )}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
