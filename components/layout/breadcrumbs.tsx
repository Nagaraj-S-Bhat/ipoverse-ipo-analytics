'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Split pathname into segments, removing empty elements
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-neutral-400 dark:text-neutral-500 font-sans py-2.5">
      <Link
        href="/"
        className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        const href = `/${segments.slice(0, idx + 1).join('/')}`;
        
        // Normalize segment label: remove dashes and capitalize
        const label = segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 pointer-events-none" />
            {isLast ? (
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 select-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
