'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  X,
  RefreshCcw,
  BarChart2,
  Filter,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IpoTypeBadge, ListingBadge } from '@/components/ui-custom/badges';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';
import { formatDateOnly } from '@/utils/dateUtils';

// ==========================================
// TYPES
// ==========================================
interface GmpRow {
  id: string;
  companyName: string;
  type: string;
  board?: string;
  status: string;
  priceMin: number | null;
  priceMax: number | null;
  issuePrice: number | null;
  openDate: string | null;
  closeDate: string | null;
  listingDate: string | null;
  companyLogo: string | null;
  currentGmp: number | null;
  gmpPercent: number | null;
  estimatedListingPrice: number | null;
  gmpUpdatedAt: string | null;
  lotSize: number | null;
  subscription: number | null;
  subscriptionTotal?: number | null;
  reviewSummary: string | null;
}

type ProcessedGmpRow = GmpRow & {
  _gmp: number;
  _gmpPercent: number;
  _issuePrice: number;
};

type SortKey = 'gmp_desc' | 'gmp_asc' | 'name_asc';
type FilterKey = 'ALL' | 'SME' | 'MAINBOARD';

// ==========================================
// HELPERS
// ==========================================
/**
 * Format a date string safely without timezone shift.
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return formatDateOnly(dateStr, { day: 'numeric', month: 'short' });
}

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  } catch {
    return dateStr;
  }
}

function isToday(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  } catch {
    return false;
  }
}

// ==========================================
// GMP VALUE CELL
// ==========================================
function GmpCell({ gmp }: { gmp: number }) {
  if (gmp > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold font-mono text-[14px]">
        <ArrowUpRight className="w-3.5 h-3.5" />
        &#8377;{gmp}
      </span>
    );
  }
  if (gmp < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 font-semibold font-mono text-[14px]">
        <ArrowDownRight className="w-3.5 h-3.5" />
        &#8377;{gmp}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-400 font-semibold font-mono text-[14px]">
      <Minus className="w-3 h-3" />
      &#8377;0
    </span>
  );
}

// ==========================================
// GMP PERCENT CELL
// ==========================================
function GmpPercentCell({ percent }: { percent: number }) {
  if (percent > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold text-[12px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg font-mono">
        <ArrowUp className="w-3 h-3" />
        {percent.toFixed(2)}%
      </span>
    );
  }
  if (percent < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-red-500 font-semibold text-[12px] bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg font-mono">
        <ArrowDown className="w-3 h-3" />
        {Math.abs(percent).toFixed(2)}%
      </span>
    );
  }
  return (
    <span className="text-slate-400 font-semibold text-[12px] bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg font-mono">
      0.00%
    </span>
  );
}

// ==========================================
// REVIEW BADGE COMPONENT
// ==========================================
function reviewSentiment(review: string): 'positive' | 'negative' | 'neutral' {
  const r = review.toLowerCase();
  if (r.includes('strong apply') || r.includes('apply')) return 'positive';
  if (r.includes('avoid')) return 'negative';
  return 'neutral';
}

function ReviewBadge({ text }: { text: string | null | undefined }) {
  if (!text) return <span className="text-[12px] text-slate-400">—</span>;
  const sentiment = reviewSentiment(text);
  const styles =
    sentiment === 'positive'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : sentiment === 'negative'
      ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        styles
      )}
    >
      {text}
    </span>
  );
}

// ==========================================
// MOBILE GMP CARD (stacked)
// ==========================================
function GmpMobileCard({ row, gmp, gmpPercent }: { row: GmpRow; gmp: number; gmpPercent: number }) {
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {row.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.companyLogo}
              alt={row.companyName}
              className="w-9 h-9 rounded-xl object-contain border border-slate-100 bg-white p-0.5 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-blue-600">
                {row.companyName.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-[14px] text-slate-800 truncate leading-tight">{row.companyName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatDate(row.openDate)} &ndash; {formatDate(row.closeDate)}
            </p>
          </div>
        </div>
        <IpoTypeBadge type={row.type} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Price · Lot</p>
          <p className="font-mono font-semibold text-[13px] text-slate-700">
            {row.issuePrice != null ? `₹${row.issuePrice}` : (row.priceMax != null ? `₹${row.priceMax}` : '—')}
          </p>
          {row.lotSize != null && (
            <p className="text-[10px] text-slate-400">Lot {row.lotSize.toLocaleString('en-IN')}</p>
          )}
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">GMP</p>
          <GmpCell gmp={gmp} />
          <div className="mt-0.5">
            <GmpPercentCell percent={gmpPercent} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Subscription</p>
          <p className="font-bold text-[13px] text-slate-800 font-mono">
            {row.subscription != null ? `${Number(row.subscription).toFixed(2)}x` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Review</p>
          <ReviewBadge text={row.reviewSummary} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// HERO ILLUSTRATION (right side - static visual)
// ==========================================
function GmpHeroIllustration() {
  const mockRows = [
    { name: 'LAPL Automotive', price: '94', gmp: '+30', pct: '+31.9%', board: 'SME', color: 'emerald' as const },
    { name: 'Technocraft Ven.', price: '72', gmp: '+15', pct: '+20.8%', board: 'SME', color: 'emerald' as const },
    { name: 'Hyundai Motor', price: '1960', gmp: '+410', pct: '+20.9%', board: 'MB', color: 'emerald' as const },
    { name: 'Ardee Industries', price: '58', gmp: '0', pct: '0.00%', board: 'SME', color: 'slate' as const },
    { name: 'NS Finserv', price: '120', gmp: '-8', pct: '-6.7%', board: 'SME', color: 'red' as const },
  ];

  return (
    <div className="relative w-full aspect-[4/3] rounded-[24px] bg-[#FAFBFC] border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 flex flex-col justify-between select-none overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.25]" />

      <div className="relative z-10 flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 font-sans">Live GMP Tracker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="bg-slate-100/80 px-2 py-0.5 rounded-md text-[9px] font-bold text-slate-500 font-mono">Live</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 pt-3 space-y-1.5 overflow-hidden">
        <div className="grid grid-cols-5 gap-2 px-2 pb-1.5 border-b border-slate-100">
          {['Company', 'Issue Price', 'GMP', 'GMP %', 'Board'].map((col) => (
            <span key={col} className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{col}</span>
          ))}
        </div>

        {mockRows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'grid grid-cols-5 gap-2 px-2 py-1.5 rounded-lg',
              i === 0 ? 'bg-blue-50/60' : ''
            )}
          >
            <span className="text-[9px] font-semibold text-slate-700 truncate">{row.name}</span>
            <span className="text-[9px] font-mono text-slate-600">&#8377;{row.price}</span>
            <span className={cn(
              'text-[9px] font-mono font-bold',
              row.color === 'emerald' ? 'text-emerald-600' :
              row.color === 'red' ? 'text-red-500' : 'text-slate-400'
            )}>&#8377;{row.gmp}</span>
            <span className={cn(
              'text-[9px] font-mono font-bold',
              row.color === 'emerald' ? 'text-emerald-600' :
              row.color === 'red' ? 'text-red-500' : 'text-slate-400'
            )}>{row.pct}</span>
            <span className={cn(
              'text-[8px] font-bold px-1.5 py-0.5 rounded text-center',
              row.board === 'SME'
                ? 'bg-purple-50 text-purple-600'
                : 'bg-blue-50 text-blue-600'
            )}>{row.board}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-3 h-3 text-blue-500" />
          <span className="text-[8px] font-semibold text-slate-400">IPOs tracked in real-time</span>
        </div>
        <span className="text-[8px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">Synced from Sheets</span>
      </div>
    </div>
  );
}

// ==========================================
// ERROR STATE
// ==========================================
function ErrorState({ onRetry, errorMessage }: { onRetry: () => void; errorMessage: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
        <RefreshCcw className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-800">Failed to load GMP data</h3>
        <p className="text-[13px] text-slate-400 mt-1">
          {errorMessage || 'Unable to connect to the backend. Please try again.'}
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        className="h-9 rounded-xl text-xs px-5 gap-2"
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function LiveGmpPage() {
  const [data, setData] = React.useState<GmpRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<SortKey>('gmp_desc');
  const [filterBoard, setFilterBoard] = React.useState<FilterKey>('ALL');

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/gmp/live');
      if (!res.ok) {
        throw new Error(`Failed to load GMP data: HTTP ${res.status}`);
      }
      const json = await res.json();

      if (!json || typeof json !== 'object' || json.success === false) {
        throw new Error(json?.error || 'Invalid API response format from /api/gmp/live');
      }

      const rows: GmpRow[] = Array.isArray(json.data) ? json.data : [];
      setData(rows);

      // Derive last-updated from most recent gmpUpdatedAt
      const allTimestamps = rows
        .map((r) => r.gmpUpdatedAt)
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
        .sort()
        .reverse();
      setLastUpdated(allTimestamps.length > 0 ? allTimestamps[0] : new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[Live GMP] Failed to load /api/gmp/live:', error);
      setErrorMessage(message);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process: derive _gmp, _gmpPercent per row
  const processedRows: ProcessedGmpRow[] = React.useMemo(() => {
    return data.map((row: any) => {
      const gmpRaw = row.currentGmp ?? row.gmp ?? row.gmpValue ?? row.gmpHistory?.[0]?.gmp ?? 0;
      const gmp = Number(gmpRaw);
      const issuePrice = Number(row.issuePrice || row.priceMax || row.priceMin || 0);
      const gmpPercent = row.gmpPercent !== undefined && row.gmpPercent !== null
        ? Number(row.gmpPercent)
        : (issuePrice > 0 ? (gmp / issuePrice) * 100 : 0);
      const subRaw = row.subscription ?? row.subscriptionTotal ?? row.totalSubscription ?? null;
      const subscription = subRaw !== null && subRaw !== undefined ? Number(subRaw) : null;
      return {
        ...row,
        subscription,
        _gmp: gmp,
        _gmpPercent: isNaN(gmpPercent) ? 0 : gmpPercent,
        _issuePrice: isNaN(issuePrice) ? 0 : issuePrice,
      };
    });
  }, [data]);

  // Filter
  const filtered = React.useMemo(() => {
    return processedRows.filter((row) => {
      const name = row.companyName || '';
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
      const board = (row.type || row.board || '').toUpperCase();
      const matchBoard = filterBoard === 'ALL' || board === filterBoard;
      return matchSearch && matchBoard;
    });
  }, [processedRows, search, filterBoard]);

  // Sort
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Sort by GMP percentage DESC, not raw GMP value.
      // e.g., Hy-Tech at 84.91% should come before ESDS at 83.22%
      // even though ESDS has a higher raw GMP in rupees.
      if (sortKey === 'gmp_desc') return (b._gmpPercent ?? -Infinity) - (a._gmpPercent ?? -Infinity);
      if (sortKey === 'gmp_asc') return (a._gmpPercent ?? -Infinity) - (b._gmpPercent ?? -Infinity);
      if (sortKey === 'name_asc') return (a.companyName || '').localeCompare(b.companyName || '');
      return 0;
    });
  }, [filtered, sortKey]);

  const filterOptions: { key: FilterKey; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SME', label: 'SME' },
    { key: 'MAINBOARD', label: 'Mainboard' },
  ];

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'gmp_desc', label: 'Highest GMP %' },
    { key: 'gmp_asc', label: 'Lowest GMP %' },
    { key: 'name_asc', label: 'Company A-Z' },
  ];

  return (
    <div className="space-y-10 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 p-6 md:p-8 font-sans">

      {/* ==========================================
          1. HERO SECTION
         ========================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white border border-slate-200/70 rounded-3xl p-8 sm:p-10 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.12] pointer-events-none" />

        {/* LEFT: Copy */}
        <div className="lg:col-span-6 space-y-7 z-10 flex flex-col justify-center pr-2">
          <Badge
            variant="outline"
            className="bg-blue-50/80 text-blue-600 border-blue-200/50 uppercase tracking-widest text-[9.5px] font-mono px-3.5 py-1.5 font-bold rounded-full w-fit select-none shadow-sm shadow-blue-500/5"
          >
            <Activity className="w-3 h-3 mr-1.5" />
            Live IPO GMP Tracker
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold tracking-[-0.025em] text-[#0F172A] leading-[1.1] font-sans">
            Track Today&apos;s<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">
              Grey Market Premium
            </span>
            <br />
            Before You Invest.
          </h1>

          <p className="text-[14px] text-[#64748B] leading-relaxed font-normal max-w-md font-sans">
            Monitor real-time Grey Market Premium (GMP), compare issue prices,
            estimate listing gains, and follow every upcoming IPO from one dashboard.
          </p>

          <div className="pt-1 flex flex-col sm:flex-row gap-3">
            <a
              href="#gmp-table"
              className="h-[48px] rounded-[14px] text-[14px] font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center px-7 shadow-[0_4px_18px_rgba(37,99,235,0.22)] cursor-pointer transition-all hover:scale-[1.01] duration-[250ms] ease-out"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Explore Live GMP
            </a>
            <Link
              href="/mainboard"
              className="h-[48px] rounded-[14px] text-[14px] font-bold bg-white border border-slate-200 text-[#475569] hover:text-slate-950 hover:bg-slate-50 flex items-center justify-center px-7 shadow-sm cursor-pointer transition-all hover:scale-[1.01] duration-[250ms] ease-out"
            >
              Upcoming IPOs
            </Link>
          </div>
        </div>

        {/* RIGHT: Illustration */}
        <div className="lg:col-span-6 z-10">
          <GmpHeroIllustration />
        </div>
      </section>

      {/* ==========================================
          2. LAST UPDATED STRIP
         ========================================== */}
      {!isLoading && lastUpdated && (
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-sans">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-600">Last Updated:</span>
          <span>
            {isToday(lastUpdated) ? 'Today, ' : ''}
            {formatTimestamp(lastUpdated)}
          </span>
        </div>
      )}

      {/* ==========================================
          3. SECTION HEADER + CONTROLS
         ========================================== */}
      <div id="gmp-table" className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#0F172A] tracking-tight font-sans">
            Live IPO GMP
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5 font-sans">
            {isLoading
              ? 'Loading data...'
              : `${sorted.length} IPO${sorted.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-[13px] font-sans text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 transition-all w-44"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Board Filter Toggle Pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setFilterBoard(opt.key)}
                className={cn(
                  'px-3 py-1 text-[12px] font-semibold rounded-lg transition-all duration-150',
                  filterBoard === opt.key
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort Select */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer font-sans"
          >
            {sortOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ==========================================
          4. CONTENT: Table / Loading / Empty / Error
         ========================================== */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : hasError ? (
        <ErrorState onRetry={fetchData} errorMessage={errorMessage} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No Live IPO GMP data available."
          description={
            search || filterBoard !== 'ALL'
              ? 'No IPOs match your current filters. Try resetting them.'
              : 'No GMP data is tracked yet. Sync the Live IPO GMP sheet from the admin portal.'
          }
          onReset={
            search || filterBoard !== 'ALL'
              ? () => { setSearch(''); setFilterBoard('ALL'); }
              : undefined
          }
        />
      ) : (
        <>
          {/* ---- DESKTOP TABLE ---- */}
          <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      IPO
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Price · Lot
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      GMP
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-5">
                      Review
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className="group hover:bg-blue-50/30 transition-colors duration-150 cursor-default"
                    >
                      {/* IPO */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {row.companyLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.companyLogo}
                              alt={row.companyName}
                              className="w-9 h-9 rounded-xl object-contain border border-slate-100 bg-white p-0.5 shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <span className="text-[12px] font-bold text-blue-600">
                                {row.companyName.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[14px] text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                                {row.companyName}
                              </p>
                              <IpoTypeBadge type={row.type} />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {formatDate(row.openDate)} &ndash; {formatDate(row.closeDate)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price · Lot */}
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-[13px] text-slate-700">
                          {row.issuePrice != null ? `₹${row.issuePrice}` : (row.priceMax != null ? `₹${row.priceMax}` : '—')}
                        </span>
                        {row.lotSize != null && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                            Lot {row.lotSize.toLocaleString('en-IN')} shares
                          </p>
                        )}
                      </td>

                      {/* GMP */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <GmpCell gmp={row._gmp} />
                          <GmpPercentCell percent={row._gmpPercent} />
                        </div>
                        {row.estimatedListingPrice != null && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Est. ₹{row.estimatedListingPrice}
                          </p>
                        )}
                      </td>

                      {/* Subscription */}
                      <td className="px-4 py-4">
                        {row.subscription != null ? (
                          <span className="font-bold text-[14px] text-slate-800 font-mono">
                            {Number(row.subscription).toFixed(2)}x
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Review */}
                      <td className="px-4 py-4 pr-5">
                        <ReviewBadge text={row.reviewSummary} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[12px] text-slate-400 font-sans">
                Showing {sorted.length} of {data.length} tracked IPO{data.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Live IPO GMP Sheet
              </span>
            </div>
          </div>

          {/* ---- MOBILE: STACKED CARDS ---- */}
          <div className="md:hidden space-y-3">
            {sorted.map((row, idx) => (
              <GmpMobileCard
                key={row.id || idx}
                row={row}
                gmp={row._gmp}
                gmpPercent={row._gmpPercent}
              />
            ))}
            <p className="text-center text-[11px] text-slate-400 pt-2 font-sans">
              {sorted.length} IPO{sorted.length !== 1 ? 's' : ''} &bull; Live IPO GMP Sheet
            </p>
          </div>
        </>
      )}
    </div>
  );
}
