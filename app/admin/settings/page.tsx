'use client';

import * as React from 'react';
import { Settings, ShieldCheck, Key, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminSettingsPage() {
  const [sheetId, setSheetId] = React.useState('1zX5c...342fd');
  const [serviceAccountEmail, setServiceAccountEmail] = React.useState('ipo-tracker-service@ipo-tracker-504614.iam.gserviceaccount.com');
  const [jwtExpiry, setJwtExpiry] = React.useState('24');
  const [isSaving, setIsSaving] = React.useState(false);
  const [alertMsg, setAlertMsg] = React.useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setAlertMsg('');

    setTimeout(() => {
      setIsSaving(false);
      setAlertMsg('System settings saved successfully.');
    }, 1200);
  };

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          System Settings
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Configure global synchronization IDs and private keys.</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave}>
          <Card className="border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl p-5">
            <CardHeader className="pb-4 px-1">
              <CardTitle className="text-sm font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Sheet Ingestion Settings
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Ensure these variables are synchronized with your active environment configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-1 space-y-4">
              {alertMsg && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/40 p-3.5 rounded-xl text-xs font-semibold text-center">
                  {alertMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 pl-0.5">Google Sheet Identifier</label>
                <Input
                  type="text"
                  value={sheetId}
                  onChange={(e) => setSheetId(e.target.value)}
                  className="h-10 rounded-xl border-neutral-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 pl-0.5">Google Service Account Client Email</label>
                <Input
                  type="email"
                  value={serviceAccountEmail}
                  onChange={(e) => setServiceAccountEmail(e.target.value)}
                  className="h-10 rounded-xl border-neutral-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 pl-0.5">JWT Expiration Threshold (Hours)</label>
                <Input
                  type="number"
                  value={jwtExpiry}
                  onChange={(e) => setJwtExpiry(e.target.value)}
                  className="h-10 rounded-xl border-neutral-200 dark:border-zinc-800 focus-visible:ring-indigo-500 text-sm font-mono"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="pt-4 px-1 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4.5 gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving Configurations...' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
