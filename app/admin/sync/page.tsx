'use client';

import * as React from 'react';
import { Database, RefreshCw, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui-custom/dialogs';

export default function AdminSyncPage() {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [syncTarget, setSyncTarget] = React.useState('ALL');
  const [isLoading, setIsLoading] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<any | null>(null);

  const handleSyncConfirm = async () => {
    setIsConfirmOpen(false);
    setIsLoading(true);
    setSyncResult(null);

    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: syncTarget }),
      });

      const data = await res.json();
      setSyncResult(data);
    } catch (err) {
      console.error('Sync request crashed:', err);
      setSyncResult({ success: false, error: 'Request pipeline failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const openSyncConfirm = (target: string) => {
    setSyncTarget(target);
    setIsConfirmOpen(true);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Sync Manager</h1>
        <p className="text-xs text-neutral-500 mt-1">Manual synchronization pipelines with Google service accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Actions panel */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-5">
            <CardHeader className="pb-3 px-1">
              <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-500" />
                Worksheet Sync Triggers
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Trigger transactional loads from private worksheets.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-1 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-zinc-950/40 rounded-2xl border border-neutral-200/60 dark:border-zinc-800/60 gap-4">
                <div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm block">Sync All Pipelines</span>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Executes all 6 sheets sequentially. Recommended daily action.</span>
                </div>
                <Button
                  onClick={() => openSyncConfirm('ALL')}
                  disabled={isLoading}
                  className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4.5 gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Master Sync
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Sync Live GMP', target: 'LIVE_GMP', desc: 'Syncs Grey market premiums.' },
                  { label: 'Sync Mainboard IPO', target: 'MAINBOARD', desc: 'Syncs corporate boards.' },
                  { label: 'Sync SME IPO', target: 'SME', desc: 'Syncs SME indicators.' },
                  { label: 'Sync IPO Summary', target: 'SUMMARY', desc: 'Updates overall metrics.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 border border-neutral-150 dark:border-zinc-850 rounded-2xl text-xs bg-white dark:bg-zinc-950/20">
                    <div>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 block">{item.label}</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">{item.desc}</span>
                    </div>
                    <Button
                      onClick={() => openSyncConfirm(item.target)}
                      disabled={isLoading}
                      variant="outline"
                      className="h-8 rounded-lg border-neutral-200 text-xs font-semibold px-3 cursor-pointer"
                    >
                      Trigger
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results / Status panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-5 h-full">
            <CardHeader className="pb-3 px-1">
              <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Sync Status Results</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-1 flex flex-col justify-center min-h-[160px] text-center border border-dashed border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 bg-[#F8FAFC]/50 dark:bg-zinc-950/20">
              {isLoading ? (
                <div className="space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium block">Executing sync streams...</span>
                </div>
              ) : syncResult ? (
                <div className="space-y-4 text-left">
                  <div className="flex gap-2 items-center">
                    {syncResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                      {syncResult.success ? 'Sync Completed' : 'Sync Failed'}
                    </span>
                  </div>
                  {syncResult.success && (
                    <div className="text-xs space-y-1.5 font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100/50 dark:bg-zinc-950 p-3 rounded-xl border border-neutral-200/50">
                      <div>Created: {syncResult.createdCount ?? 0} records</div>
                      <div>Updated: {syncResult.updatedCount ?? 0} records</div>
                      <div>Duration: {syncResult.durationMs ?? 0} ms</div>
                    </div>
                  )}
                  {!syncResult.success && (
                    <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-100">
                      {syncResult.error || 'Check environment variables.'}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <Database className="w-8 h-8 text-neutral-300 dark:text-zinc-700 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 block">Idle</span>
                  <span className="text-[10px] text-neutral-400">Run a pipeline trigger to pull data.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog overlay */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSyncConfirm}
        title="Trigger Data Sync"
        description={`Are you sure you want to trigger the synchronisation pipeline for target: "${syncTarget}"? This will modify records in the live Neon PostgreSQL database.`}
        confirmLabel="Execute Sync"
        isLoading={isLoading}
      />
    </div>
  );
}
