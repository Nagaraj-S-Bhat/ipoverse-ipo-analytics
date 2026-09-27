'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Calendar,
  Zap,
  Search,
  X,
  RefreshCcw,
  Layers3,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SkeletonTable, EmptyState } from '@/components/ui-custom/states';
import { formatDateOnly } from '@/utils/dateUtils';

// ==========================================
// DATA SOURCE: GET /api/summary
// Backend: ipoRepo.findLiveSummary()
// Sheet: "Live IPO Summary"
//
// Columns: IPO | Price · Lot | GMP | Subscription | Review
//
// All dashboard KPIs and IPO rows are derived
// from this single API. No other APIs are used.
// No charts, sparklines, or historical data.
// No hardcoded IPO values.
// ==========================================
interface DashboardIpo {
  id: string;
  // IPO column
  companyName: string;
  type: string;
  status: string;
  openDate: string | null;
  closeDate: string | null;
  issueSizeCr: number | null;
  // Price · Lot column
  priceMin: number | null;
  priceMax: number | null;
  lotSize: number | null;
  minimumInvestment: number | null;
  // GMP column
  gmp: number | null;
  expectedListingGain: number | null;
  // Subscription column
  totalSubscription: number | null;
  qibSub: number | null;
  niiSub: number | null;
  retailSub: number | null;
  // Review column
  reviewSummary: string | null;
}

function mapIpo(raw: any): DashboardIpo {
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
    qibSub,
    niiSub,
    retailSub,
    reviewSummary: raw.reviewSummary ?? null,
  };
}

// ==========================================
// FORMATTING HELPERS
// ==========================================
function fmtDate(d: string | null): string {
  return formatDateOnly(d, { day: 'numeric', month: 'short' });
}

function fmtPrice(min: number | null, max: number | null): string {
  if (min == null && max == null) return '—';
  if (min != null && max != null && min !== max) return `₹${min}–₹${max}`;
  return `₹${max ?? min}`;
}

function fmtMoney(n: number | null): string {
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

function reviewSentiment(r: string | null): 'positive' | 'negative' | 'neutral' {
  if (!r) return 'neutral';
  const l = r.toLowerCase();
  if (l.includes('strong') || l.includes('apply') || l.includes('buy')) return 'positive';
  if (l.includes('avoid') || l.includes('risky') || l.includes('skip')) return 'negative';
  return 'neutral';
}

// ==========================================
// SMALL BADGES
// ==========================================
function TypeBadge({ type }: { type: string }) {
  const isSme = type?.toUpperCase() === 'SME';
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
      isSme ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
    )}>
      {type || '—'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const styles =
    s === 'OPEN'     ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
    s === 'UPCOMING' ? 'bg-blue-50 text-blue-700 border-blue-100'         :
    s === 'CLOSED'   ? 'bg-amber-50 text-amber-700 border-amber-100'       :
                       'bg-slate-50 text-slate-500 border-slate-100';
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', styles)}>
      {status || '—'}
    </span>
  );
}

function ReviewBadge({ text }: { text: string | null }) {
  if (!text) return <span className="text-[12px] text-slate-400">—</span>;
  const s = reviewSentiment(text);
  const styles =
    s === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    s === 'negative' ? 'bg-red-50 text-red-600 border-red-200'             :
                       'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border', styles)}>
      {text}
    </span>
  );
}

// ==========================================
// KPI CARD
// Values are calculated from loaded API data
// ==========================================
function KpiCard({
  title, value, description, icon, accent,
}: {
  title: string;
  value: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.07)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{title}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', accent)}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[26px] font-bold text-slate-900 font-mono leading-none tracking-tight">{value}</p>
        <p className="text-[12px] text-slate-400 mt-1.5">{description}</p>
      </div>
    </div>
  );
}

// ==========================================
// IPO OVERVIEW ROW (desktop table)
// ==========================================
function OverviewRow({ ipo }: { ipo: DashboardIpo }) {
  const estListing = ipo.priceMax != null && ipo.gmp != null ? ipo.priceMax + ipo.gmp : null;
  return (
    <tr className="group hover:bg-slate-50/50 transition-colors duration-100">
      {/* IPO */}
      <td className="px-5 py-4">
        <p className="font-semibold text-[13px] text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
          {ipo.companyName}
        </p>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          <TypeBadge type={ipo.type} />
          <StatusBadge status={ipo.status} />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {fmtDate(ipo.openDate)} – {fmtDate(ipo.closeDate)}
          {ipo.issueSizeCr != null && ` · ₹${ipo.issueSizeCr} Cr.`}
        </p>
      </td>
      {/* Price · Lot */}
      <td className="px-4 py-4">
        <p className="font-mono font-semibold text-[13px] text-slate-700">
          {fmtPrice(ipo.priceMin, ipo.priceMax)}
        </p>
        {ipo.lotSize != null && <p className="text-[11px] text-slate-400 mt-0.5">Lot {ipo.lotSize} shares</p>}
        {ipo.minimumInvestment != null && <p className="text-[11px] text-slate-400">Min {fmtMoney(ipo.minimumInvestment)}</p>}
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
                {ipo.expectedListingGain > 0 ? '+' : ''}{ipo.expectedListingGain === 0 ? '0%' : `${ipo.expectedListingGain.toFixed(2)}%`}
              </p>
            )}
            {estListing != null && <p className="text-[11px] text-slate-400 mt-0.5">Est. {fmtMoney(estListing)}</p>}
          </>
        ) : <span className="text-[12px] text-slate-400">—</span>}
      </td>
      {/* Subscription */}
      <td className="px-4 py-4">
        {ipo.totalSubscription != null ? (
          <>
            <p className="font-bold text-[14px] text-slate-800">{ipo.totalSubscription.toFixed(2)}x</p>
            <div className="flex gap-2 mt-0.5 flex-wrap">
              {ipo.qibSub != null && <span className="text-[10px] text-slate-400">QIB <span className="font-semibold text-slate-600">{ipo.qibSub.toFixed(1)}x</span></span>}
              {ipo.niiSub != null && <span className="text-[10px] text-slate-400">HNI <span className="font-semibold text-slate-600">{ipo.niiSub.toFixed(1)}x</span></span>}
              {ipo.retailSub != null && <span className="text-[10px] text-slate-400">Ret <span className="font-semibold text-slate-600">{ipo.retailSub.toFixed(1)}x</span></span>}
            </div>
          </>
        ) : <span className="text-[12px] text-slate-400">—</span>}
      </td>
      {/* Review */}
      <td className="px-4 py-4 pr-5">
        <ReviewBadge text={ipo.reviewSummary} />
      </td>
    </tr>
  );
}

// ==========================================
// IPO MOBILE CARD
// ==========================================
function OverviewCard({ ipo }: { ipo: DashboardIpo }) {
  const estListing = ipo.priceMax != null && ipo.gmp != null ? ipo.priceMax + ipo.gmp : null;
  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-[14px] text-slate-800 leading-tight">{ipo.companyName}</p>
          <div className="flex gap-1 mt-1 flex-wrap">
            <TypeBadge type={ipo.type} />
            <StatusBadge status={ipo.status} />
          </div>
        </div>
        {ipo.gmp != null && (
          <div className="text-right shrink-0">
            <p className={cn('font-mono font-bold text-[13px]', gmpColor(ipo.gmp))}>
              {ipo.gmp > 0 ? '+' : ''}₹{ipo.gmp}
            </p>
            {ipo.expectedListingGain != null && (
              <p className={cn('text-[11px] font-semibold', gainColor(ipo.expectedListingGain))}>
                {ipo.expectedListingGain > 0 ? '+' : ''}{ipo.expectedListingGain === 0 ? '0%' : `${ipo.expectedListingGain.toFixed(2)}%`}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-slate-100 text-[11px]">
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Price</span>
          <p className="font-mono font-semibold text-slate-700 mt-0.5">{fmtPrice(ipo.priceMin, ipo.priceMax)}</p>
          {ipo.lotSize != null && <p className="text-slate-400">Lot {ipo.lotSize} shr</p>}
        </div>
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Subscription</span>
          <p className="font-bold text-slate-800 mt-0.5">
            {ipo.totalSubscription != null ? `${ipo.totalSubscription.toFixed(2)}x` : '—'}
          </p>
        </div>
        {estListing != null && (
          <div>
            <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Est. Listing</span>
            <p className="font-mono font-semibold text-slate-700 mt-0.5">{fmtMoney(estListing)}</p>
          </div>
        )}
        <div>
          <span className="text-slate-400 font-bold uppercase tracking-wide text-[10px]">Review</span>
          <div className="mt-0.5"><ReviewBadge text={ipo.reviewSummary} /></div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// FAQ ITEM
// ==========================================
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="border-b border-slate-200 py-4 last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="text-[14px] font-semibold text-slate-800 hover:text-blue-600 transition-colors pr-4">{question}</span>
        <ChevronRight className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-90')} />
      </button>
      {isOpen && (
        <p className="text-[13px] text-slate-500 mt-2.5 leading-relaxed pr-6">
          {answer}
        </p>
      )}
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================
type BoardFilter = 'ALL' | 'MAINBOARD' | 'SME';
type StatusFilter = 'ALL' | 'OPEN' | 'UPCOMING';

export default function Home() {
  // ── Data State ─────────────────────────────────────────────────────────────
  const [ipos,      setIpos]      = React.useState<DashboardIpo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError,  setHasError]  = React.useState(false);

  // ── Controls ───────────────────────────────────────────────────────────────
  const [search,        setSearch]        = React.useState('');
  const [boardFilter,   setBoardFilter]   = React.useState<BoardFilter>('ALL');
  const [statusFilter,  setStatusFilter]  = React.useState<StatusFilter>('ALL');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch('/api/summary');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setIpos((json.data || []).map(mapIpo));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  // ── KPI values — calculated purely from loaded data ────────────────────────
  const kpis = React.useMemo(() => {
    const openCount = ipos.filter((i) => i.status?.toUpperCase() === 'OPEN').length;
    const upcomingCount = ipos.filter((i) => i.status?.toUpperCase() === 'UPCOMING').length;

    const withGmp = ipos.filter((i) => i.gmp != null);
    const avgGmp = withGmp.length > 0
      ? Math.round(withGmp.reduce((acc, i) => acc + i.gmp!, 0) / withGmp.length)
      : null;
    const highGmp = withGmp.length > 0 ? Math.max(...withGmp.map((i) => i.gmp!)) : null;
    const withSub = ipos.filter((i) => i.totalSubscription != null);
    const avgSub = withSub.length > 0
      ? (withSub.reduce((acc, i) => acc + i.totalSubscription!, 0) / withSub.length).toFixed(2)
      : null;

    return { openCount, upcomingCount, avgGmp, highGmp, avgSub };
  }, [ipos]);

  // ── Filter + search ────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    return ipos.filter((ipo) => {
      const matchSearch = !search || ipo.companyName.toLowerCase().includes(search.toLowerCase());
      const matchBoard  = boardFilter === 'ALL' || ipo.type?.toUpperCase() === boardFilter;
      const matchStatus = statusFilter === 'ALL' || ipo.status?.toUpperCase() === statusFilter;
      return matchSearch && matchBoard && matchStatus;
    });
  }, [ipos, search, boardFilter, statusFilter]);

  const hasOpen     = ipos.some((i) => i.status?.toUpperCase() === 'OPEN');
  const hasUpcoming = ipos.some((i) => i.status?.toUpperCase() === 'UPCOMING');
  const hasMainboard = ipos.some((i) => i.type?.toUpperCase() === 'MAINBOARD');
  const hasSme       = ipos.some((i) => i.type?.toUpperCase() === 'SME');

  return (
    <div className="pb-20 bg-[#F8FAFC] -mx-6 md:-mx-8 -my-6 md:-my-8 font-sans">
      <div className="px-6 md:px-8 pt-6 md:pt-8 space-y-12">

        {/* ===================== 1. HERO SECTION ===================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(15,23,42,0.04)] relative overflow-hidden text-left">
          {/* Subtle dot grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.10] pointer-events-none" />

          {/* Left: copy */}
          <div className="lg:col-span-6 space-y-6 z-10">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 uppercase tracking-widest text-[10px] font-bold px-3 py-1 rounded-full w-fit select-none">
              India's Most Trusted IPO Tracker
            </Badge>

            <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-extrabold tracking-[-0.025em] text-[#0F172A] leading-[1.08]">
              Track.<br />Analyze.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#3B82F6]">Invest Smarter.</span>
            </h1>

            <p className="text-[15px] text-slate-500 leading-relaxed max-w-md">
              Monitor Grey Market Premiums (GMP), evaluate subscription trends, and verify listing returns with our verified SaaS-grade analytics suite.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Link
                href="/gmp"
                className="h-12 rounded-[14px] text-[14px] font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center px-7 shadow-[0_4px_16px_rgba(37,99,235,0.20)] transition-all hover:scale-[1.01] duration-200"
              >
                Explore Live GMP
                <ArrowRight className="w-4 h-4 ml-2 stroke-[2.5]" />
              </Link>
              <Link
                href="/mainboard"
                className="h-12 rounded-[14px] text-[14px] font-bold bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center px-7 shadow-sm transition-all hover:scale-[1.01] duration-200"
              >
                View Upcoming IPOs
              </Link>
            </div>
          </div>

          {/* Right: clean analytics mock — no hardcoded IPO names or values */}
          <div className="lg:col-span-6 relative w-full aspect-[4/3] rounded-2xl bg-[#FAFBFC] border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.03)] p-5 flex flex-col select-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.20]" />
            {/* Window chrome */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">IPOVerse Dashboard</span>
              </div>
              <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold text-emerald-600 uppercase tracking-wide">Live</span>
            </div>
            {/* Mock column headers */}
            <div className="relative z-10 grid grid-cols-4 gap-2 mb-2">
              {['IPO', 'Price · Lot', 'GMP', 'Subscription'].map((col) => (
                <div key={col} className="text-[8px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/70 px-2 py-1 rounded-md text-center">
                  {col}
                </div>
              ))}
            </div>
            {/* Mock rows — abstract, no real company names or values */}
            {[
              { w1: 'w-20', w2: 'w-12', gmp: 'text-emerald-600', w3: 'w-10', w4: 'w-14' },
              { w1: 'w-16', w2: 'w-14', gmp: 'text-emerald-600', w3: 'w-8',  w4: 'w-12' },
              { w1: 'w-24', w2: 'w-10', gmp: 'text-red-500',     w3: 'w-10', w4: 'w-10' },
              { w1: 'w-18', w2: 'w-12', gmp: 'text-emerald-600', w3: 'w-12', w4: 'w-16' },
            ].map((row, i) => (
              <div key={i} className="relative z-10 grid grid-cols-4 gap-2 mb-1.5">
                <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-slate-100 shrink-0" />
                  <div className={cn('h-2 bg-slate-200 rounded', row.w1)} />
                </div>
                <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 flex items-center justify-center">
                  <div className={cn('h-2 bg-slate-200 rounded font-mono', row.w2)} />
                </div>
                <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 flex items-center justify-center">
                  <div className={cn('h-2 rounded', row.gmp === 'text-emerald-600' ? 'bg-emerald-200' : 'bg-red-200', row.w3)} />
                </div>
                <div className="bg-white border border-slate-100 rounded-lg px-2 py-1.5 flex items-center justify-center">
                  <div className={cn('h-2 bg-blue-100 rounded', row.w4)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== 2. TODAY'S IPO MARKET — KPI CARDS =====================
            All values derived from /api/summary (Live IPO Summary).
            Never hardcoded. Never calculated with unavailable fields.
        ===================================================================== */}
        <section className="space-y-5 text-left">
          <div>
            <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">Today's IPO Market</h2>
            <p className="text-[13px] text-slate-500 mt-1">Key metrics from the Live IPO Summary sheet</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : hasError ? (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl">
              <RefreshCcw className="w-4 h-4 text-red-400" />
              <span className="text-[13px] text-red-600 font-medium">Unable to load IPO data.</span>
              <button onClick={fetchData} className="ml-auto text-[12px] font-bold text-red-600 hover:underline">Retry</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Open IPOs"
                value={kpis.openCount}
                description="Currently open for bidding"
                icon={<Activity className="w-4 h-4" />}
                accent="bg-emerald-50 text-emerald-600"
              />
              <KpiCard
                title="Upcoming IPOs"
                value={kpis.upcomingCount}
                description="Scheduled to open soon"
                icon={<Calendar className="w-4 h-4" />}
                accent="bg-blue-50 text-blue-600"
              />
              <KpiCard
                title="Average GMP"
                value={kpis.avgGmp != null ? `₹${kpis.avgGmp}` : '—'}
                description="Avg. grey market premium"
                icon={<TrendingUp className="w-4 h-4" />}
                accent="bg-violet-50 text-violet-600"
              />
              <KpiCard
                title="Highest GMP"
                value={kpis.highGmp != null ? `₹${kpis.highGmp}` : '—'}
                description="Peak grey market demand"
                icon={<Zap className="w-4 h-4" />}
                accent="bg-amber-50 text-amber-600"
              />
            </div>
          )}
        </section>

        {/* ===================== 3. LIVE IPO OVERVIEW =====================
            Data source: /api/summary (Live IPO Summary)
            Columns: IPO | Price · Lot | GMP | Subscription | Review
            No GMP Trend charts. No historical data. No fake values.
        ===================================================================== */}
        <section className="space-y-5 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
            <div>
              <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">Live IPO Overview</h2>
              <p className="text-[13px] text-slate-500 mt-1">
                {!isLoading && !hasError && `${filtered.length} of ${ipos.length} IPOs shown`}
              </p>
            </div>

            {/* Controls */}
            {!isLoading && !hasError && ipos.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {/* Board filter */}
                {(hasMainboard || hasSme) && (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    <Filter className="w-3 h-3 text-slate-400 ml-1 mr-0.5 shrink-0" />
                    {([
                      { key: 'ALL', label: 'All' },
                      ...(hasMainboard ? [{ key: 'MAINBOARD', label: 'Mainboard' }] : []),
                      ...(hasSme       ? [{ key: 'SME',       label: 'SME'       }] : []),
                    ] as { key: BoardFilter; label: string }[]).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setBoardFilter(t.key)}
                        className={cn(
                          'px-3 py-1 text-[12px] font-semibold rounded-lg transition-all duration-150',
                          boardFilter === t.key
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Status filter */}
                {(hasOpen || hasUpcoming) && (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    {([
                      { key: 'ALL',      label: 'All Status' },
                      ...(hasOpen     ? [{ key: 'OPEN',     label: 'Open'     }] : []),
                      ...(hasUpcoming ? [{ key: 'UPCOMING', label: 'Upcoming' }] : []),
                    ] as { key: StatusFilter; label: string }[]).map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setStatusFilter(t.key)}
                        className={cn(
                          'px-3 py-1 text-[12px] font-semibold rounded-lg transition-all duration-150',
                          statusFilter === t.key
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search IPO..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-[12px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-300 transition-all w-40"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <RefreshCcw className="w-8 h-8 text-red-300" />
              <p className="text-[14px] font-semibold text-slate-700">Unable to load IPO data.</p>
              <Button onClick={fetchData} variant="outline" className="h-9 rounded-xl text-xs px-5 gap-2">
                <RefreshCcw className="w-3.5 h-3.5" />Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={ipos.length === 0 ? 'No Live IPO data available.' : 'No IPOs match your current filters.'}
              description={ipos.length === 0 ? 'IPO data will appear here once the Live IPO Summary sheet is synced.' : 'Try adjusting your filters or search term.'}
              onReset={search || boardFilter !== 'ALL' || statusFilter !== 'ALL' ? () => { setSearch(''); setBoardFilter('ALL'); setStatusFilter('ALL'); } : undefined}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/95 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">IPO</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price · Lot</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">GMP</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subscription</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-5">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((ipo, idx) => <OverviewRow key={ipo.id || idx} ipo={ipo} />)}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">{filtered.length} of {ipos.length} IPOs</span>
                  <span className="text-[11px] text-slate-400 font-mono">Live IPO Summary Sheet</span>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((ipo, idx) => <OverviewCard key={ipo.id || idx} ipo={ipo} />)}
                <p className="text-center text-[11px] text-slate-400 pt-1">
                  {filtered.length} IPO{filtered.length !== 1 ? 's' : ''} · Live IPO Summary Sheet
                </p>
              </div>
            </>
          )}
        </section>

        {/* ===================== 4. FAQ SECTION ===================== */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(15,23,42,0.04)] text-left">
          <div className="mb-5">
            <h2 className="text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">Frequently Asked Questions</h2>
            <p className="text-[13px] text-slate-500 mt-1">Need help understanding IPO terms or GMP computations?</p>
          </div>
          <div>
            <FaqItem
              question="What is Grey Market Premium (GMP)?"
              answer="Grey Market Premium (GMP) is the premium price at which IPO shares are traded in an unofficial, unregulated market before they get officially listed on stock exchanges (NSE/BSE). It indicates the retail market demand and potential listing gain sentiment."
            />
            <FaqItem
              question="Are Grey Market trades legally binding?"
              answer="No, Grey Market transactions are unofficial and operate outside the purview of the Securities and Exchange Board of India (SEBI). It is purely a trust-based OTC market and carries significant counterparty risk."
            />
            <FaqItem
              question="How is the Estimated Listing Price calculated?"
              answer="The Estimated Listing Price is calculated by adding the current Grey Market Premium (GMP) to the IPO cut-off / upper issue price (Est. Listing = Issue Price + GMP). It is a market estimate and does not guarantee the actual opening trading price."
            />
            <FaqItem
              question="What is the difference between Mainboard and SME IPOs?"
              answer="Mainboard IPOs are offerings from larger corporations with a minimum capital raising scale, listing on primary boards (NSE/BSE), and target general public retail investors (lot size is small). SME IPOs are from small-and-medium enterprises, listing on specific SME boards, and target accredited HNI/institutional investors with high minimum investment lots (typically ₹1 Lakh+)."
            />
          </div>
        </section>

      </div>
    </div>
  );
}
