'use client';

import * as React from 'react';
import { Database, ShieldCheck, RefreshCw, Layers, ShieldAlert, ArrowRight } from 'lucide-react';
import { StatisticsCard } from '@/components/ui-custom/cards';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Admin Control Center</h1>
        <p className="text-xs text-neutral-500 mt-1">Manage database synchronization states and monitor logs.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatisticsCard title="Sync Status" value="Healthy" change="All pipelines active" isPositive={true} icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />} />
        <StatisticsCard title="Prisma Sync Runs" value="142 Runs" change="+8 runs today" isPositive={true} icon={<Database className="w-4 h-4 text-indigo-500" />} />
        <StatisticsCard title="Records Registered" value="48 Listings" change="Live sync in background" isPositive={true} icon={<Layers className="w-4 h-4 text-blue-500" />} />
        <StatisticsCard title="Pipeline Errors" value="0 Mismatches" change="Clean logs" isPositive={true} icon={<ShieldAlert className="w-4 h-4 text-neutral-400" />} />
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <RefreshCw className="w-4.5 h-4.5 text-indigo-500 animate-spin-slow" />
            Quick Sync Trigger
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Instantly run the synchronization service account to pull from the configured Google sheets, normalise names, and upsert records into PostgreSQL.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/sync"
              className={cn(
                buttonVariants({ variant: 'default' }),
                'h-9.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 px-4 shadow-sm shadow-indigo-600/10'
              )}
            >
              Launch Sync Console
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-indigo-500" />
            Ingestion Audits
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Inspect the step-by-step logs for individual worksheet sync operations. Includes duration metric charts, skipped items, and row modification tallies.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/logs"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'h-9.5 rounded-xl text-xs font-semibold px-4 border-neutral-200 dark:border-zinc-800 dark:hover:bg-zinc-900'
              )}
            >
              Browse Audit logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
