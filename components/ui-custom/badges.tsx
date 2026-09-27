import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface IpoTypeBadgeProps {
  type: 'MAINBOARD' | 'SME' | string;
  className?: string;
}

export function IpoTypeBadge({ type, className }: IpoTypeBadgeProps) {
  const isSme = (type || '').toUpperCase() === 'SME';
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono text-xs tracking-wider uppercase px-2 py-0.5 rounded-md font-medium border transition-colors',
        isSme
          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-700'
          : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700',
        className
      )}
    >
      {type || 'IPO'}
    </Badge>
  );
}

interface ExchangeBadgeProps {
  exchange: 'NSE' | 'BSE' | 'NSE_BSE' | string;
  className?: string;
}

export function ExchangeBadge({ exchange, className }: ExchangeBadgeProps) {
  let label = exchange;
  let themeStyles = 'bg-neutral-50 text-neutral-700 border-neutral-200 dark:bg-neutral-900/50 dark:text-neutral-300 dark:border-neutral-800';

  if (exchange === 'NSE_BSE' || exchange.toLowerCase().includes('both') || exchange.toLowerCase().includes('nse & bse')) {
    label = 'NSE & BSE';
    themeStyles = 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:border-slate-800';
  } else if (exchange === 'NSE') {
    themeStyles = 'bg-blue-50/30 text-blue-600 border-blue-100 dark:bg-blue-950/10 dark:text-blue-400 dark:border-blue-900/40';
  } else if (exchange === 'BSE') {
    themeStyles = 'bg-orange-50/30 text-orange-600 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/40';
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-sans text-xs px-2 py-0.5 rounded-md border font-medium transition-colors',
        themeStyles,
        className
      )}
    >
      {label}
    </Badge>
  );
}

interface GmpBadgeProps {
  gmpValue: number;
  gainPercent: number;
  className?: string;
}

export function GmpBadge({ gmpValue, gainPercent, className }: GmpBadgeProps) {
  const isPositive = gmpValue > 0;
  const isNegative = gmpValue < 0;
  const formattedPercent = gainPercent > 0 ? `+${gainPercent.toFixed(2)}%` : `${gainPercent.toFixed(2)}%`;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono text-xs px-2 py-0.5 rounded-md border font-medium transition-colors flex items-center gap-1.5 w-fit',
        isPositive
          ? 'bg-emerald-50/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/40'
          : isNegative
          ? 'bg-red-50/60 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/40'
          : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-400 dark:border-neutral-800/60',
        className
      )}
    >
      <span>₹{gmpValue}</span>
      {gmpValue !== 0 && (
        <span className="text-[10px] opacity-80 font-sans font-normal">({formattedPercent})</span>
      )}
    </Badge>
  );
}

interface ListingBadgeProps {
  status: 'UPCOMING' | 'OPEN' | 'CLOSED' | 'LISTED' | 'WITHDRAWN' | 'POSTPONED' | string;
  className?: string;
}

export function ListingBadge({ status, className }: ListingBadgeProps) {
  const normalizedStatus = (status || '').toUpperCase();
  let styles = 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/40 dark:text-neutral-400 dark:border-neutral-800';

  switch (normalizedStatus) {
    case 'OPEN':
      styles = 'bg-emerald-50/60 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-800/40';
      break;
    case 'UPCOMING':
      styles = 'bg-blue-100 text-blue-800 border-blue-300 font-semibold dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-700';
      break;
    case 'CLOSED':
      styles = 'bg-amber-50/60 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-800/40';
      break;
    case 'LISTED':
      styles = 'bg-indigo-50/60 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-800/40';
      break;
    case 'WITHDRAWN':
    case 'POSTPONED':
      styles = 'bg-red-50/60 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800/40';
      break;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-sans text-xs px-2 py-0.5 rounded-md border font-medium tracking-wide transition-colors',
        styles,
        className
      )}
    >
      {status}
    </Badge>
  );
}
