import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, Dot } from 'lucide-react';

interface TimelineNode {
  label: string;
  date: Date;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  description?: string;
}

interface IpoTimelineProps {
  nodes: TimelineNode[];
  className?: string;
}

export function IpoTimeline({ nodes, className }: IpoTimelineProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className={cn('w-full py-4', className)}>
      {/* Horizontal Layout (Desktop only - hidden on mobile) */}
      <div className="hidden md:flex items-center justify-between relative w-full px-4">
        {/* Connecting line */}
        <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-neutral-100 dark:bg-zinc-800 -z-10" />
        
        {nodes.map((node, idx) => {
          const isCompleted = node.status === 'COMPLETED';
          const isActive = node.status === 'ACTIVE';

          return (
            <div key={idx} className="flex flex-col items-center text-center flex-1 relative">
              {/* Node Indicator */}
              <div
                className={cn(
                  'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all bg-white dark:bg-zinc-950',
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 shadow-md ring-4 ring-blue-500/10'
                    : 'border-neutral-200 text-neutral-300 dark:border-zinc-800 dark:text-zinc-700'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-zinc-800" />
                )}
              </div>

              {/* Text Descriptors */}
              <div className="mt-3.5 space-y-1">
                <span className={cn(
                  'text-xs font-semibold block uppercase tracking-wide',
                  isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-neutral-500 dark:text-neutral-400'
                )}>
                  {node.label}
                </span>
                <span className="text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200">
                  {formatDate(node.date)}
                </span>
                {node.description && (
                  <span className="text-[10px] text-neutral-400 block max-w-[120px] mx-auto opacity-80 leading-relaxed">
                    {node.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical Layout (Mobile/Tablet only) */}
      <div className="flex md:hidden flex-col relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100 dark:before:bg-zinc-800">
        {nodes.map((node, idx) => {
          const isCompleted = node.status === 'COMPLETED';
          const isActive = node.status === 'ACTIVE';

          return (
            <div key={idx} className="relative flex flex-col justify-start">
              {/* Dot overlay indicator */}
              <div
                className={cn(
                  'absolute -left-6 top-0.5 -translate-x-[5px] w-4.5 h-4.5 rounded-full border flex items-center justify-center bg-white dark:bg-zinc-950 transition-all',
                  isCompleted
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : isActive
                    ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 ring-4 ring-blue-500/10'
                    : 'border-neutral-200 dark:border-zinc-800'
                )}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-neutral-200 dark:bg-zinc-800" />
                )}
              </div>

              {/* Text Descriptors */}
              <div className="pl-4 space-y-1">
                <span className={cn(
                  'text-[10px] font-bold block uppercase tracking-wide',
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
                )}>
                  {node.label}
                </span>
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 block">
                  {formatDate(node.date)}
                </span>
                {node.description && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5 opacity-95">
                    {node.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
