'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Database,
  Users,
  Compass,
  Award,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  return (
    <div className="pb-20 font-sans bg-[#F8FAFC] text-slate-800 -mx-6 md:-mx-8 -my-6 md:-my-8 min-h-screen">

      {/* ── Inner content wrapper ── */}
      <div className="px-6 md:px-8 pt-6 md:pt-8 space-y-14">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-widest select-none">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-600">About Us</span>
        </div>

        {/* ==========================================
            1. HERO SECTION
           ========================================== */}
        <section className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
          {/* Left copy */}
          <div className="max-w-xl space-y-5 text-left">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-200 uppercase tracking-widest text-[10px] font-bold px-3 py-1 rounded-full select-none"
            >
              About the Brand
            </Badge>

            <h1 className="text-[38px] sm:text-[46px] font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              About{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                IPOVerse
              </span>
            </h1>

            <p className="text-[15px] text-slate-500 leading-relaxed">
              Empowering investors with reliable IPO insights, real-time GMP data,
              and performance analytics — all in one place.
            </p>

            <div className="w-10 h-[3px] bg-blue-600 rounded-full" />
          </div>

          {/* Right illustration card */}
          <div className="relative w-full max-w-[400px] shrink-0 select-none bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(15,23,42,0.05)] p-6 flex items-center justify-center hover:shadow-[0_8px_32px_rgba(15,23,42,0.08)] transition-shadow duration-300 aspect-[4/3]">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {/* Grid lines */}
              <line x1="40" y1="220" x2="360" y2="220" stroke="#F1F5F9" strokeWidth="2" />
              <line x1="40" y1="160" x2="360" y2="160" stroke="#F1F5F9" strokeWidth="2" />
              <line x1="40" y1="100" x2="360" y2="100" stroke="#F1F5F9" strokeWidth="2" />
              {/* Bars */}
              <rect x="230" y="190" width="12" height="30" rx="3" fill="#3B82F6" opacity="0.5" />
              <rect x="250" y="160" width="12" height="60" rx="3" fill="#3B82F6" opacity="0.65" />
              <rect x="270" y="130" width="12" height="90" rx="3" fill="#3B82F6" opacity="0.78" />
              <rect x="290" y="90"  width="12" height="130" rx="3" fill="#3B82F6" opacity="0.9" />
              <rect x="310" y="60"  width="12" height="160" rx="3" fill="#2563EB" />
              {/* Growth curve */}
              <path
                d="M 230 190 C 270 150, 290 80, 320 65"
                fill="none"
                stroke="#2563EB"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Arrow */}
              <path d="M 310 65 L 322 64 L 320 76" fill="none" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Pie chart */}
              <circle cx="100" cy="140" r="45" fill="#F8FAFC" />
              <path d="M 100 140 L 140 120 A 45 45 0 0 0 95 95 Z" fill="#3B82F6" />
              <path d="M 100 140 L 95 95 A 45 45 0 0 0 60 160 Z" fill="#60A5FA" />
            </svg>

            {/* Floating metric panel */}
            <div className="absolute right-5 top-5 bg-white border border-slate-200 p-3.5 rounded-xl shadow-md w-44 text-[11px] space-y-2 font-sans">
              <span className="font-bold text-slate-400 block border-b border-slate-100 pb-1.5 uppercase tracking-wider text-[9px]">
                IPO Market Insights
              </span>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">GMP</span>
                <span className="font-bold text-emerald-600 font-mono">+42.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subscription</span>
                <span className="font-bold text-emerald-600 font-mono">86.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Listings</span>
                <span className="font-bold text-emerald-600 font-mono">+28.4%</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            2. CORE MISSION & VISION
           ========================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: <Compass className="w-5 h-5" />,
              iconBg: 'bg-blue-50',
              iconColor: 'text-blue-600',
              title: 'Our Mission',
              text: 'To democratize access to primary capital markets by providing structured, verified, and transparent metrics on upcoming public offerings in India, allowing retail investors to make informed listing decisions.',
            },
            {
              icon: <Award className="w-5 h-5" />,
              iconBg: 'bg-indigo-50',
              iconColor: 'text-indigo-600',
              title: 'Our Vision',
              text: "To become India's leading directory for IPO statistics and secondary performance analytics, bridging the information gap between corporate underwriters and the retail investor community.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-7 space-y-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.07)] hover:border-slate-300 transition-all duration-200 text-left"
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', item.iconBg, item.iconColor)}>
                {item.icon}
              </div>
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">{item.title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        {/* ==========================================
            3. WHY IPOVERSE
           ========================================== */}
        <section className="space-y-7">
          <div className="text-left space-y-1.5">
            <h2 className="text-[24px] font-bold tracking-tight text-slate-900">Why IPOVerse?</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed max-w-lg">
              Our platform is built around verified metrics, extensive market visibility, and investor-first philosophy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: 'Verified & Reliable',
                desc: 'We collect data from verified market sources to ensure accuracy and reliability.',
                icon: <Shield className="w-5 h-5 text-blue-600" />,
                iconBg: 'bg-blue-50',
              },
              {
                title: 'Real-time Updates',
                desc: 'Our platform provides real-time GMP, subscription, and listing updates as they happen.',
                icon: <Zap className="w-5 h-5 text-emerald-600" />,
                iconBg: 'bg-emerald-50',
              },
              {
                title: 'Comprehensive Coverage',
                desc: 'From Mainboard to SME IPOs, get complete coverage across all market segments.',
                icon: <Globe className="w-5 h-5 text-purple-600" />,
                iconBg: 'bg-purple-50',
              },
              {
                title: 'Performance Insights',
                desc: 'Track historical performance and analyze listing gains to make informed investment decisions.',
                icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
                iconBg: 'bg-amber-50',
              },
              {
                title: 'Transparent Data',
                desc: 'We believe in transparency. All data is presented clearly with proper disclaimers.',
                icon: <Database className="w-5 h-5 text-cyan-600" />,
                iconBg: 'bg-cyan-50',
              },
              {
                title: 'Investor First',
                desc: 'Our mission is to empower investors with the right information at the right time.',
                icon: <Users className="w-5 h-5 text-pink-600" />,
                iconBg: 'bg-pink-50',
              },
            ].map((val, idx) => (
              <Card
                key={idx}
                className="border border-slate-200 bg-white rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.07)] hover:border-slate-300 transition-all duration-200 text-left"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', val.iconBg)}>
                    {val.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{val.title}</h4>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{val.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ==========================================
            4. HOW DATA IS COLLECTED
           ========================================== */}
        <section className="space-y-7">
          <div className="text-left space-y-1.5">
            <h2 className="text-[24px] font-bold tracking-tight text-slate-900">How Data is Collected</h2>
            <p className="text-[14px] text-slate-500 leading-relaxed max-w-lg">
              Our pipeline maintains data hygiene through a 4-step ingestion and validation network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { step: '01', title: 'Worksheet Fetch',     desc: 'Secure APIs sync raw rows from the 6 Google spreadsheets.' },
              { step: '02', title: 'Name Normalization',  desc: 'Custom text match rules normalize corporate listing titles.' },
              { step: '03', title: 'Transaction Upsert',  desc: 'Upserts records in transaction blocks to avoid duplications.' },
              { step: '04', title: 'Public Rendering',    desc: 'Presents verified prices, lot sizes, and subscriptions.' },
            ].map((node, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_20px_rgba(15,23,42,0.07)] hover:border-slate-300 transition-all duration-200 relative text-left overflow-hidden"
              >
                {/* Ghost step number */}
                <span className="text-[40px] font-extrabold text-slate-100/80 absolute top-3 right-4 select-none leading-none font-mono">
                  {node.step}
                </span>
                {/* Step number pill */}
                <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Step {node.step}
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">{node.title}</h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{node.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ==========================================
            5. PLATFORM STATISTICS BAR
           ========================================== */}
        <section className="bg-white border border-slate-200 rounded-2xl px-6 py-7 sm:px-8 sm:py-8 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-6 divide-y-0 lg:divide-x divide-slate-100">
            {[
              { value: '1,250+',    label: 'IPOs Tracked',       desc: 'Across Mainboard & SME',       iconBg: 'bg-blue-50',    iconColor: 'text-blue-600'    },
              { value: '98.7%',     label: 'Data Accuracy',      desc: 'Verified from multiple sources', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
              { value: 'Real-time', label: 'Live Updates',        desc: 'As fast as the market moves',   iconBg: 'bg-violet-50',  iconColor: 'text-violet-600'  },
              { value: '50K+',      label: 'Investors Served',   desc: 'Growing investor community',    iconBg: 'bg-orange-50',  iconColor: 'text-orange-600'  },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-start gap-4 text-left',
                  idx > 0 && 'lg:pl-6'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', stat.iconBg, stat.iconColor)}>
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[22px] font-bold tracking-tight text-slate-900 font-mono block leading-tight">
                    {stat.value}
                  </span>
                  <span className="text-[13px] font-semibold text-slate-700 block">{stat.label}</span>
                  <span className="text-[11px] text-slate-400 block">{stat.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>{/* /content wrapper */}
    </div>
  );
}
