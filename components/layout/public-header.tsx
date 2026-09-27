'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PublicSidebar } from './public-sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from '../theme-toggle';
import { Menu, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [updatedTime, setUpdatedTime] = React.useState('');

  React.useEffect(() => {
    // Generate readable local timestamp for "Last Sync"
    const now = new Date();
    setUpdatedTime(now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST');
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/40 bg-white/70 backdrop-blur-xl text-slate-800 font-sans shadow-[0_1px_3px_rgba(0,0,0,0.01),0_2px_8px_rgba(0,0,0,0.01)] transition-all">
      <div className="flex h-14 items-center justify-between px-6 gap-6">
        {/* Left Segment: Hamburger Menu & Mobile Brand */}
        <div className="flex items-center gap-4">
          {/* Hamburger Mobile Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'w-9 h-9 rounded-xl border border-slate-200 md:hidden text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors shrink-0'
              )}
            >
              <Menu className="w-4.5 h-4.5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-slate-200 bg-white">
              <PublicSidebar onItemClick={() => setMobileOpen(false)} className="border-r-0 h-full w-full" />
            </SheetContent>
          </Sheet>

          {/* Mobile Logo Brand with startup icon */}
          <Link href="/" className="flex items-center gap-2 md:hidden select-none">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-650 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/10">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fillOpacity="0.85" />
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              IPO<span className="text-blue-600 font-bold">Verse</span>
            </span>
          </Link>

          {/* Breadcrumb locator (Desktop only) */}
          <div className="hidden md:block select-none">
            <Breadcrumbs />
          </div>
        </div>

        {/* Middle Segment: Centered Premium Rounded Search Box */}
        <div className="hidden sm:block flex-1 max-w-sm mx-auto">
          <div className="relative group w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Search IPO listings..."
              className="w-full bg-slate-50/70 border border-slate-200/50 rounded-full pl-10 pr-12 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all duration-200 font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
            />
            <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-400 shadow-sm">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>

        {/* Right Segment: Status indicators, Timers & Toggle */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Better LIVE market badge */}
          <div className="flex items-center gap-1.5 border border-emerald-250/30 bg-emerald-50/70 text-emerald-700 rounded-full px-3 py-1 text-[10px] font-bold tracking-wide shadow-sm shadow-emerald-500/5 select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] uppercase tracking-wider">Market Live</span>
          </div>

          {/* Better Last Sync badge */}
          {updatedTime && (
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-200/80 pl-4 py-0.5 select-none">
              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-450 shrink-0">
                <RefreshCw className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Last Sync</span>
                <span className="text-[9px] text-slate-500 font-bold font-mono">{updatedTime}</span>
              </div>
            </div>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
