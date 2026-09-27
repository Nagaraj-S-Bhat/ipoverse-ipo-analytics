'use client';

import * as React from 'react';
import { Search, RefreshCcw, ArrowLeftRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';

// ==========================================
// DATA INTERFACE
// Source: GET /api/summary → ipoRepo.findLiveSummary()
// Returns IPO objects with gmpHistory[0] + subscriptionHistory[0]
//
// Exactly 5 comparison fields from "Live IPO Summary" sheet:
//   1. IPO          → companyName + type + status
//   2. Price · Lot  → priceMin, priceMax, lotSize, minimumInvestment
//   3. GMP          → gmpHistory[0].gmp + expectedListingGain + derived est. listing
//   4. Subscription → subscriptionHistory[0].total + qib + nii + retail
//   5. Review       → reviewSummary
//
// GMP Trend is explicitly excluded.
// ==========================================
interface CompareIpo {
  id: string;
  // Field 1: IPO
  companyName: string;
  type: string;
  status: string;
  // Field 2: Price · Lot
  priceMin: number | null;
  priceMax: number | null;
  lotSize: number | null;
  minimumInvestment: number | null;
  // Field 3: GMP
  gmp: number | null;
  expectedListingGain: number | null;
  // Field 4: Subscription
  totalSubscription: number | null;
  qibSub: number | null;
  niiSub: number | null;
  retailSub: number | null;
  // Field 5: Review
  reviewSummary: string | null;
}

// ==========================================
// BACKEND → INTERFACE MAPPER
// (identical shape to IPO Summary page)
// ==========================================
function mapIpo(raw: any): CompareIpo {
  const gmpRaw = raw.gmp ?? raw.currentGmp ?? raw.gmpValue ?? raw.gmpHistory?.[0]?.gmp ?? null;
  const gmp = gmpRaw != null ? Number(gmpRaw) : null;

  const gmpGainRaw = raw.gmpPercent ?? raw.expectedListingGain ?? raw.gmpHistory?.[0]?.expectedListingGain ?? null;
  const expectedListingGain = gmpGainRaw != null ? Number(gmpGainRaw) : null;

  const subRaw = raw.subscription ?? raw.subscriptionTotal ?? raw.totalSubscription ?? raw.subscriptionRate ?? raw.subscriptionHistory?.[0]?.total ?? null;
  const totalSubscription = subRaw != null ? Number(subRaw) : null;

  const qibSub = (raw.qib ?? raw.qibSub ?? raw.subscriptionHistory?.[0]?.qib) != null ? Number(raw.qib ?? raw.qibSub ?? raw.subscriptionHistory?.[0]?.qib) : null;
  const niiSub = (raw.nii ?? raw.hni ?? raw.niiSub ?? raw.subscriptionHistory?.[0]?.nii) != null ? Number(raw.nii ?? raw.hni ?? raw.niiSub ?? raw.subscriptionHistory?.[0]?.nii) : null;
  const retailSub = (raw.retail ?? raw.retailSub ?? raw.subscriptionHistory?.[0]?.retail) != null ? Number(raw.retail ?? raw.retailSub ?? raw.subscriptionHistory?.[0]?.retail) : null;

  return {
    id: raw.id ?? '',
    companyName: raw.companyName ?? '',
    type: raw.type ?? '',
    status: raw.status ?? '',
    priceMin: raw.priceMin != null ? Number(raw.priceMin) : null,
    priceMax: raw.priceMax != null ? Number(raw.priceMax) : null,
    lotSize: raw.lotSize ?? null,
    minimumInvestment: raw.minimumInvestment != null ? Number(raw.minimumInvestment) : null,
    gmp,
    expectedListingGain,
    totalSubscription,
    qibSub,
    niiSub,
    retailSub,
    reviewSummary: raw.reviewSummary ?? null,
  };
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function fmtPrice(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `₹${min}–₹${max}`;
  return `₹${max ?? min}`;
}

function fmtMoney(n: number | null): string {
  return n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';
}

function gmpColor(gmp: number | null) {
  if (gmp == null) return 'text-slate-400';
  if (gmp > 0) return 'text-emerald-600';
  if (gmp < 0) return 'text-red-500';
  return 'text-slate-500';
}

function gainColor(pct: number | null) {
  if (pct == null) return 'text-slate-400';
  if (pct > 0) return 'text-emerald-600';
  if (pct < 0) return 'text-red-500';
  return 'text-slate-500';
}

function fmtGainPct(pct: number | null): string {
  if (pct == null) return '—';
  if (pct === 0) return '0%';
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}

function reviewSentiment(review: string | null): 'positive' | 'negative' | 'neutral' {
  if (!review) return 'neutral';
  const l = review.toLowerCase();
  if (l.includes('strong') || l.includes('apply') || l.includes('buy')) return 'positive';
  if (l.includes('avoid') || l.includes('risky') || l.includes('skip')) return 'negative';
  return 'neutral';
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
      {type || '—'}
    </span>
  );
}

// ==========================================
// STATUS BADGE
// ==========================================
function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const styles =
    s === 'OPEN'     ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    s === 'UPCOMING' ? 'bg-blue-50 text-blue-700 border-blue-100'         :
    s === 'CLOSED'   ? 'bg-amber-50 text-amber-700 border-amber-100'       :
                       'bg-slate-50 text-slate-500 border-slate-100';
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
      styles
    )}>
      {status || '—'}
    </span>
  );
}

// ==========================================
// REVIEW BADGE
// ==========================================
function ReviewBadge({ text }: { text: string | null }) {
  if (!text) return <span className="text-[13px] text-slate-400 font-medium">—</span>;
  const sentiment = reviewSentiment(text);
  const styles =
    sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    sentiment === 'negative' ? 'bg-red-50 text-red-600 border-red-200'             :
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
// IPO SELECTOR (searchable dropdown)
// ==========================================
function IpoSelector({
  label,
  ipos,
  selected,
  onChange,
  excludeId,
}: {
  label: string;
  ipos: CompareIpo[];
  selected: CompareIpo | null;
  onChange: (ipo: CompareIpo) => void;
  excludeId?: string;
}) {
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const options = ipos.filter(
    (ipo) =>
      ipo.id !== excludeId &&
      (!search || ipo.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="space-y-1.5" ref={ref}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-left text-[13px] font-semibold text-slate-700 hover:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
      >
        <span className="truncate">{selected ? selected.companyName : 'Select an IPO...'}</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search inside dropdown */}
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search IPOs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-[12px] rounded-lg border border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700"
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-[12px] text-slate-400 text-center">No IPOs found.</div>
            ) : (
              options.map((ipo) => (
                <button
                  key={ipo.id}
                  type="button"
                  onClick={() => { onChange(ipo); setOpen(false); setSearch(''); }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2',
                    selected?.id === ipo.id && 'bg-blue-50 text-blue-700'
                  )}
                >
                  <TypeBadge type={ipo.type} />
                  <span className="truncate">{ipo.companyName}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// FIELD CELL — renders a single IPO's value
// for one comparison row
// ==========================================
function FieldCell({ ipo, field }: { ipo: CompareIpo | null; field: string }) {
  if (!ipo) {
    return <span className="text-[13px] text-slate-400">—</span>;
  }

  switch (field) {
    case 'ipo':
      return (
        <div className="space-y-1.5">
          <p className="font-bold text-[15px] text-slate-800 leading-tight">{ipo.companyName}</p>
          <div className="flex flex-wrap gap-1">
            <TypeBadge type={ipo.type} />
            <StatusBadge status={ipo.status} />
          </div>
        </div>
      );

    case 'price_lot':
      return (
        <div className="space-y-0.5">
          <p className="font-mono font-semibold text-[14px] text-slate-700">
            {fmtPrice(ipo.priceMin, ipo.priceMax)}
          </p>
          {ipo.lotSize != null && (
            <p className="text-[12px] text-slate-500">Lot {ipo.lotSize} shares</p>
          )}
          {ipo.minimumInvestment != null && (
            <p className="text-[12px] text-slate-400">Min {fmtMoney(ipo.minimumInvestment)}</p>
          )}
        </div>
      );

    case 'gmp':
      if (ipo.gmp == null) return <span className="text-[13px] text-slate-400">—</span>;
      const estListing = ipo.priceMax != null && ipo.gmp != null ? ipo.priceMax + ipo.gmp : null;
      return (
        <div className="space-y-0.5">
          <p className={cn('font-mono font-bold text-[15px]', gmpColor(ipo.gmp))}>
            {ipo.gmp > 0 ? '+' : ''}₹{ipo.gmp}
          </p>
          {ipo.expectedListingGain != null && (
            <p className={cn('text-[12px] font-semibold', gainColor(ipo.expectedListingGain))}>
              {fmtGainPct(ipo.expectedListingGain)}
            </p>
          )}
          {estListing != null && (
            <p className="text-[12px] text-slate-400">Est. {fmtMoney(estListing)}</p>
          )}
        </div>
      );

    case 'subscription':
      if (ipo.totalSubscription == null) return <span className="text-[13px] text-slate-400">—</span>;
      return (
        <div className="space-y-1">
          <p className="font-bold text-[15px] text-slate-800">{ipo.totalSubscription.toFixed(2)}x</p>
          <div className="flex flex-wrap gap-2">
            {ipo.qibSub != null && (
              <span className="text-[11px] text-slate-500">
                QIB <span className="font-semibold text-slate-700">{ipo.qibSub.toFixed(1)}x</span>
              </span>
            )}
            {ipo.niiSub != null && (
              <span className="text-[11px] text-slate-500">
                HNI <span className="font-semibold text-slate-700">{ipo.niiSub.toFixed(1)}x</span>
              </span>
            )}
            {ipo.retailSub != null && (
              <span className="text-[11px] text-slate-500">
                Ret <span className="font-semibold text-slate-700">{ipo.retailSub.toFixed(1)}x</span>
              </span>
            )}
          </div>
        </div>
      );

    case 'review':
      return <ReviewBadge text={ipo.reviewSummary} />;

    default:
      return <span className="text-[13px] text-slate-400">—</span>;
  }
}

// ==========================================
// COMPARISON TABLE ROWS
// Exactly 5 rows — one per Live IPO Summary field
// ==========================================
const COMPARISON_ROWS: { key: string; label: string; sublabel?: string }[] = [
  { key: 'ipo',          label: 'IPO' },
  { key: 'price_lot',    label: 'Price · Lot',    sublabel: 'Issue price and lot details' },
  { key: 'gmp',          label: 'GMP',            sublabel: 'Grey Market Premium' },
  { key: 'subscription', label: 'Subscription',   sublabel: 'QIB · HNI · Retail' },
  { key: 'review',       label: 'Review',         sublabel: 'Analyst assessment' },
];

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
        <h3 className="text-[15px] font-semibold text-slate-800">Unable to load IPO comparison data.</h3>
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
export default function ComparisonPage() {
  const [ipos,       setIpos]       = React.useState<CompareIpo[]>([]);
  const [isLoading,  setIsLoading]  = React.useState(true);
  const [hasError,   setHasError]   = React.useState(false);
  const [primaryIpo, setPrimaryIpo] = React.useState<CompareIpo | null>(null);
  const [targetIpo,  setTargetIpo]  = React.useState<CompareIpo | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const mapped: CompareIpo[] = (json.data || []).map(mapIpo);
      setIpos(mapped);
      // Default to first two
      if (mapped.length > 0) setPrimaryIpo(mapped[0]);
      if (mapped.length > 1) setTargetIpo(mapped[1]);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // ── Swap IPOs ─────────────────────────────────────────────────────────────
  function handleSwap() {
    const tmp = primaryIpo;
    setPrimaryIpo(targetIpo);
    setTargetIpo(tmp);
  }

  return (
    <div className="space-y-0 pb-16 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 font-sans">

      {/* ===================== PAGE HEADER ===================== */}
      <div className="bg-white border-b border-slate-200/60 px-6 md:px-8 py-8 md:py-10">
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <ArrowLeftRight className="w-3 h-3" />
            IPO Comparison
          </span>
          <h1 className="text-[26px] md:text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">
            Interactive IPO Comparison
          </h1>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-xl">
            Compare IPO pricing, lot size, GMP, subscription demand, and analyst reviews side-by-side.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 pt-6 space-y-6">

        {/* ===================== CONTENT ===================== */}
        {isLoading ? (
          <SkeletonTable rows={5} />
        ) : hasError ? (
          <ErrorCard onRetry={fetchData} />
        ) : ipos.length === 0 ? (
          <EmptyState
            title="No IPO comparison data available."
            description="No live IPO data is currently available. Please check back later."
          />
        ) : ipos.length < 2 ? (
          <EmptyState
            title="At least two IPOs are required for comparison."
            description="Only one IPO is currently available. More IPOs are needed to compare."
          />
        ) : (
          <div className="space-y-5">
            {/* ---- SELECTORS ---- */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                {/* Primary selector */}
                <div className="relative">
                  <IpoSelector
                    label="Select Primary IPO"
                    ipos={ipos}
                    selected={primaryIpo}
                    onChange={setPrimaryIpo}
                    excludeId={targetIpo?.id}
                  />
                </div>

                {/* Swap button */}
                <div className="flex items-end justify-center pb-1">
                  <button
                    type="button"
                    onClick={handleSwap}
                    title="Swap IPOs"
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 text-slate-500 transition-all duration-150"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Target selector */}
                <div className="relative">
                  <IpoSelector
                    label="Select Target IPO for Comparison"
                    ipos={ipos}
                    selected={targetIpo}
                    onChange={setTargetIpo}
                    excludeId={primaryIpo?.id}
                  />
                </div>
              </div>
            </div>

            {/* ---- COMPARISON TABLE ---- */}
            {(primaryIpo || targetIpo) && (
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">

                {/* Table header — company names */}
                <div className="grid grid-cols-[180px_1fr_1fr] border-b border-slate-200 bg-slate-50/80 sticky top-0 z-10">
                  <div className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
                    Metric
                  </div>
                  <div className="px-5 py-3.5 border-r border-slate-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Primary IPO</p>
                    <p className="font-bold text-[13px] text-blue-700 leading-tight truncate">
                      {primaryIpo?.companyName ?? '—'}
                    </p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Target IPO</p>
                    <p className="font-bold text-[13px] text-indigo-600 leading-tight truncate">
                      {targetIpo?.companyName ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Comparison rows — exactly 5, one per Live IPO Summary field */}
                <div className="divide-y divide-slate-100">
                  {COMPARISON_ROWS.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-[180px_1fr_1fr] hover:bg-slate-50/40 transition-colors duration-100"
                    >
                      {/* Metric label */}
                      <div className="px-5 py-5 border-r border-slate-100 flex flex-col justify-center">
                        <p className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">
                          {row.label}
                        </p>
                        {row.sublabel && (
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{row.sublabel}</p>
                        )}
                      </div>

                      {/* Primary IPO value */}
                      <div className="px-5 py-5 border-r border-slate-100 flex items-center">
                        <FieldCell ipo={primaryIpo} field={row.key} />
                      </div>

                      {/* Target IPO value */}
                      <div className="px-5 py-5 flex items-center">
                        <FieldCell ipo={targetIpo} field={row.key} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">
                    {ipos.length} IPO{ipos.length !== 1 ? 's' : ''} available
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Live IPO Summary Sheet</span>
                </div>
              </div>
            )}

            {/* ---- MOBILE STACKED VIEW ---- */}
            {(primaryIpo || targetIpo) && (
              <div className="md:hidden space-y-4">
                {[
                  { label: 'Primary IPO', ipo: primaryIpo,  accent: 'border-l-blue-400'   },
                  { label: 'Target IPO',  ipo: targetIpo,   accent: 'border-l-indigo-400' },
                ].map(({ label, ipo, accent }) => (
                  <div
                    key={label}
                    className={cn(
                      'bg-white border border-slate-200/60 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.03)] overflow-hidden',
                      'border-l-4', accent
                    )}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                      <p className="font-bold text-[14px] text-slate-800 leading-tight mt-0.5">
                        {ipo?.companyName ?? '—'}
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {COMPARISON_ROWS.filter(r => r.key !== 'ipo').map((row) => (
                        <div key={row.key} className="flex items-start gap-3 px-4 py-3.5">
                          <div className="w-28 shrink-0">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{row.label}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <FieldCell ipo={ipo} field={row.key} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
