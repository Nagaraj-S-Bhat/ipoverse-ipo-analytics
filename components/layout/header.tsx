'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PublicSidebar } from './public-sidebar';
import { AdminSidebar } from './admin-sidebar';
import { Breadcrumbs } from './breadcrumbs';
import { ThemeToggle } from '../theme-toggle';
import { SearchBox } from '../ui-custom/inputs';
import { Menu, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const [searchVal, setSearchVal] = React.useState('');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        {/* Left segment: Mobile Navigation & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Hamburger Mobile Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'w-9 h-9 rounded-xl border border-neutral-200 dark:border-zinc-800 md:hidden text-neutral-500 hover:bg-neutral-50 cursor-pointer'
              )}
            >
              <Menu className="w-4.5 h-4.5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              {isAdminRoute ? (
                <AdminSidebar onItemClick={() => setMobileOpen(false)} className="border-r-0 h-full w-full" />
              ) : (
                <PublicSidebar onItemClick={() => setMobileOpen(false)} className="border-r-0 h-full w-full" />
              )}
            </SheetContent>
          </Sheet>

          {/* Breadcrumb component */}
          <div className="hidden sm:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right segment: Search, Notifications, Theme, User */}
        <div className="flex items-center gap-3.5">
          {/* Search Box */}
          <div className="w-48 sm:w-64">
            <SearchBox
              placeholder="Search listings..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onClear={() => setSearchVal('')}
              className="h-9 text-xs"
            />
          </div>

          {/* Notification Alert Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white dark:ring-zinc-950 animate-pulse" />
            <span className="sr-only">View notifications</span>
          </Button>

          {/* Theme Mode Toggle Button */}
          <ThemeToggle />

          {/* User Profile / Admin Link */}
          <Link
            href={isAdminRoute ? "/admin/settings" : "/admin/dashboard"}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'icon' }),
              'w-9 h-9 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors'
            )}
          >
            <User className="w-4 h-4" />
            <span className="sr-only">{isAdminRoute ? 'Settings' : 'Go to Admin'}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
