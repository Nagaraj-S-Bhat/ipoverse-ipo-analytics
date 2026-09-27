import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IPOVerse - Modern Grey Market Premium Tracker',
  description: 'Clean, real-time portal to IPO Grey Market Premiums, listed performances, and subscription metrics in India.',
  keywords: ['IPO', 'Grey Market Premium', 'GMP', 'Mainboard', 'SME', 'Listing Gain'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-[#F8FAFC] dark:bg-zinc-950 text-neutral-800 dark:text-neutral-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
