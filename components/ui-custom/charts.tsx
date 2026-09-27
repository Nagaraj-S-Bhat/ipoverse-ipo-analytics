'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// ==========================================
// 1. GMP TREND LINE CHART (TradingView Inspired)
// ==========================================
interface GmpTrendChartProps {
  data: { date: string; gmp: number; listingPrice?: number }[];
  title?: string;
  className?: string;
}

export function GmpTrendChart({
  data,
  title = 'Grey Market Premium Trend',
  className,
}: GmpTrendChartProps) {
  const chartData = data.map((d) => ({
    name: d.date,
    GMP: d.gmp,
  }));

  return (
    <Card className={cn('bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden flex flex-col justify-between h-full p-5 text-left', className)}>
      <CardHeader className="pb-3 border-b border-slate-100 p-0 mb-3.5">
        <CardTitle className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A] tracking-tight font-sans leading-none">{title}</CardTitle>
        <CardDescription className="text-[14px] text-slate-500 font-sans mt-1">
          Live Grey Market Premium bidding timeline values
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <div className="h-[250px] w-full text-[13px] font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
              <defs>
                <linearGradient id="gmpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-60" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                dy={10}
                fontSize={13}
                className="font-medium"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                tickFormatter={(val) => `₹${val}`}
                dx={-5}
                fontSize={13}
                className="font-medium"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.03)',
                  padding: '10px 12px',
                }}
                itemStyle={{ color: '#2563EB' }}
                formatter={(val: any) => [`₹${val}`, 'GMP']}
                labelStyle={{ color: '#64748B', fontWeight: 'bold', marginBottom: '2px' }}
              />
              <Area
                type="monotone"
                dataKey="GMP"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#gmpGrad)"
                activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: '#2563EB' }}
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// 2. SUBSCRIPTION BAR CHART
// ==========================================
interface SubscriptionTrendChartProps {
  data: { category: string; value: number }[];
  title?: string;
  className?: string;
}

export function SubscriptionTrendChart({
  data,
  title = 'Subscription Demand Split',
  className,
}: SubscriptionTrendChartProps) {
  const chartData = data.map((d) => ({
    name: d.category,
    Subscription: d.value,
  }));

  return (
    <Card className={cn('bg-white border border-slate-200/50 rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.02)] overflow-hidden p-5 text-left', className)}>
      <CardHeader className="pb-3 border-b border-slate-100 p-0 mb-3.5">
        <CardTitle className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A] tracking-tight font-sans leading-none">{title}</CardTitle>
        <CardDescription className="text-[14px] text-slate-500 font-sans mt-1">
          Bidding progress split across category segments
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-2">
        <div className="h-[250px] w-full text-[13px] font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="opacity-60" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                dy={10}
                fontSize={13}
                className="font-medium"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#64748B"
                tickFormatter={(val) => `${val}x`}
                dx={-5}
                fontSize={13}
                className="font-medium"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  borderRadius: '12px',
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 4px 20px rgba(15,23,42,0.03)',
                  padding: '10px 12px',
                }}
                itemStyle={{ color: '#2563EB' }}
                formatter={(val: any) => [`${val}x`, 'Subscribed']}
                labelStyle={{ color: '#64748B', fontWeight: 'bold', marginBottom: '2px' }}
              />
              <Bar
                dataKey="Subscription"
                fill="url(#barGrad)"
                radius={[8, 8, 0, 0]}
                maxBarSize={45}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
