'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Activity,
  Compass,
  Briefcase,
  Medal,
  Award,
  FileText,
  Settings,
  Database,
  History,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutGrid },
  { label: 'Live IPO GMP', href: '/gmp', icon: Activity },
  { label: 'Mainboard IPOs', href: '/mainboard', icon: Compass },
  { label: 'SME IPOs', href: '/sme', icon: Briefcase },
  { label: 'Mainboard Performance', href: '/mainboard/performance', icon: Medal },
  { label: 'SME Performance', href: '/sme/performance', icon: Award },
  { label: 'Live IPO Summary', href: '/summary', icon: FileText },
];

const adminNavItems: SidebarItem[] = [
  { label: 'Sync Manager', href: '/admin/sync', icon: Database },
  { label: 'Audit Logs', href: '/admin/sync/logs', icon: History },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname();

  const renderNavList = (items: SidebarItem[]) => {
    return (
      <ul className="space-y-1.5 font-sans">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none group',
                  isActive
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-zinc-950 font-semibold'
                    : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-zinc-900/60'
                )}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-transform group-hover:scale-105',
                  isActive ? 'text-current' : 'text-neutral-400 dark:text-zinc-500 group-hover:text-current'
                )} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside className={cn('w-64 border-r border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 h-full flex flex-col justify-between p-6 overflow-y-auto select-none', className)}>
      <div className="space-y-7">
        {/* Brand Header */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
            <span className="font-bold text-white text-sm">I</span>
          </div>
          <span className="font-bold text-lg text-neutral-900 dark:text-neutral-50 tracking-tight">IPOVerse</span>
        </div>

        {/* Navigation Segments */}
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-3.5 mb-2.5 block">
              Market Tracker
            </span>
            {renderNavList(mainNavItems)}
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-zinc-900">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest pl-3.5 mb-2.5 block">
              Admin Portal
            </span>
            {renderNavList(adminNavItems)}
          </div>
        </div>
      </div>

      {/* User Session Placeholder */}
      <div className="pt-4 border-t border-neutral-100 dark:border-zinc-900 text-xs text-neutral-400 font-medium pl-1 select-none opacity-80">
        © 2026 IPOVerse India.
      </div>
    </aside>
  );
}
