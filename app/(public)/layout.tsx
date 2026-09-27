import * as React from 'react';
import { PublicSidebar } from '@/components/layout/public-sidebar';
import { PublicHeader } from '@/components/layout/public-header';
import { Footer } from '@/components/layout/footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block shrink-0">
        <PublicSidebar className="sticky top-0 h-screen" />
      </div>

      {/* Right Segment: Header + Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        <PublicHeader />
        <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6 flex flex-col justify-start">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
