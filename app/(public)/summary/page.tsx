'use client';

import * as React from 'react';
import {
  Search,
  X,
  RefreshCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';
import { formatDateOnly } from '@/utils/dateUtils';

// ==========================================
// DATA INTERFACE
// Maps to Google Sheet: "Live IPO Summary"
// Columns: IPO | Price - Lot | GMP | Subscription | Review | GMP Trend
//
// BACKEND INTEGRATION POINT:
//   API: GET /api/summary → json.data[]
//   Each item is a full IPO object with:
//     gmpHistory[0]          → latest GMP snapshot
//     subscriptionHistory[0] → latest subscription snapshot
//
// Field mapping:
//   IPO          → companyName + type + status + openDate + closeDate + issueSizeCr
//   Price - Lot  → priceMin, priceMax, lotSize, minimumInvestment
//   GMP          → gmpHistory[0].gmp + expectedListingGain + priceMax
//   Subscription → subscriptionHistory[0].total + retail + qib + nii
//   Review       → reviewSummary + ratingFireCount
//   GMP Trend    → multiple gmpHistory points (if available, else "unavailable")
// ==========================================
interface SummaryIpo {
  id: string;
  // IPO column
  companyName: string;
  type: string;          // "MAINBOARD" | "SME"
  status: string;        // "OPEN" | "UPCOMING" | "CLOSED"
  openDate: string | null;
  closeDate: string | null;
  issueSizeCr: number | null;
  // Price - Lot column
  priceMin: number | null;
  priceMax: number | null;
  lotSize: number | null;
  minimumInvestment: number | null;
  // GMP column
  gmp: number | null;               // gmpHistory[0].gmp
  expectedListingGain: number | null; // gmpHistory[0].expectedListingGain (percent)
  // Subscription column
  totalSubscription: number | null;  // subscriptionHistory[0].total
  retailSub: number | null;
  qibSub: number | null;
  niiSub: number | null;
  // Review column
  reviewSummary: string | null;
  ratingFireCount: number | null;
  // GMP Trend — array of historical gmp points (for sparkline, future use)
  gmpTrend: { date: string; gmp: number }[];
  updatedAt: string | null;
}

type BoardFilter = 'ALL' | 'MAINBOARD' | 'SME';
type SortKey =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'gmp_desc'
  | 'gmp_asc'
  | 'sub_desc'
  | 'sub_asc';

// ==========================================
// BACKEND → INTERFACE MAPPER
// ==========================================
function mapIpo(raw: any): SummaryIpo {
  const gmpVal = raw.gmp ?? raw.currentGmp ?? raw.gmpValue ?? raw.gmpHistory?.[0]?.gmp ?? null;
  const gmp = gmpVal !== null && gmpVal !== undefined ? Number(gmpVal) : null;

  const gmpGainVal = raw.gmpPercent ?? raw.expectedListingGain ?? raw.gmpHistory?.[0]?.expectedListingGain ?? null;
  const expectedListingGain = gmpGainVal !== null && gmpGainVal !== undefined ? Number(gmpGainVal) : null;

  const subVal = raw.subscription ?? raw.subscriptionTotal ?? raw.totalSubscription ?? raw.subscriptionRate ?? raw.subscriptionHistory?.[0]?.total ?? null;
  const totalSubscription = subVal !== null && subVal !== undefined ? Number(subVal) : null;

  const retailSub = (raw.retail ?? raw.retailSub ?? raw.subscriptionHistory?.[0]?.retail) != null
    ? Number(raw.retail ?? raw.retailSub ?? raw.subscriptionHistory?.[0]?.retail)
    : null;
  const qibSub = (raw.qib ?? raw.qibSub ?? raw.subscriptionHistory?.[0]?.qib) != null
    ? Number(raw.qib ?? raw.qibSub ?? raw.subscriptionHistory?.[0]?.qib)
    : null;
  const niiSub = (raw.nii ?? raw.hni ?? raw.niiSub ?? raw.subscriptionHistory?.[0]?.nii) != null
    ? Number(raw.nii ?? raw.hni ?? raw.niiSub ?? raw.subscriptionHistory?.[0]?.nii)
    : null;

  return {
    id: raw.id ?? '',
    companyName: raw.companyName ?? '',
    type: raw.type ?? 'MAINBOARD',
    status: raw.status ?? '',
    openDate: raw.openDate ?? null,
    closeDate: raw.closeDate ?? null,
    issueSizeCr: raw.issueSizeCr != null ? Number(raw.issueSizeCr) : null,
    priceMin: raw.priceMin != null ? Number(raw.priceMin) : null,
    priceMax: raw.priceMax != null ? Number(raw.priceMax) : null,
    lotSize: raw.lotSize ?? null,
    minimumInvestment: raw.minimumInvestment != null ? Number(raw.minimumInvestment) : null,
    gmp,
    expectedListingGain,
    totalSubscription,
    retailSub,
    qibSub,
    niiSub,
    reviewSummary: raw.reviewSummary ?? null,
    ratingFireCount: raw.ratingFireCount ?? null,
    // GMP Trend: if backend later provides full gmpHistory array, pass it here
    // For now, we pass the array directly but it's typically just 1 record from this API
    gmpTrend: (raw.gmpHistory ?? []).map((h: any) => ({
      date: h.recordedAt ?? '',
      gmp: Number(h.gmp),
    })),
    updatedAt: raw.updatedAt ?? null,
  };
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function formatDate(d: string | null): string {
  return formatDateOnly(d, { day: 'numeric', month: 'short' });
}

function formatIssueDates(open: string | null, close: string | null): string {
  if (!open && !close) return '—';
  if (open && close) return `${formatDate(open)} – ${formatDate(close)}`;
  return formatDate(open || close);
}

function formatPrice(n: number | null): string {
  return n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
}

function gmpColor(gmp: number | null): string {
  if (gmp == null) return 'text-slate-400';
  if (gmp > 0) return 'text-emerald-600';
  if (gmp < 0) return 'text-red-500';
  return 'text-slate-500';
}

function gainColor(pct: number | null): string {
  if (pct == null) return 'text-slate-400';
  if (pct > 0) return 'text-emerald-600';
  if (pct < 0) return 'text-red-500';
  return 'text-slate-500';
}

function formatGainPct(pct: number | null): string {
  if (pct == null) return '—';
  if (pct === 0) return '0%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

// Review sentiment
function reviewSentiment(review: string | null): 'positive' | 'negative' | 'neutral' {
  if (!review) return 'neutral';
  const lower = review.toLowerCase();
  if (lower.includes('strong') || lower.includes('apply') || lower.includes('buy')) return 'positive';
  if (lower.includes('avoid') || lower.includes('risky') || lower.includes('skip')) return 'negative';
  return 'neutral';
}

// ==========================================
// BADGES
// ==========================================
function TypeBadge({ type }: { type: string }) {
  const isSme = type?.toUpperCase() === 'SME';
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
      isSme
        ? 'bg-purple-50 text-purple-700 border-purple-100'
        : 'bg-blue-50 text-blue-700 border-blue-100'
    )}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const styles =
    s === 'OPEN'     ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    s === 'UPCOMING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
    s === 'CLOSED'   ? 'bg-amber-50 text-amber-700 border-amber-100' :
                       'bg-slate-50 text-slate-500 border-slate-100';
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
      styles
    )}>
      {status}
    </span>
  );
}

function ReviewBadge({ text }: { text: string | null }) {
  if (!text) return <span className="text-[12px] text-slate-400">—</span>;
  const sentiment = reviewSentiment(text);
  const styles =
    sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    sentiment === 'negative' ? 'bg-red-50 text-red-600 border-red-200' :
                               'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border',
      styles
    )}>
      {text}
    </span>
  );
}

// ==========================================
// GMP TREND COMPONENT
// Designed for future sparkline integration.
// When backend provides multiple gmpHistory points, render a real sparkline.
// Currently shows "Trend unavailable" if only 0-1 data points exist.
// ==========================================
function GmpTrendCell({ trend }: { trend: { date: string; gmp: number }[] }) {
  // Future: when trend.length >= 3, render a real SVG sparkline here
  // Example future code:
  //   const points = trend.map((t, i) => `${i * 10},${100 - t.gmp}`).join(' ');
  //   return <svg><polyline points={points} /></svg>;

  if (!trend || trend.length < 2) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-sans">
        <Activity className="w-3 h-3 opacity-40" />
        <span>—</span>
      </span>
    );
  }

  // Multiple points available — render inline sparkline
  const values = trend.map((t) => t.gmp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = values[values.length - 1];
  const first = values[0];
  const isUp = last >= first;

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={isUp ? '#10b981' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ==========================================
// SORTABLE HEADER
// ==========================================
function SortableHeader({
  label, ascKey, descKey, current, onSort, className,
}: {
  label: string; ascKey: SortKey; descKey: SortKey;
  current: SortKey; onSort: (k: SortKey) => void; className?: string;
}) {
  const isAsc = current === ascKey;
  const isDesc = current === descKey;
  const isActive = isAsc || isDesc;
  return (
    <th
      className={cn('px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none group whitespace-nowrap', className)}
      onClick={() => onSort(!isActive || isDesc ? ascKey : descKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn('transition-opacity', isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')}>
          {isAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        </span>
      </span>
    </th>
  );
}

// ==========================================
// MOBILE CARD
// ==========================================
function SummaryMobileCard({ ipo }: { ipo: SummaryIpo }) {
  const estListing = ipo.priceMax != null && ipo.gmp != null
    ? ipo.priceMax + ipo.gmp
    : null;

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-slate-800 leading-tight truncate">{ipo.companyName}</p>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <TypeBadge type={ipo.type} />
            <StatusBadge status={ipo.status} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatIssueDates(ipo.openDate, ipo.closeDate)}
            {ipo.issueSizeCr != null && ` · ₹${ipo.issueSizeCr} Cr.`}
          </p>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-slate-100">
        {/* Price */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">Price</p>
          <p className="text-[12px] font-semibold text-slate-700 font-mono">
            {ipo.priceMin != null && ipo.priceMax != null
              ? ipo.priceMin === ipo.priceMax
                ? formatPrice(ipo.priceMax)
                : `₹${ipo.priceMin}–${ipo.priceMax}`
              : '—'}
          </p>
          {ipo.lotSize != null && (
            <p className="text-[11px] text-slate-400">Lot {ipo.lotSize} shares</p>
          )}
          {ipo.minimumInvestment != null && (
            <p className="text-[11px] text-slate-400">Min {formatPrice(ipo.minimumInvestment)}</p>
          )}
        </div>
        {/* GMP */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">GMP</p>
          <p className={cn('text-[13px] font-bold font-mono', gmpColor(ipo.gmp))}>
            {ipo.gmp != null ? `₹${ipo.gmp}` : '—'}
          </p>
          {ipo.expectedListingGain != null && (
            <p className={cn('text-[11px] font-semibold', gainColor(ipo.expectedListingGain))}>
              {formatGainPct(ipo.expectedListingGain)}
            </p>
          )}
          {estListing != null && (
            <p className="text-[11px] text-slate-400">Est. {formatPrice(estListing)}</p>
          )}
        </div>
        {/* Subscription */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">Subscription</p>
          {ipo.totalSubscription != null ? (
            <>
              <p className="text-[13px] font-bold text-slate-800">{ipo.totalSubscription.toFixed(2)}x</p>
              {(ipo.qibSub != null || ipo.retailSub != null) && (
                <div className="flex gap-2 mt-0.5">
                  {ipo.qibSub != null && <span className="text-[10px] text-slate-400">QIB {ipo.qibSub.toFixed(1)}x</span>}
                  {ipo.retailSub != null && <span className="text-[10px] text-slate-400">Ret {ipo.retailSub.toFixed(1)}x</span>}
                </div>
              )}
            </>
          ) : (
            <p className="text-[12px] text-slate-400">—</p>
          )}
        </div>
        {/* Review */}
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">Review</p>
          <ReviewBadge text={ipo.reviewSummary} />
        </div>
        {/* GMP Trend */}
        <div className="col-span-2">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">GMP Trend</p>
          <GmpTrendCell trend={ipo.gmpTrend} />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ERROR CARD
// ==========================================
function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
        <RefreshCcw className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-800">Unable to load IPO summary data.</h3>
        <p className="text-[13px] text-slate-400 mt-1">Something went wrong while fetching from the backend.</p>
      </div>
      <Button onClick={onRetry} variant="outline" className="h-9 rounded-xl text-xs px-5 gap-2">
        <RefreshCcw className="w-3.5 h-3.5" />
        Retry
      </Button>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function SummaryPage() {
  const [data, setData] = React.useState<SummaryIpo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Controls
  const [search, setSearch] = React.useState('');
  const [boardFilter, setBoardFilter] = React.useState<BoardFilter>('ALL');
  const [sortKey, setSortKey] = React.useState<SortKey>('default');

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((json.data || []).map(mapIpo));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // Available boards in data (for showing relevant filter tabs)
  const hasMainboard = data.some((d) => d.type?.toUpperCase() === 'MAINBOARD');
  const hasSme = data.some((d) => d.type?.toUpperCase() === 'SME');

  // Filter
  const filtered = React.useMemo(() =>
    data.filter((ipo) => {
      const matchSearch = !search || ipo.companyName.toLowerCase().includes(search.toLowerCase());
      const matchBoard =
        boardFilter === 'ALL' || ipo.type?.toUpperCase() === boardFilter;
      return matchSearch && matchBoard;
    }),
  [data, search, boardFilter]);

  // Sort
  const sorted = React.useMemo(() => {
    if (sortKey === 'default') return filtered;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc')  return a.companyName.localeCompare(b.companyName);
      if (sortKey === 'name_desc') return b.companyName.localeCompare(a.companyName);
      const gmpA = a.gmp ?? -Infinity;
      const gmpB = b.gmp ?? -Infinity;
      if (sortKey === 'gmp_desc') return gmpB - gmpA;
      if (sortKey === 'gmp_asc')  return gmpA - gmpB;
      const subA = a.totalSubscription ?? -Infinity;
      const subB = b.totalSubscription ?? -Infinity;
      if (sortKey === 'sub_desc') return subB - subA;
      if (sortKey === 'sub_asc')  return subA - subB;
      return 0;
    });
  }, [filtered, sortKey]);

  const boardTabs: { key: BoardFilter; label: string }[] = [
    { key: 'ALL',       label: 'All' },
    ...(hasMainboard ? [{ key: 'MAINBOARD' as BoardFilter, label: 'Mainboard' }] : []),
    ...(hasSme       ? [{ key: 'SME'       as BoardFilter, label: 'SME'       }] : []),
  ];

  return (
    <div className="space-y-8 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 font-sans">

      {/* ===================== HERO SECTION ===================== */}
      <div className="bg-white border-b border-slate-200/60 px-6 md:px-8 py-10 md:py-12">
        <div className="max-w-3xl space-y-3">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live IPO Summary
          </span>

          {/* Heading */}
          <h1 className="text-[28px] md:text-[34px] font-bold text-[#0F172A] tracking-tight leading-tight">
            Live IPO Summary
          </h1>

          {/* Subtitle */}
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-2xl">
            Everything important about every live IPO on one page — price &amp; minimum investment,
            latest GMP, subscription demand, analyst review and the GMP trend — for all Mainboard
            and SME IPOs, updated daily.
          </p>
        </div>
      </div>

      {/* ===================== CONTROLS ===================== */}
      <div className="px-6 md:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Left: Board filter + count */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isLoading && !hasError && boardTabs.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
                {boardTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setBoardFilter(tab.key)}
                    className={cn(
                      'px-3 py-1 text-[12px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap',
                      boardFilter === tab.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {!isLoading && !hasError && (
              <span className="text-[12px] text-slate-400">
                {sorted.length} IPO{sorted.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Right: Search + Sort */}
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search IPOs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 transition-all w-44"
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

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer appearance-none"
              >
                <option value="default">Default Order</option>
                <option value="name_asc">IPO Name A–Z</option>
                <option value="name_desc">IPO Name Z–A</option>
                <option value="gmp_desc">GMP: High to Low</option>
                <option value="gmp_asc">GMP: Low to High</option>
                <option value="sub_desc">Subscription: High to Low</option>
                <option value="sub_asc">Subscription: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================== CONTENT ===================== */}
        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : hasError ? (
          <ErrorCard onRetry={fetchData} />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No Live IPO Summary data available."
            description={
              search || boardFilter !== 'ALL'
                ? 'No IPOs match your current filters. Try resetting them.'
                : 'No live IPO summary data is currently available. Please check back later.'
            }
            onReset={
              search || boardFilter !== 'ALL'
                ? () => { setSearch(''); setBoardFilter('ALL'); }
                : undefined
            }
          />
        ) : (
          <>
            {/* ---- DESKTOP TABLE ---- */}
            <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
                    <tr>
                      <SortableHeader
                        label="IPO"
                        ascKey="name_asc"
                        descKey="name_desc"
                        current={sortKey}
                        onSort={setSortKey}
                        className="pl-5 w-[26%]"
                      />
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        Price · Lot
                      </th>
                      <SortableHeader
                        label="GMP"
                        ascKey="gmp_desc"
                        descKey="gmp_asc"
                        current={sortKey}
                        onSort={setSortKey}
                      />
                      <SortableHeader
                        label="Subscription"
                        ascKey="sub_desc"
                        descKey="sub_asc"
                        current={sortKey}
                        onSort={setSortKey}
                      />
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Review
                      </th>
                      <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-5">
                        GMP Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sorted.map((ipo, idx) => {
                      const estListing = ipo.priceMax != null && ipo.gmp != null
                        ? ipo.priceMax + ipo.gmp
                        : null;
                      return (
                        <tr
                          key={ipo.id || idx}
                          className="group hover:bg-slate-50/60 transition-colors duration-150"
                        >
                          {/* IPO */}
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[14px] text-slate-800 group-hover:text-blue-700 transition-colors leading-tight mb-1">
                              {ipo.companyName}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-1">
                              <TypeBadge type={ipo.type} />
                              <StatusBadge status={ipo.status} />
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {formatIssueDates(ipo.openDate, ipo.closeDate)}
                              {ipo.issueSizeCr != null && ` · ₹${ipo.issueSizeCr} Cr.`}
                            </p>
                          </td>

                          {/* Price · Lot */}
                          <td className="px-4 py-4">
                            <p className="font-mono font-semibold text-[13px] text-slate-700">
                              {ipo.priceMin != null && ipo.priceMax != null
                                ? ipo.priceMin === ipo.priceMax
                                  ? formatPrice(ipo.priceMax)
                                  : `₹${ipo.priceMin}–${ipo.priceMax}`
                                : '—'}
                            </p>
                            {ipo.lotSize != null && (
                              <p className="text-[11px] text-slate-400 mt-0.5">Lot {ipo.lotSize} shares</p>
                            )}
                            {ipo.minimumInvestment != null && (
                              <p className="text-[11px] text-slate-400">Min {formatPrice(ipo.minimumInvestment)}</p>
                            )}
                          </td>

                          {/* GMP */}
                          <td className="px-4 py-4">
                            {ipo.gmp != null ? (
                              <>
                                <p className={cn('font-mono font-bold text-[14px]', gmpColor(ipo.gmp))}>
                                  {ipo.gmp > 0 ? '+' : ''}₹{ipo.gmp}
                                </p>
                                {ipo.expectedListingGain != null && (
                                  <p className={cn('text-[11px] font-semibold mt-0.5', gainColor(ipo.expectedListingGain))}>
                                    {formatGainPct(ipo.expectedListingGain)}
                                  </p>
                                )}
                                {estListing != null && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Est. {formatPrice(estListing)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-[12px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Subscription */}
                          <td className="px-4 py-4">
                            {ipo.totalSubscription != null ? (
                              <>
                                <p className="font-bold text-[14px] text-slate-800">
                                  {ipo.totalSubscription.toFixed(2)}x
                                </p>
                                <div className="flex gap-2 mt-0.5 flex-wrap">
                                  {ipo.qibSub != null && (
                                    <span className="text-[10px] text-slate-400">
                                      QIB <span className="text-slate-600 font-semibold">{ipo.qibSub.toFixed(1)}x</span>
                                    </span>
                                  )}
                                  {ipo.niiSub != null && (
                                    <span className="text-[10px] text-slate-400">
                                      HNI <span className="text-slate-600 font-semibold">{ipo.niiSub.toFixed(1)}x</span>
                                    </span>
                                  )}
                                  {ipo.retailSub != null && (
                                    <span className="text-[10px] text-slate-400">
                                      Ret <span className="text-slate-600 font-semibold">{ipo.retailSub.toFixed(1)}x</span>
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-[12px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Review */}
                          <td className="px-4 py-4">
                            <ReviewBadge text={ipo.reviewSummary} />
                          </td>

                          {/* GMP Trend */}
                          <td className="px-4 py-4 pr-5">
                            <GmpTrendCell trend={ipo.gmpTrend} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="text-[12px] text-slate-400 font-sans">
                  {sorted.length} of {data.length} live IPO{data.length !== 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Live IPO Summary Sheet</span>
              </div>
            </div>

            {/* ---- MOBILE: STACKED CARDS ---- */}
            <div className="md:hidden space-y-3">
              {sorted.map((ipo, idx) => (
                <SummaryMobileCard key={ipo.id || idx} ipo={ipo} />
              ))}
              <p className="text-center text-[11px] text-slate-400 pt-2">
                {sorted.length} IPO{sorted.length !== 1 ? 's' : ''} &bull; Live IPO Summary Sheet
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
