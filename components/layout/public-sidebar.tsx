'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  TrendingUp,
  Building2,
  Factory,
  BarChart3,
  ClipboardList,
  Calendar,
  Scale,
  Info,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const publicNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Live IPO GMP', href: '/gmp', icon: TrendingUp },
  { label: 'Mainboard IPOs', href: '/mainboard', icon: Building2 },
  { label: 'SME IPOs', href: '/sme', icon: Factory },
  { label: 'IPO Performance', href: '/performance', icon: BarChart3 },
  { label: 'IPO Summary', href: '/summary', icon: ClipboardList },
  { label: 'IPO Calendar', href: '/calendar', icon: Calendar },
  { label: 'IPO Comparison', href: '/comparison', icon: Scale },
  { label: 'About IPOVerse', href: '/about', icon: Info },
];

interface PublicSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function PublicSidebar({ className, onItemClick }: PublicSidebarProps) {
  const pathname = usePathname();
  const [syncTime, setSyncTime] = React.useState('');

  React.useEffect(() => {
    const now = new Date();
    setSyncTime(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
  }, []);

  return (
    <aside
      className={cn(
        'w-[280px] border-r border-slate-200/40 bg-[#FAFBFC] h-full flex flex-col justify-between py-8 px-6 select-none font-sans text-slate-500 shadow-[2px_0_12px_rgba(0,0,0,0.005)]',
        className
      )}
    >
      <div className="space-y-6 flex flex-col">
        {/* Brand Header */}
        <Link
          href="/"
          className="flex items-center gap-4 px-1.5 group select-none py-1 transition-opacity hover:opacity-95"
        >
          {/* Logo - Modern rounded square (48px) with premium blue gradient & soft shadow */}
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] shrink-0 transition-transform duration-300 group-hover:scale-105">
            {/* White growth chart / IPO-inspired symbol */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[26px] h-[26px]">
              <path
                d="M3 20H21"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 16L11 11L15 14L21 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 7H21V12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex flex-col space-y-0.5 leading-none">
            <span className="font-bold text-[26px] text-slate-900 tracking-[-0.02em] font-sans">
              IPOVerse
            </span>
            <span className="text-[13px] font-medium text-slate-450 tracking-wide font-sans">
              Indian IPO Analytics
            </span>
          </div>
        </Link>

        {/* Minimal Divider with generous vertical space below logo */}
        <div className="h-px bg-slate-200/50 w-full mt-2" />

        {/* Navigation list */}
        <div className="space-y-[14px] flex-1">
          {publicNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-4 px-4.5 h-[56px] rounded-[16px] text-[16px] font-medium transition-all duration-[250ms] ease-out group relative select-none hover:scale-[1.01]',
                    isActive
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-[0_10px_30px_rgba(37,99,235,0.18)]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-[#2563EB]/[0.08]'
                  )}
                >
                  {/* Left animated active indicator */}
                  {isActive && (
                    <span className="absolute left-2.5 w-1.5 h-6 rounded-full bg-white/90 animate-[pulse_2s_infinite]" />
                  )}

                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] transition-all duration-[250ms] shrink-0',
                      isActive ? 'text-white stroke-[2.25]' : 'text-slate-400 group-hover:text-slate-800 stroke-[1.8]'
                    )}
                  />
                  <span className="font-sans leading-none">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Handcrafted Bottom Status Widget */}
      <div className="bg-white border border-slate-200/50 rounded-[16px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.015)] space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-bold text-slate-800 tracking-wider uppercase font-sans">
            Market Live
          </span>
        </div>
        <div className="space-y-0.5 leading-tight">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
            Last Sync
          </span>
          <span className="text-[12px] font-semibold text-slate-600 block font-sans">
            Today, {syncTime || '2:45 PM'}
          </span>
        </div>
      </div>
    </aside>
  );
}
