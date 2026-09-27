'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Database,
  History,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNavItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { label: 'Sync Manager', href: '/admin/sync', icon: Database },
  { label: 'Audit Logs', href: '/admin/logs', icon: History },
  { label: 'System Settings', href: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function AdminSidebar({ className, onItemClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const res = await fetch('/api/admin/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/admin/login');
      } else {
        console.error('Logout request failed.');
      }
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className={cn('w-64 border-r border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 h-full flex flex-col justify-between p-6 overflow-y-auto select-none', className)}>
      <div className="space-y-7">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-base text-neutral-900 dark:text-neutral-50 tracking-tight block">IPOVerse</span>
            <span className="text-[10px] text-neutral-400 font-bold block -mt-1 uppercase tracking-wider">Admin Console</span>
          </div>
        </div>

        {/* Navigation Segments */}
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white font-semibold'
                      : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-zinc-900/60'
                  )}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-105',
                    isActive ? 'text-current' : 'text-neutral-400 dark:text-zinc-500 group-hover:text-current'
                  )} />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logout triggers */}
      <div className="space-y-4">
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="w-full justify-start h-10 rounded-xl text-red-600 border-red-100 hover:bg-red-50 dark:border-red-950/20 dark:hover:bg-red-950/10 gap-3"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">{isLoggingOut ? 'Logging out...' : 'Sign Out'}</span>
        </Button>
        <div className="text-[10px] text-neutral-400 font-semibold text-center select-none opacity-80 pt-1">
          Console v1.0.0
        </div>
      </div>
    </aside>
  );
}
