'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  RefreshCcw,
  ArrowUpDown,
  Clock,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';
import { formatDateOnly, parseDateOnly } from '@/utils/dateUtils';

// ==========================================
// DATA INTERFACE
// Source: GET /api/gmp/live → ipoRepo.findLiveGMP()
// Returns IPO objects with status IN [UPCOMING, OPEN, CLOSED]
// Includes gmpHistory[0] (latest GMP snapshot)
//
// Field mapping from Prisma IPO model:
//   companyName  → company name
//   type         → MAINBOARD | SME
//   status       → UPCOMING | OPEN | CLOSED
//   openDate     → Bidding Opens
//   closeDate    → Bidding Closes
//   listingDate  → Listing Settlement (real backend field, may be null)
//   priceMin/Max → Issue Price range
//   issueSizeCr  → Issue Size
//   updatedAt    → Last Updated timestamp
//   gmpHistory[0].gmp → latest GMP (displayed in card, secondary info)
// ==========================================
interface CalendarIpo {
  id: string;
  companyName: string;
  type: string;
  status: string;
  openDate: string | null;
  closeDate: string | null;
  listingDate: string | null;
  priceMin: number | null;
  priceMax: number | null;
  issueSizeCr: number | null;
  gmp: number | null;
  updatedAt: string | null;
}

type StatusFilter = 'ALL' | 'UPCOMING' | 'OPEN' | 'CLOSED';
type SortKey = 'date_asc' | 'date_desc' | 'name_asc' | 'name_desc';

// ==========================================
// BACKEND → INTERFACE MAPPER
// ==========================================
function mapIpo(raw: any): CalendarIpo {
  return {
    id: raw.id ?? '',
    companyName: raw.companyName ?? '',
    type: raw.type ?? '',
    status: raw.status ?? '',
    openDate: raw.openDate ?? null,
    closeDate: raw.closeDate ?? null,
    listingDate: raw.listingDate ?? null,
    priceMin: raw.priceMin != null ? Number(raw.priceMin) : null,
    priceMax: raw.priceMax != null ? Number(raw.priceMax) : null,
    issueSizeCr: raw.issueSizeCr != null ? Number(raw.issueSizeCr) : null,
    gmp: raw.currentGmp != null ? Number(raw.currentGmp) : (raw.gmpHistory?.[0]?.gmp != null ? Number(raw.gmpHistory[0].gmp) : null),
    updatedAt: raw.updatedAt ?? null,
  };
}

// ==========================================
// STATUS HELPERS
// Derived from current date vs backend dates
// ==========================================
type DerivedStatus = 'UPCOMING' | 'OPEN' | 'CLOSED';

function derivedStatus(ipo: CalendarIpo): DerivedStatus {
  // Prefer backend status if reliable
  const s = ipo.status?.toUpperCase();
  if (s === 'OPEN')     return 'OPEN';
  if (s === 'UPCOMING') return 'UPCOMING';
  if (s === 'CLOSED')   return 'CLOSED';
  // Fallback: derive from dates
  const now = Date.now();
  const open = parseDateOnly(ipo.openDate)?.getTime() ?? null;
  const close = parseDateOnly(ipo.closeDate)?.getTime() ?? null;
  if (open && now < open)  return 'UPCOMING';
  if (close && now > close) return 'CLOSED';
  return 'OPEN';
}

const STATUS_STYLE: Record<DerivedStatus, { pill: string; rowBg: string; accent: string }> = {
  UPCOMING: {
    pill: 'bg-blue-50 text-blue-700 border-blue-100',
    rowBg: 'hover:bg-blue-50/20',
    accent: 'bg-blue-400',
  },
  OPEN: {
    pill: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rowBg: 'hover:bg-emerald-50/25',
    accent: 'bg-emerald-400',
  },
  CLOSED: {
    pill: 'bg-slate-100 text-slate-500 border-slate-200',
    rowBg: 'hover:bg-slate-50/60',
    accent: 'bg-slate-300',
  },
};

// ==========================================
// FORMATTING HELPERS
// ==========================================
function fmt(d: string | null, opts?: Intl.DateTimeFormatOptions): string {
  return formatDateOnly(d, opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtMonth(d: string | null): string {
  return formatDateOnly(d, { day: 'numeric', month: 'short' });
}

function fmtPrice(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `₹${min}–₹${max}`;
  return `₹${max ?? min}`;
}

function fmtLastUpdated(ts: string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
    }) + ' IST';
  } catch { return ts; }
}

// ==========================================
// CALENDAR HELPERS
// ==========================================
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ==========================================
// TYPE BADGE
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

// ==========================================
// STATUS BADGE
// ==========================================
function StatusBadge({ status }: { status: DerivedStatus }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border',
      STATUS_STYLE[status].pill
    )}>
      {status}
    </span>
  );
}

// ==========================================
// CALENDAR EVENT DOT (shown in grid cells)
// ==========================================
function CalendarEventDot({ status, isOpen, isClose }: {
  status: DerivedStatus; isOpen: boolean; isClose: boolean;
}) {
  return (
    <div className={cn(
      'text-[9px] font-semibold px-1 py-0.5 rounded truncate leading-tight',
      status === 'OPEN'     ? 'bg-emerald-100 text-emerald-700' :
      status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-500'
    )}>
      {isOpen ? '▸ Open' : isClose ? '◼ Close' : '•'}
    </div>
  );
}

// ==========================================
// CALENDAR GRID CELL EVENT
// ==========================================
function CalendarCellEvent({
  ipo, isOpen, isClose,
}: {
  ipo: CalendarIpo; isOpen: boolean; isClose: boolean;
}) {
  const status = derivedStatus(ipo);
  return (
    <div className={cn(
      'group rounded-lg px-1.5 py-1 mb-0.5 cursor-default transition-all duration-150',
      status === 'OPEN'     ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-100' :
      status === 'UPCOMING' ? 'bg-blue-50 hover:bg-blue-100 border border-blue-100' :
                              'bg-slate-50 hover:bg-slate-100 border border-slate-100'
    )}>
      <p className="text-[9px] font-bold text-slate-700 leading-tight truncate">{ipo.companyName}</p>
      <p className={cn('text-[8px] font-semibold',
        status === 'OPEN' ? 'text-emerald-600' :
        status === 'UPCOMING' ? 'text-blue-600' : 'text-slate-400'
      )}>
        {isOpen ? 'Opens' : isClose ? 'Closes' : ''}
      </p>
    </div>
  );
}

// ==========================================
// IPO CALENDAR CARD (list view)
// ==========================================
function IpoCalendarCard({ ipo }: { ipo: CalendarIpo }) {
  const status = derivedStatus(ipo);
  const styleSet = STATUS_STYLE[status];

  return (
    <div className={cn(
      'bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]',
      'hover:shadow-[0_6px_24px_rgba(15,23,42,0.06)] transition-all duration-200 relative overflow-hidden',
      styleSet.rowBg
    )}>
      {/* Left accent bar */}
      <span className={cn('absolute left-0 top-4 bottom-4 w-[3px] rounded-full', styleSet.accent)} />

      <div className="pl-3 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-[15px] text-slate-800 leading-tight truncate">
              {ipo.companyName}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <TypeBadge type={ipo.type} />
              <StatusBadge status={status} />
            </div>
          </div>
          {ipo.gmp != null && (
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">GMP</p>
              <p className={cn('font-mono font-bold text-[13px]',
                ipo.gmp > 0 ? 'text-emerald-600' : ipo.gmp < 0 ? 'text-red-500' : 'text-slate-500'
              )}>
                {ipo.gmp >= 0 ? '+' : ''}₹{ipo.gmp}
              </p>
            </div>
          )}
        </div>

        {/* Timeline dates */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Bidding Opens</p>
            <p className="text-[12px] font-semibold text-slate-700">{fmtMonth(ipo.openDate)}</p>
            <p className="text-[10px] text-slate-400">{fmt(ipo.openDate, { year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Bidding Closes</p>
            <p className="text-[12px] font-semibold text-slate-700">{fmtMonth(ipo.closeDate)}</p>
            <p className="text-[10px] text-slate-400">{fmt(ipo.closeDate, { year: 'numeric' })}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Listing</p>
            <p className="text-[12px] font-semibold text-slate-700">
              {ipo.listingDate ? fmtMonth(ipo.listingDate) : '—'}
            </p>
            {ipo.listingDate && (
              <p className="text-[10px] text-slate-400">{fmt(ipo.listingDate, { year: 'numeric' })}</p>
            )}
          </div>
        </div>

        {/* Price + Size */}
        {(ipo.priceMin != null || ipo.priceMax != null || ipo.issueSizeCr != null) && (
          <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
            {(ipo.priceMin != null || ipo.priceMax != null) && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Price</p>
                <p className="font-mono font-semibold text-[12px] text-slate-700">
                  {fmtPrice(ipo.priceMin, ipo.priceMax)}
                </p>
              </div>
            )}
            {ipo.issueSizeCr != null && (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Issue Size</p>
                <p className="font-mono font-semibold text-[12px] text-slate-700">₹{ipo.issueSizeCr} Cr.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MOBILE CARD
// ==========================================
function MobileIpoCard({ ipo }: { ipo: CalendarIpo }) {
  return <IpoCalendarCard ipo={ipo} />;
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
        <h3 className="text-[15px] font-semibold text-slate-800">Unable to load IPO calendar data.</h3>
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
// CALENDAR GRID VIEW
// ==========================================
function CalendarGrid({
  ipos,
  year,
  month,
}: {
  ipos: CalendarIpo[];
  year: number;
  month: number;
}) {
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  // Build map: date-string → events
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, { ipo: CalendarIpo; isOpen: boolean; isClose: boolean }[]> = {};
    ipos.forEach((ipo) => {
      const addEvent = (dateStr: string | null, isOpen: boolean, isClose: boolean) => {
        if (!dateStr) return;
        const d = parseDateOnly(dateStr);
        if (!d) return;
        if (d.getFullYear() !== year || d.getMonth() !== month) return;
        const key = isoDate(year, month, d.getDate());
        if (!map[key]) map[key] = [];
        map[key].push({ ipo, isOpen, isClose });
      };
      addEvent(ipo.openDate, true, false);
      if (ipo.closeDate !== ipo.openDate) addEvent(ipo.closeDate, false, true);
      if (ipo.listingDate) addEvent(ipo.listingDate, false, false);
    });
    return map;
  }, [ipos, year, month]);

  const todayStr = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Build grid cells (blanks before first day + days of month)
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`blank-${idx}`} className="min-h-[90px] border-b border-r border-slate-100/60 bg-slate-50/30" />;
          }
          const key = isoDate(year, month, day);
          const events = eventsByDate[key] ?? [];
          const isToday = key === todayStr;

          return (
            <div
              key={key}
              className={cn(
                'min-h-[90px] p-1.5 border-b border-r border-slate-100/60 transition-colors',
                isToday ? 'bg-blue-50/30' : 'hover:bg-slate-50/40'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-[11px] font-bold leading-none w-5 h-5 flex items-center justify-center rounded-full',
                  isToday
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500'
                )}>
                  {day}
                </span>
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {events.slice(0, 3).map((e, i) => (
                  <CalendarCellEvent key={i} ipo={e.ipo} isOpen={e.isOpen} isClose={e.isClose} />
                ))}
                {events.length > 3 && (
                  <p className="text-[8px] text-slate-400 pl-1">+{events.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function CalendarPage() {
  // ── Data State ────────────────────────────────────────────────────────────
  const [data, setData] = React.useState<CalendarIpo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  // ── Controls ──────────────────────────────────────────────────────────────
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL');
  const [sortKey, setSortKey] = React.useState<SortKey>('date_asc');

  // ── Calendar nav ──────────────────────────────────────────────────────────
  const today = new Date();
  const [calYear,  setCalYear]  = React.useState(today.getFullYear());
  const [calMonth, setCalMonth] = React.useState(today.getMonth());

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/gmp/live');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const mapped: CalendarIpo[] = (json.data || []).map(mapIpo);
      setData(mapped);
      // Derive last updated from the most-recent updatedAt across all IPOs
      const latest = mapped.reduce((acc: string | null, ipo) => {
        if (!ipo.updatedAt) return acc;
        if (!acc) return ipo.updatedAt;
        return new Date(ipo.updatedAt) > new Date(acc) ? ipo.updatedAt : acc;
      }, null);
      setLastUpdated(latest);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return data.filter((ipo) => {
      const matchSearch = !search || ipo.companyName.toLowerCase().includes(search.toLowerCase());
      const ds = derivedStatus(ipo);
      const matchStatus = statusFilter === 'ALL' || ds === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const dateA = parseDateOnly(a.openDate)?.getTime() ?? Infinity;
      const dateB = parseDateOnly(b.openDate)?.getTime() ?? Infinity;
      if (sortKey === 'date_asc')  return dateA - dateB;
      if (sortKey === 'date_desc') return dateB - dateA;
      if (sortKey === 'name_asc')  return a.companyName.localeCompare(b.companyName);
      if (sortKey === 'name_desc') return b.companyName.localeCompare(a.companyName);
      return 0;
    });
  }, [filtered, sortKey]);

  // Status filter tabs — only build tabs for statuses actually in data
  const hasUpcoming = data.some((d) => derivedStatus(d) === 'UPCOMING');
  const hasOpen     = data.some((d) => derivedStatus(d) === 'OPEN');
  const hasClosed   = data.some((d) => derivedStatus(d) === 'CLOSED');

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',      label: 'All' },
    ...(hasOpen     ? [{ key: 'OPEN'     as StatusFilter, label: 'Open'     }] : []),
    ...(hasUpcoming ? [{ key: 'UPCOMING' as StatusFilter, label: 'Upcoming' }] : []),
    ...(hasClosed   ? [{ key: 'CLOSED'   as StatusFilter, label: 'Closed'   }] : []),
  ];

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }

  return (
    <div className="space-y-0 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 font-sans">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white border-b border-slate-200/60 px-6 md:px-8 py-8 md:py-10">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <CalendarDays className="w-3 h-3" />
            IPO Calendar
          </span>
          <h1 className="text-[26px] md:text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">
            IPO Calendar
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-xl">
            Track upcoming IPO opening dates, closing dates, and listing events in one place.
          </p>

          {/* Last Updated */}
          {!isLoading && lastUpdated && (
            <div className="flex items-center gap-1.5 text-[12px] text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-slate-500">Last Updated:</span>
              <span>{fmtLastUpdated(lastUpdated)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 md:px-8 pt-6 space-y-6">

        {/* ===================== CONTROLS ===================== */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Left: Filter tabs + count */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isLoading && !hasError && filterTabs.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                <Filter className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
                {filterTabs.map((tab) => (
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                <option value="date_asc">Issue Date ↑</option>
                <option value="date_desc">Issue Date ↓</option>
                <option value="name_asc">Company A–Z</option>
                <option value="name_desc">Company Z–A</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================== CONTENT ===================== */}
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : hasError ? (
          <ErrorCard onRetry={fetchData} />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No IPO calendar data available."
            description={
              search || statusFilter !== 'ALL'
                ? 'No IPOs match your current filters. Try resetting them.'
                : 'No IPO data is currently available. Please check back later.'
            }
            onReset={
              search || statusFilter !== 'ALL'
                ? () => { setSearch(''); setStatusFilter('ALL'); }
                : undefined
            }
          />
        ) : (
          <div className="space-y-6">
            {/* ---- CALENDAR GRID (desktop) ---- */}
            <div className="hidden lg:block">
              {/* Month nav header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-slate-800">
                  {MONTH_NAMES[calMonth]} {calYear}
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              <CalendarGrid ipos={data} year={calYear} month={calMonth} />

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 px-1">
                <span className="text-[11px] text-slate-400 font-semibold">Legend:</span>
                {[
                  { color: 'bg-emerald-100 text-emerald-700', label: 'Open' },
                  { color: 'bg-blue-100 text-blue-700', label: 'Upcoming' },
                  { color: 'bg-slate-100 text-slate-500', label: 'Closed' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={cn('inline-block w-2.5 h-2.5 rounded-sm', l.color)} />
                    <span className="text-[11px] text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- IPO LIST / CARDS (always visible on mobile, below calendar on desktop) ---- */}
            <div>
              <h2 className="text-[14px] font-bold text-slate-700 mb-3 lg:mt-2">
                All IPO Events
                <span className="ml-2 text-[12px] font-normal text-slate-400">
                  ({sorted.length} IPO{sorted.length !== 1 ? 's' : ''})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sorted.map((ipo, idx) => (
                  <IpoCalendarCard key={ipo.id || idx} ipo={ipo} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
