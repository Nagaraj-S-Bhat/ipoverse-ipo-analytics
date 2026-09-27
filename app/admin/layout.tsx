'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Header } from '@/components/layout/header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Return a clean, un-navigated container for the authentication page
  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-zinc-950">
        {children}
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Desktop Admin Sidebar (hidden on mobile) */}
      <div className="hidden md:block shrink-0">
        <AdminSidebar className="sticky top-0 h-screen" />
      </div>

      {/* Right Segment: Admin Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-zinc-950/20">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 flex flex-col justify-start">
          {children}
        </main>
      </div>
    </div>
  );
}
