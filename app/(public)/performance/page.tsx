'use client';

import * as React from 'react';
import {
  Search,
  X,
  RefreshCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';

// ==========================================
// DATA INTERFACE
// Maps directly to Google Sheet columns:
// IPO Name | Issue Price | Listing Price | Listing Gain | Current Price | CMP Gain %
//
// BACKEND INTEGRATION:
//   Mainboard: GET /api/mainboard/performance → json.data[]
//   SME:       GET /api/sme/performance       → json.data[]
//
// Backend fields (from PerformanceCard props in cards.tsx):
//   companyName           → ipoName
//   issuePrice            → issuePrice
//   listingPrice          → listingPrice
//   listingGainPercent    → listingGain
//   currentPrice          → currentPrice
//   currentGainPercent    → cmpGain
// ==========================================
export interface PerformanceRecord {
  id?: string;
  ipoName: string;       // IPO Name  (Sheet: "IPO Name")
  issuePrice: string;    // Issue Price (Sheet: "Issue Price") e.g. "₹53.00"
  listingPrice: string;  // Listing Price (Sheet: "Listing Price") e.g. "₹520.00"
  listingGain: string;   // Listing Gain (Sheet: "Listing Gain") e.g. "+22.35%" / "-14.60%"
  currentPrice: string;  // Current Price (Sheet: "Current Price") e.g. "₹599.45" / "N/A"
  cmpGain: string;       // CMP Gain % (Sheet: "CMP Gain %") e.g. "+41.05%" / "--"
}

// ==========================================
// TYPES
// ==========================================
type Board = 'MAINBOARD' | 'SME';
type SortKey =
  | 'default'
  | 'name_asc'
  | 'name_desc'
  | 'listing_gain_desc'
  | 'listing_gain_asc'
  | 'cmp_gain_desc'
  | 'cmp_gain_asc';

// ==========================================
// HELPERS
// ==========================================
function getInitials(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function parseGainNum(val: string): number {
  if (!val || typeof val !== 'string' || val === '--' || val === 'N/A') return NaN;
  return parseFloat(val.replace(/[+%,\s]/g, '')) || 0;
}

function gainColor(val: string): string {
  const n = parseGainNum(val);
  if (isNaN(n)) return 'text-slate-400';
  if (n > 0) return 'text-emerald-600';
  if (n < 0) return 'text-red-500';
  return 'text-slate-500';
}

function GainIcon({ val }: { val: string }) {
  const n = parseGainNum(val);
  if (isNaN(n) || n === 0) return <Minus className="w-3 h-3" />;
  return n > 0
    ? <TrendingUp className="w-3 h-3" />
    : <TrendingDown className="w-3 h-3" />;
}

// Avatar with initials (no fake logo)
function IpoAvatar({ name, board }: { name: string; board: Board }) {
  const initials = getInitials(name);
  const isSme = board === 'SME';
  return (
    <div
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 border',
        isSme
          ? 'bg-gradient-to-br from-purple-50 to-violet-100 text-purple-700 border-purple-100'
          : 'bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 border-blue-100'
      )}
    >
      {initials}
    </div>
  );
}

// ==========================================
// SORTABLE TABLE HEADER
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
    onSort(!isActive || isDesc ? ascKey : descKey);
  }
  return (
    <th
      className={cn(
        'px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none group whitespace-nowrap',
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
// MOBILE PERFORMANCE CARD
// ==========================================
function PerformanceMobileCard({
  record,
  board,
}: {
  record: PerformanceRecord;
  board: Board;
}) {
  const fields: { label: string; value: string; isGain?: boolean }[] = [
    { label: 'Issue Price',    value: record.issuePrice   },
    { label: 'Listing Price',  value: record.listingPrice },
    { label: 'Listing Gain',   value: record.listingGain, isGain: true },
    { label: 'Current Price',  value: record.currentPrice },
    { label: 'CMP Gain %',     value: record.cmpGain,     isGain: true },
  ];

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 space-y-3 shadow-[0_2px_12px_rgba(15,23,42,0.03)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.06)] transition-all duration-200">
      <div className="flex items-center gap-2.5">
        <IpoAvatar name={record.ipoName} board={board} />
        <p className="font-semibold text-[14px] text-slate-800 leading-tight">{record.ipoName}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-slate-100">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide mb-0.5">{f.label}</p>
            <p
              className={cn(
                'font-mono font-semibold text-[13px] flex items-center gap-1',
                f.isGain ? gainColor(f.value) : 'text-slate-700'
              )}
            >
              {f.isGain && <GainIcon val={f.value} />}
              {f.value || '—'}
            </p>
          </div>
        ))}
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
        <h3 className="text-[15px] font-semibold text-slate-800">Unable to load IPO performance data.</h3>
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
// PERFORMANCE TABLE (shared for Mainboard + SME)
// ==========================================
function PerformanceTable({
  records,
  board,
  sortKey,
  onSort,
}: {
  records: PerformanceRecord[];
  board: Board;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
}) {
  return (
    <div className="hidden md:block bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur border-b border-slate-200">
            <tr>
              <SortableHeader
                label="IPO Name"
                ascKey="name_asc"
                descKey="name_desc"
                current={sortKey}
                onSort={onSort}
                className="w-[32%] pl-5"
              />
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Issue Price
              </th>
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Listing Price
              </th>
              <SortableHeader
                label="Listing Gain"
                ascKey="listing_gain_asc"
                descKey="listing_gain_desc"
                current={sortKey}
                onSort={onSort}
                className="text-right"
              />
              <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                Current Price
              </th>
              <SortableHeader
                label="CMP Gain %"
                ascKey="cmp_gain_asc"
                descKey="cmp_gain_desc"
                current={sortKey}
                onSort={onSort}
                className="text-right pr-5"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec, idx) => (
              <tr
                key={rec.id ?? idx}
                className="group hover:bg-slate-50/60 transition-colors duration-150"
              >
                {/* IPO Name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <IpoAvatar name={rec.ipoName} board={board} />
                    <p className="font-semibold text-[14px] text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
                      {rec.ipoName}
                    </p>
                  </div>
                </td>

                {/* Issue Price */}
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-[13px] font-semibold text-slate-700">
                    {rec.issuePrice || '—'}
                  </span>
                </td>

                {/* Listing Price */}
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-[13px] font-semibold text-slate-700">
                    {rec.listingPrice || '—'}
                  </span>
                </td>

                {/* Listing Gain */}
                <td className="px-4 py-4 text-right">
                  <span
                    className={cn(
                      'font-mono text-[13px] font-semibold inline-flex items-center justify-end gap-1',
                      gainColor(rec.listingGain)
                    )}
                  >
                    <GainIcon val={rec.listingGain} />
                    {rec.listingGain || '—'}
                  </span>
                </td>

                {/* Current Price */}
                <td className="px-4 py-4 text-right">
                  <span className="font-mono text-[13px] font-semibold text-slate-700">
                    {rec.currentPrice || '—'}
                  </span>
                </td>

                {/* CMP Gain % */}
                <td className="px-5 py-4 text-right">
                  <span
                    className={cn(
                      'font-mono text-[13px] font-semibold inline-flex items-center justify-end gap-1',
                      gainColor(rec.cmpGain)
                    )}
                  >
                    <GainIcon val={rec.cmpGain} />
                    {rec.cmpGain || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <span className="text-[12px] text-slate-400 font-sans">
          {records.length} record{records.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          {board === 'MAINBOARD' ? 'Mainboard' : 'SME'} Performance Sheet
        </span>
      </div>
    </div>
  );
}

// ==========================================
// BOARD-SWITCHER (Mainboard ↔ SME)
// ==========================================
function PerformanceSwitcher({
  active,
  onChange,
}: {
  active: Board;
  onChange: (b: Board) => void;
}) {
  const tabs: { key: Board; label: string }[] = [
    { key: 'MAINBOARD', label: 'Mainboard IPO Performance' },
    { key: 'SME',       label: 'SME IPO Performance' },
  ];
  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-150 whitespace-nowrap',
            active === tab.key
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
export default function PerformancePage() {
  // ── Active Board ─────────────────────────────────────────────────────────
  const [activeBoard, setActiveBoard] = React.useState<Board>('MAINBOARD');

  // ── Data & Async State ───────────────────────────────────────────────────
  const [mainboardData, setMainboardData] = React.useState<PerformanceRecord[]>([]);
  const [smeData, setSmeData] = React.useState<PerformanceRecord[]>([]);
  const [loadingBoard, setLoadingBoard] = React.useState<Board | null>(null);
  const [errorBoard, setErrorBoard] = React.useState<Board | null>(null);

  // ── Controls ─────────────────────────────────────────────────────────────
  const [search, setSearch] = React.useState('');
  const [sortKey, setSortKey] = React.useState<SortKey>('default');

  // ==========================================
  // FETCH LOGIC
  // Map backend PerformanceRecord fields → our interface
  // Backend returns: companyName, issuePrice, listingPrice, listingGainPercent, currentPrice, currentGainPercent
  // ==========================================
  function mapRecord(raw: any): PerformanceRecord {
    // Support both existing DB field names and future sheet-mapped field names
    const ipoName =
      raw.ipoName ?? raw.companyName ?? raw['IPO Name'] ?? '';
    const issuePrice =
      raw.issuePrice !== undefined && raw.issuePrice !== null
        ? typeof raw.issuePrice === 'number'
          ? `₹${raw.issuePrice.toFixed(2)}`
          : `₹${raw.issuePrice}`
        : raw['Issue Price'] ?? '—';
    const listingPrice =
      raw.listingPrice !== undefined && raw.listingPrice !== null
        ? typeof raw.listingPrice === 'number'
          ? `₹${raw.listingPrice.toFixed(2)}`
          : `₹${raw.listingPrice}`
        : raw['Listing Price'] ?? '—';
    const listingGain =
      raw.listingGain ??
      raw['Listing Gain'] ??
      (raw.listingGainPercent !== undefined && raw.listingGainPercent !== null
        ? Number(raw.listingGainPercent) >= 0
          ? `+${Number(raw.listingGainPercent).toFixed(2)}%`
          : `${Number(raw.listingGainPercent).toFixed(2)}%`
        : '—');
    const currentPrice =
      raw.currentPrice !== undefined && raw.currentPrice !== null
        ? typeof raw.currentPrice === 'number' && raw.currentPrice > 0
          ? `₹${raw.currentPrice.toFixed(2)}`
          : String(raw.currentPrice) || 'N/A'
        : raw['Current Price'] ?? 'N/A';
    const cmpGain =
      raw.cmpGain ??
      raw['CMP Gain %'] ??
      (raw.currentGainPercent !== undefined && raw.currentGainPercent !== null
        ? Number(raw.currentGainPercent) >= 0
          ? `+${Number(raw.currentGainPercent).toFixed(2)}%`
          : `${Number(raw.currentGainPercent).toFixed(2)}%`
        : '--');
    return { id: raw.id, ipoName, issuePrice, listingPrice, listingGain, currentPrice, cmpGain };
  }

  const fetchBoard = React.useCallback(async (board: Board) => {
    const url = board === 'MAINBOARD' ? '/api/mainboard/performance' : '/api/sme/performance';
    setLoadingBoard(board);
    setErrorBoard(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const mapped: PerformanceRecord[] = (json.data || []).map(mapRecord);
      if (board === 'MAINBOARD') setMainboardData(mapped);
      else setSmeData(mapped);
    } catch {
      setErrorBoard(board);
    } finally {
      setLoadingBoard(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch on initial mount and whenever board switches (lazy-fetch SME only on first visit)
  React.useEffect(() => {
    if (activeBoard === 'MAINBOARD' && mainboardData.length === 0 && loadingBoard !== 'MAINBOARD') {
      fetchBoard('MAINBOARD');
    }
    if (activeBoard === 'SME' && smeData.length === 0 && loadingBoard !== 'SME') {
      fetchBoard('SME');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBoard]);

  // Switch board → reset search + sort
  function handleBoardChange(board: Board) {
    setActiveBoard(board);
    setSearch('');
    setSortKey('default');
  }

  // ── Current dataset ───────────────────────────────────────────────────────
  const rawData = activeBoard === 'MAINBOARD' ? mainboardData : smeData;
  const isLoading = loadingBoard === activeBoard;
  const hasError = errorBoard === activeBoard;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = React.useMemo(
    () =>
      rawData.filter(
        (r) => !search || r.ipoName.toLowerCase().includes(search.toLowerCase())
      ),
    [rawData, search]
  );

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = React.useMemo(() => {
    if (sortKey === 'default') return filtered;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name_asc')  return a.ipoName.localeCompare(b.ipoName);
      if (sortKey === 'name_desc') return b.ipoName.localeCompare(a.ipoName);
      const lg = (x: PerformanceRecord) => {
        const n = parseGainNum(x.listingGain);
        return isNaN(n) ? -Infinity : n;
      };
      const cg = (x: PerformanceRecord) => {
        const n = parseGainNum(x.cmpGain);
        return isNaN(n) ? -Infinity : n;
      };
      if (sortKey === 'listing_gain_desc') return lg(b) - lg(a);
      if (sortKey === 'listing_gain_asc')  return lg(a) - lg(b);
      if (sortKey === 'cmp_gain_desc') return cg(b) - cg(a);
      if (sortKey === 'cmp_gain_asc')  return cg(a) - cg(b);
      return 0;
    });
  }, [filtered, sortKey]);

  const pageTitle = activeBoard === 'MAINBOARD'
    ? 'Mainboard IPO Performance'
    : 'SME IPO Performance';
  const pageSubtitle = activeBoard === 'MAINBOARD'
    ? 'Track returns of listed Mainboard IPOs with real-time updates.'
    : 'Track returns of listed SME IPOs with real-time updates.';
  const emptyTitle = activeBoard === 'MAINBOARD'
    ? 'No Mainboard IPO performance data available.'
    : 'No SME IPO performance data available.';

  return (
    <div className="space-y-8 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 p-6 md:p-8 font-sans">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="space-y-1">
        <h1 className="text-[22px] md:text-[26px] font-bold text-[#0F172A] tracking-tight leading-tight font-sans">
          {pageTitle}
        </h1>
        <p className="text-[13px] text-slate-500 font-normal font-sans max-w-xl">
          {pageSubtitle}
        </p>
      </div>

      {/* ===================== CONTROLS ===================== */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        {/* Board Switcher */}
        <PerformanceSwitcher active={activeBoard} onChange={handleBoardChange} />

        {/* Right: Count + Search + Sort */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Count */}
          {!isLoading && !hasError && (
            <span className="text-[12px] text-slate-400 font-sans mr-1">
              {sorted.length} record{sorted.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search IPOs..."
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

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer font-sans appearance-none"
            >
              <option value="default">Default Order</option>
              <option value="name_asc">IPO Name A–Z</option>
              <option value="name_desc">IPO Name Z–A</option>
              <option value="listing_gain_desc">Listing Gain: High to Low</option>
              <option value="listing_gain_asc">Listing Gain: Low to High</option>
              <option value="cmp_gain_desc">CMP Gain: High to Low</option>
              <option value="cmp_gain_asc">CMP Gain: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================== CONTENT ===================== */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : hasError ? (
        <ErrorCard onRetry={() => fetchBoard(activeBoard)} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={
            search
              ? `No IPOs matching "${search}". Try a different search.`
              : 'No performance data is currently available. Please check back later.'
          }
          onReset={search ? () => setSearch('') : undefined}
        />
      ) : (
        <>
          {/* ---- DESKTOP TABLE ---- */}
          <PerformanceTable
            records={sorted}
            board={activeBoard}
            sortKey={sortKey}
            onSort={setSortKey}
          />

          {/* ---- MOBILE: STACKED CARDS ---- */}
          <div className="md:hidden space-y-3">
            {sorted.map((rec, idx) => (
              <PerformanceMobileCard
                key={rec.id ?? idx}
                record={rec}
                board={activeBoard}
              />
            ))}
            <p className="text-center text-[11px] text-slate-400 pt-2 font-sans">
              {sorted.length} record{sorted.length !== 1 ? 's' : ''} &bull;{' '}
              {activeBoard === 'MAINBOARD' ? 'Mainboard' : 'SME'} Performance Sheet
            </p>
          </div>
        </>
      )}
    </div>
  );
}
