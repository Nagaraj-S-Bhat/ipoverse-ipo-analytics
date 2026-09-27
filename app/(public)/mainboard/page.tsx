'use client';

import * as React from 'react';
import {
  Search,
  X,
  RefreshCcw,
  Clock,
  Filter,
  ArrowUpDown,
  Building2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IpoTypeBadge, ListingBadge } from '@/components/ui-custom/badges';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';
import { formatDateOnly } from '@/utils/dateUtils';

// ==========================================
// TYPES
// ==========================================
interface MainboardIpo {
  id: string;
  companyName: string;
  type: string;
  status: string;
  priceMin: number | string;
  priceMax: number | string;
  issueSizeCr: number | string;
  openDate: string | null;
  closeDate: string | null;
  companyLogo: string | null;
  updatedAt: string | null;
}

type SortKey =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'size_asc'
  | 'size_desc';

type StatusFilter = 'ALL' | 'OPEN' | 'UPCOMING' | 'CLOSED';

// ==========================================
// HELPERS
// ==========================================
/**
 * Format a YYYY-MM-DD date string without timezone shift.
 * Parses year/month/day directly instead of using Date constructor
 * which would apply UTC-to-local timezone conversion and shift the date.
 */
function formatDateSafe(dateStr: string | null): string {
  if (!dateStr) return '—';
  return formatDateOnly(dateStr, { day: 'numeric', month: 'short' });
}

function formatIssueDates(openDate: string | null, closeDate: string | null): string {
  if (!openDate && !closeDate) return '—';
  if (openDate && closeDate) return `${formatDateSafe(openDate)} – ${formatDateSafe(closeDate)}`;
  if (openDate) return formatDateSafe(openDate);
  return formatDateSafe(closeDate!);
}

function formatPrice(val: number | string | null): string {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  return isNaN(n) ? String(val) : `₹${n}`;
}

function formatSize(val: number | string | null): string {
  if (val === null || val === undefined) return '—';
  const n = Number(val);
  return isNaN(n) ? String(val) : `₹${n} Cr.`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }) + ' IST';
  } catch {
    return iso;
  }
}

// Derive subtle row background based on status
function rowBg(status: string): string {
  const s = status?.toUpperCase();
  if (s === 'OPEN') return 'hover:bg-emerald-50/30';
  if (s === 'CLOSED') return 'hover:bg-amber-50/30';
  return 'hover:bg-blue-50/20';
}

// ==========================================
// STATUS ROW ACCENT
// ==========================================
function StatusAccent({ status }: { status: string }) {
  const s = status?.toUpperCase();
  if (s === 'OPEN') return <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-emerald-400" />;
  if (s === 'UPCOMING') return <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-blue-400" />;
  if (s === 'CLOSED') return <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-amber-400" />;
  return null;
}

// ==========================================
// MOBILE CARD
// ==========================================
function MainboardMobileCard({ ipo }: { ipo: MainboardIpo }) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-200 relative overflow-hidden'
      )}
    >
      <StatusAccent status={ipo.status} />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {ipo.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ipo.companyLogo}
              alt={ipo.companyName}
              className="w-9 h-9 rounded-xl object-contain border border-slate-100 bg-white p-0.5 shrink-0"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-blue-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-[14px] text-slate-800 leading-tight truncate">{ipo.companyName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{formatIssueDates(ipo.openDate, ipo.closeDate)}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ListingBadge status={ipo.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 pl-2">
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Issue Price</p>
          <p className="font-mono font-semibold text-[13px] text-slate-700">{formatPrice(ipo.priceMax)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Size</p>
          <p className="font-mono font-semibold text-[13px] text-slate-700">{formatSize(ipo.issueSizeCr)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-1">Dates</p>
          <p className="text-[11px] font-medium text-slate-600">{formatIssueDates(ipo.openDate, ipo.closeDate)}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ERROR STATE
// ==========================================
function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
        <RefreshCcw className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-800">Unable to load Mainboard IPO data.</h3>
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
// SORT BUTTON (column header)
// ==========================================
function SortableHeader({
  label,
  ascKey,
  descKey,
  current,
  onSort,
  className,
}: {
  label: string;
  ascKey: SortKey;
  descKey: SortKey;
  current: SortKey;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const isAsc = current === ascKey;
  const isDesc = current === descKey;
  const isActive = isAsc || isDesc;

  function toggle() {
    if (!isActive || isDesc) onSort(ascKey);
    else onSort(descKey);
  }

  return (
    <th
      className={cn(
        'px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none group',
        className
      )}
      onClick={toggle}
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
// MAIN PAGE
// ==========================================
export default function MainboardIpoPage() {
  const [data, setData] = React.useState<MainboardIpo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  // Controls
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  // Default: newest IPO first
  const [sortKey, setSortKey] = React.useState<SortKey>('date_desc');

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/mainboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows: MainboardIpo[] = json.data || [];
      setData(rows);

      // Use the most recent updatedAt as last-updated timestamp
      const timestamps = rows
        .map((r) => r.updatedAt)
        .filter(Boolean)
        .sort()
        .reverse();
      if (timestamps.length > 0) setLastUpdated(timestamps[0]!);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Unique statuses present in data (for showing relevant filter tabs)
  const availableStatuses = React.useMemo(() => {
    const s = new Set(data.map((d) => d.status?.toUpperCase()).filter(Boolean));
    return Array.from(s);
  }, [data]);

  // Filter
  const filtered = React.useMemo(() => {
    return data.filter((ipo) => {
      const matchSearch =
        !search || ipo.companyName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' || ipo.status?.toUpperCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  // Sort
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === 'date_desc') {
        // YYYY-MM-DD strings compare correctly lexicographically
        if (!a.openDate && !b.openDate) return 0;
        if (!a.openDate) return 1;
        if (!b.openDate) return -1;
        return b.openDate.localeCompare(a.openDate);
      }
      if (sortKey === 'date_asc') {
        if (!a.openDate && !b.openDate) return 0;
        if (!a.openDate) return 1;
        if (!b.openDate) return -1;
        return a.openDate.localeCompare(b.openDate);
      }
      if (sortKey === 'name_asc') return a.companyName.localeCompare(b.companyName);
      if (sortKey === 'name_desc') return b.companyName.localeCompare(a.companyName);
      if (sortKey === 'price_asc') return Number(a.priceMax) - Number(b.priceMax);
      if (sortKey === 'price_desc') return Number(b.priceMax) - Number(a.priceMax);
      if (sortKey === 'size_asc') return Number(a.issueSizeCr) - Number(b.issueSizeCr);
      if (sortKey === 'size_desc') return Number(b.issueSizeCr) - Number(a.issueSizeCr);
      return 0;
    });
  }, [filtered, sortKey]);

  const statusTabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    ...(availableStatuses.includes('OPEN') ? [{ key: 'OPEN' as StatusFilter, label: 'Open' }] : []),
    ...(availableStatuses.includes('UPCOMING') ? [{ key: 'UPCOMING' as StatusFilter, label: 'Upcoming' }] : []),
    ...(availableStatuses.includes('CLOSED') ? [{ key: 'CLOSED' as StatusFilter, label: 'Closed' }] : []),
  ];

  return (
    <div className="space-y-8 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 p-6 md:p-8 font-sans">

      {/* ==========================================
          PAGE HEADER
         ========================================== */}
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[#0F172A] tracking-tight leading-tight font-sans">
          Mainboard IPOs
        </h1>
        <p className="text-[13px] text-slate-500 font-normal font-sans max-w-xl">
          Track upcoming and active Mainboard IPOs, issue prices, issue sizes, and issue dates.
        </p>
      </div>

      {/* ==========================================
          LAST UPDATED + CONTROLS ROW
         ========================================== */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left: Timestamp + Count */}
        <div className="flex flex-col gap-0.5">
          {!isLoading && lastUpdated && (
            <div className="flex items-center gap-1.5 text-[12px] text-slate-400 font-sans">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-slate-500">Last Updated:</span>
              <span>{formatTimestamp(lastUpdated)}</span>
            </div>
          )}
          {!isLoading && !hasError && (
            <p className="text-[12px] text-slate-400">
              {sorted.length} IPO{sorted.length !== 1 ? 's' : ''} shown
            </p>
          )}
        </div>

        {/* Right: Search + Sort */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Mainboard IPOs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-[13px] font-sans text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 transition-all w-52"
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
              className="h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer font-sans appearance-none"
            >
              <option value="date_desc">Latest IPO</option>
              <option value="date_asc">Oldest IPO</option>
              <option value="name_asc">Company A–Z</option>
              <option value="name_desc">Company Z–A</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="size_asc">Size: Low to High</option>
              <option value="size_desc">Size: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs — only shown when backend provides status data */}
      {!isLoading && !hasError && statusTabs.length > 1 && (
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'px-3 py-1 text-[12px] font-semibold rounded-lg transition-all duration-150',
                statusFilter === tab.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ==========================================
          CONTENT
         ========================================== */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : hasError ? (
        <ErrorCard onRetry={fetchData} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No Mainboard IPO data available."
          description={
            search || statusFilter !== 'ALL'
              ? 'No IPOs match your current filters. Try resetting them.'
              : 'No Mainboard IPO data is currently available. Please check back later.'
          }
          onReset={
            search || statusFilter !== 'ALL'
              ? () => { setSearch(''); setStatusFilter('ALL'); }
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
                    <SortableHeader
                      label="Company"
                      ascKey="name_asc"
                      descKey="name_desc"
                      current={sortKey}
                      onSort={setSortKey}
                      className="w-[38%]"
                    />
                    <SortableHeader
                      label="Issue Price"
                      ascKey="price_asc"
                      descKey="price_desc"
                      current={sortKey}
                      onSort={setSortKey}
                      className="text-right"
                    />
                    <SortableHeader
                      label="Size"
                      ascKey="size_asc"
                      descKey="size_desc"
                      current={sortKey}
                      onSort={setSortKey}
                      className="text-right"
                    />
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Issue Dates
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((ipo, idx) => (
                    <tr
                      key={ipo.id || idx}
                      className={cn(
                        'group transition-colors duration-150 cursor-default relative',
                        rowBg(ipo.status)
                      )}
                    >
                      {/* Company */}
                      <td className="px-5 py-4 relative">
                        <StatusAccent status={ipo.status} />
                        <div className="flex items-center gap-3 pl-2">
                          {ipo.companyLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ipo.companyLogo}
                              alt={ipo.companyName}
                              className="w-8 h-8 rounded-lg object-contain border border-slate-100 bg-white p-0.5 shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[14px] text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">
                              {ipo.companyName}
                            </p>
                            <div className="mt-0.5">
                              <IpoTypeBadge type={ipo.type} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Issue Price */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-semibold text-[14px] text-slate-700">
                          {formatPrice(ipo.priceMax)}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-semibold text-[14px] text-slate-700">
                          {formatSize(ipo.issueSizeCr)}
                        </span>
                      </td>

                      {/* Issue Dates */}
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-medium text-slate-600 whitespace-nowrap">
                          {formatIssueDates(ipo.openDate, ipo.closeDate)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          <ListingBadge status={ipo.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-[12px] text-slate-400 font-sans">
                Showing {sorted.length} of {data.length} Mainboard IPO{data.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Mainboard IPO Sheet
              </span>
            </div>
          </div>

          {/* ---- MOBILE: STACKED CARDS ---- */}
          <div className="md:hidden space-y-3">
            {sorted.map((ipo, idx) => (
              <MainboardMobileCard key={ipo.id || idx} ipo={ipo} />
            ))}
            <p className="text-center text-[11px] text-slate-400 pt-2 font-sans">
              {sorted.length} IPO{sorted.length !== 1 ? 's' : ''} &bull; Mainboard IPO Sheet
            </p>
          </div>
        </>
      )}
    </div>
  );
}
