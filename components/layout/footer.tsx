import * as React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/50 bg-white select-none py-8 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[13px] text-slate-400 gap-4">
        <div className="flex flex-col space-y-1.5 text-center md:text-left">
          <span className="font-semibold text-slate-600">© 2026 IPOVerse. All rights reserved.</span>
          <span className="text-[11px] leading-relaxed max-w-2xl block text-slate-400">
            Disclaimer: IPOVerse is a public information platform. Grey Market Premiums (GMP) are unofficial market estimates and carry no regulatory binding or guarantee. Primary markets carry high investment risk.
          </span>
        </div>
        
        {/* Footnotes links */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 font-medium shrink-0">
          <a href="#" className="hover:text-slate-800 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-800 transition-colors">Disclaimer</a>
        </div>
      </div>
    </footer>
  );
}
