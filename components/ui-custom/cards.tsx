import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IpoTypeBadge, ListingBadge, ExchangeBadge } from './badges';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowUpRight, ArrowDownRight, Building2 } from 'lucide-react';

// ==========================================
// 1. STATS CARD (Redesigned with gradients, sparklines, spacing)
// ==========================================
interface StatisticsCardProps {
  title: string;
  value: React.ReactNode;
  change?: string;
  isPositive?: boolean;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatisticsCard({
  title,
  value,
  change,
  isPositive = true,
  description,
  icon,
  className,
}: StatisticsCardProps) {
  const strokeColor = isPositive ? '#10B981' : '#EF4444';
  const path = isPositive
    ? 'M0 16 Q 15 2, 30 12 T 60 4'
    : 'M0 4 Q 15 18, 30 8 T 60 16';

  return (
    <Card
      className={cn(
        'bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 overflow-hidden relative group p-5 text-left',
        className
      )}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2.5 flex-1">
          <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.5px] block font-sans">
            {title}
          </span>
          <div className="text-[30px] lg:text-[36px] font-bold text-[#0F172A] leading-none font-sans tracking-tight">
            {value}
          </div>
          <p className="text-[14px] font-normal text-slate-500 font-sans mt-1.5">
            {change || description}
          </p>
        </div>

        <div className="flex flex-col items-end justify-between h-full min-h-[72px] space-y-3.5">
          {/* Gradient Icon Badge container */}
          <div
            className={cn(
              'w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100/55',
              isPositive
                ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600'
                : 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600'
            )}
          >
            {icon}
          </div>

          {/* Mini Sparkline indicator */}
          <svg className="w-15 h-7 select-none" viewBox="0 0 60 20" fill="none">
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 2. IPO CARD (Master Card)
// ==========================================
interface IpoCardProps {
  companyName: string;
  type: string;
  status: string;
  priceMin: number;
  priceMax: number;
  lotSize: number;
  issueSizeCr: number;
  openDate: Date;
  closeDate: Date;
  companyLogo?: string | null;
  gmpValue?: number;
  gainPercent?: number;
  onViewDetails?: () => void;
  className?: string;
}

export function IpoCard({
  companyName,
  type,
  status,
  priceMin,
  priceMax,
  lotSize,
  issueSizeCr,
  openDate,
  closeDate,
  companyLogo,
  gmpValue,
  gainPercent,
  onViewDetails,
  className,
}: IpoCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };

  const isPriceFixed = priceMin === priceMax;
  const priceDisplay = isPriceFixed ? `₹${priceMin}` : `₹${priceMin} - ₹${priceMax}`;
  const minCapital = priceMax * lotSize;

  return (
    <Card
      className={cn(
        'bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 flex flex-col justify-between h-full p-5 text-left',
        className
      )}
    >
      <div className="space-y-3.5">
        {/* Header Block: Logo & Name */}
        <div className="flex items-center gap-2.5">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="w-9 h-9 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 border border-slate-100 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-[18px] lg:text-[20px] font-bold leading-tight text-[#0F172A] line-clamp-1 font-sans tracking-tight">
              {companyName}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5 scale-90 origin-left">
              <IpoTypeBadge type={type} />
              <ListingBadge status={status} />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-100 w-full" />

        {/* Highlight Section: GMP & Expected Gain */}
        <div className="grid grid-cols-1 gap-3 bg-slate-50/70 border border-slate-100 rounded-xl p-3.5">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Current GMP
            </span>
            <span className="text-[30px] lg:text-[36px] font-bold text-emerald-600 font-sans block leading-none">
              {gmpValue !== undefined && gmpValue > 0 ? `+₹${gmpValue}` : '₹0'}
            </span>
          </div>
          <div className="border-t border-slate-100/70 pt-2 flex justify-between items-center">
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] font-sans">
              Expected Return
            </span>
            <span className="text-[20px] lg:text-[22px] font-bold text-blue-600 font-sans leading-none">
              {gainPercent !== undefined && gainPercent > 0 ? `+${gainPercent.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>

        {/* Secondary Parameters List */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-[13px]">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Price Band
            </span>
            <span className="font-semibold text-slate-700">{priceDisplay}</span>
          </div>
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Issue Size
            </span>
            <span className="font-semibold text-slate-700">₹{issueSizeCr} Cr.</span>
          </div>
        </div>

        {/* Open Date segment */}
        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1 font-sans">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Opens {formatDate(openDate)}
          </span>
          <span className="text-[10px] text-slate-400 font-bold font-sans tracking-[0.5px]">Open Date</span>
        </div>
      </div>

      {/* Action CTA Footer */}
      <div className="mt-3.5 pt-1">
        <Button
          onClick={onViewDetails}
          variant="outline"
          className="w-full justify-between h-9.5 rounded-xl border-slate-200 text-xs font-bold hover:bg-[#2563EB]/5 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all hover:scale-[1.01] shadow-sm font-sans"
        >
          View Details
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Button>
      </div>
    </Card>
  );
}

// ==========================================
// 3. GMP CARD (Redesigned Trending GMP Card)
// ==========================================
interface GmpCardProps {
  companyName: string;
  issuePrice: number;
  gmpValue: number;
  gainPercent: number;
  status: string;
  priceMin?: number;
  priceMax?: number;
  issueSizeCr?: number;
  openDate?: Date;
  companyLogo?: string | null;
  onViewDetails?: () => void;
  className?: string;
}

export function GmpCard({
  companyName,
  issuePrice,
  gmpValue,
  gainPercent,
  status,
  priceMin,
  priceMax,
  issueSizeCr,
  openDate,
  companyLogo,
  onViewDetails,
  className,
}: GmpCardProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  };

  const isPriceFixed = priceMin === priceMax;
  const priceDisplay =
    priceMin && priceMax
      ? isPriceFixed
        ? `₹${priceMin}`
        : `₹${priceMin} - ₹${priceMax}`
      : `₹${issuePrice}`;

  return (
    <Card
      className={cn(
        'bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 flex flex-col justify-between h-full p-5 text-left',
        className
      )}
    >
      <div className="space-y-3.5">
        {/* Header: Logo, Name, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="w-9 h-9 rounded-xl object-contain bg-slate-50 border border-slate-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 border border-slate-100 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="text-[18px] lg:text-[20px] font-bold text-[#0F172A] line-clamp-1 leading-snug font-sans tracking-tight">
                {companyName}
              </h4>
              <span className="text-[12px] font-semibold text-slate-400 block tracking-[0.5px] uppercase font-sans mt-0.5">
                Trending GMP Target
              </span>
            </div>
          </div>
          <ListingBadge status={status} className="scale-90 select-none" />
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-100 w-full" />

        {/* Content Parameters Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[13px]">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Price Band
            </span>
            <span className="font-semibold text-slate-700 font-sans">{priceDisplay}</span>
          </div>
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Current GMP
            </span>
            <span className="font-bold text-emerald-600 font-sans inline-flex items-center gap-0.5">
              +₹{gmpValue}
            </span>
          </div>
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Exp. Listing Gain
            </span>
            <span className="font-bold text-blue-600 font-sans">
              {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">
              Issue Size
            </span>
            <span className="font-semibold text-slate-700 font-sans">
              ₹{issueSizeCr || '--'} Cr
            </span>
          </div>
        </div>

        {/* Dates segment */}
        {openDate && (
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1 font-sans">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Opens {formatDate(openDate)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold font-sans tracking-[0.5px]">Open Date</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 pt-1">
        <Button
          onClick={onViewDetails}
          variant="outline"
          className="w-full justify-between h-9.5 rounded-xl border-slate-200 text-xs font-bold hover:bg-[#2563EB]/5 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all hover:scale-[1.01] shadow-sm font-sans"
        >
          View Details
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </Button>
      </div>
    </Card>
  );
}

// ==========================================
// 4. PERFORMANCE CARD
// ==========================================
interface PerformanceCardProps {
  companyName: string;
  issuePrice: number;
  listingPrice: number;
  listingGainPercent: number;
  currentPrice: number;
  currentGainPercent: number;
  exchange: string;
  className?: string;
}

export function PerformanceCard({
  companyName,
  issuePrice,
  listingPrice,
  listingGainPercent,
  currentPrice,
  currentGainPercent,
  exchange,
  className,
}: PerformanceCardProps) {
  const isPosListing = listingGainPercent >= 0;
  const isPosCurrent = currentGainPercent >= 0;

  return (
    <Card
      className={cn(
        'bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 flex flex-col justify-between h-full p-5 text-left',
        className
      )}
    >
      <div>
        <div className="pb-3 flex items-center justify-between">
          <CardTitle className="text-[18px] lg:text-[20px] font-bold text-[#0F172A] line-clamp-1 font-sans tracking-tight">
            {companyName}
          </CardTitle>
          <ExchangeBadge exchange={exchange} className="scale-90 select-none" />
        </div>

        <div className="h-px bg-slate-100 w-full mb-3" />

        <div className="grid grid-cols-2 gap-4 border-b border-slate-100/70 pb-3 text-left">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">Listing Price</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-slate-700 font-sans text-[13px]">₹{listingPrice}</span>
              <span
                className={cn(
                  'text-[10px] font-bold font-sans inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 border',
                  isPosListing
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                )}
              >
                {isPosListing ? '+' : ''}
                {listingGainPercent}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">Issue Price</span>
            <span className="font-semibold text-slate-650 font-sans block pt-0.5 text-[13px]">₹{issuePrice}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-left pt-3">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">Current Price</span>
            <span className="font-bold text-slate-800 font-sans text-[14px] block mt-0.5">₹{currentPrice}</span>
          </div>
          <div className="text-right">
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5 font-sans">Total Return</span>
            <span
              className={cn(
                'font-bold font-sans text-[14px] inline-flex items-center gap-0.5 mt-0.5',
                isPosCurrent ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {isPosCurrent ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {isPosCurrent ? '+' : ''}
              {currentGainPercent}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ==========================================
// 5. SUMMARY / SUBSCRIPTION CARD
// ==========================================
interface SummaryCardProps {
  companyName: string;
  totalSub: number;
  retailSub: number;
  qibSub: number;
  niiSub: number;
  closeDate: Date;
  className?: string;
}

export function SummaryCard({
  companyName,
  totalSub,
  retailSub,
  qibSub,
  niiSub,
  closeDate,
  className,
}: SummaryCardProps) {
  const isClosingToday = new Date().toDateString() === closeDate.toDateString();

  return (
    <Card
      className={cn(
        'bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] transition-all duration-300 hover:scale-[1.01]',
        className
      )}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0 p-5">
        <div className="text-left">
          <CardTitle className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A] font-sans">{companyName}</CardTitle>
          <span className="text-[12px] text-slate-400 block mt-0.5 font-sans font-medium">Subscription metrics</span>
        </div>
        {isClosingToday && (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 border border-red-100 rounded-full font-sans">
            CLOSING TODAY
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4 px-5 pb-5">
        <div className="flex justify-between items-end border-b border-slate-100 pb-3 text-left">
          <div>
            <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-[0.5px] block mb-0.5">Overall Subscribed</span>
            <span className="text-[20px] lg:text-[24px] font-bold tracking-tight text-slate-800 font-sans">{totalSub}x</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-[0.5px] mb-0.5">Retail</span>
            <span className="font-semibold text-slate-700 font-sans text-[13px]">{retailSub}x</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-[0.5px] mb-0.5">QIB</span>
            <span className="font-semibold text-slate-700 font-sans text-[13px]">{qibSub}x</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50 text-center">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-[0.5px] mb-0.5">NII (HNI)</span>
            <span className="font-semibold text-slate-700 font-sans text-[13px]">{niiSub}x</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 6. INFORMATION CARD
// ==========================================
interface InformationCardProps {
  title: string;
  items: { label: string; value: string | React.ReactNode; isMono?: boolean }[];
  className?: string;
}

export function InformationCard({ title, items, className }: InformationCardProps) {
  return (
    <Card className={cn('bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]', className)}>
      <CardHeader className="pb-3 border-b border-slate-100 p-5">
        <CardTitle className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A] font-sans text-left">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 px-5 pb-5 text-[13px] space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center py-0.5">
            <span className="text-slate-500 font-semibold font-sans">{item.label}</span>
            <span
              className={cn(
                'text-slate-800 text-right',
                item.isMono ? 'font-sans font-medium' : 'font-sans font-medium'
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
