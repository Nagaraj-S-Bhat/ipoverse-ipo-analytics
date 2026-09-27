'use client';

import * as React from 'react';
import { History, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui-custom/data-table';
import { SearchBox } from '@/components/ui-custom/inputs';
import { Badge } from '@/components/ui/badge';

const mockLogs = [
  { id: '1', sheetName: 'Live IPO GMP', status: 'SUCCESS', recordsCreated: 0, recordsUpdated: 4, durationMs: 1420, errorMessage: null, startedAt: '2026-08-05 11:20:00' },
  { id: '2', sheetName: 'Mainboard IPO', status: 'SUCCESS', recordsCreated: 1, recordsUpdated: 2, durationMs: 1890, errorMessage: null, startedAt: '2026-08-05 11:20:02' },
  { id: '3', sheetName: 'SME IPO', status: 'SUCCESS', recordsCreated: 0, recordsUpdated: 1, durationMs: 980, errorMessage: null, startedAt: '2026-08-05 11:20:04' },
  { id: '4', sheetName: 'IPO Performance', status: 'SUCCESS', recordsCreated: 2, recordsUpdated: 0, durationMs: 2310, errorMessage: null, startedAt: '2026-08-05 11:20:05' },
  { id: '5', sheetName: 'IPO Summary', status: 'FAILED', recordsCreated: 0, recordsUpdated: 0, durationMs: 450, errorMessage: 'Row 4 cell is empty', startedAt: '2026-08-05 11:20:08' },
];

export default function AdminLogsPage() {
  const [searchVal, setSearchVal] = React.useState('');

  const columns: ColumnDef[] = [
    { key: 'sheetName', label: 'Worksheet Name', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const isSuccess = val === 'SUCCESS';
        return (
          <Badge variant="outline" className={isSuccess 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' 
            : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400'}>
            {val}
          </Badge>
        );
      }
    },
    { key: 'recordsCreated', label: 'Created', render: (val) => <span className="font-mono">{val}</span> },
    { key: 'recordsUpdated', label: 'Updated', render: (val) => <span className="font-mono">{val}</span> },
    { key: 'durationMs', label: 'Duration', render: (val) => <span className="font-mono">{val}ms</span> },
    { key: 'startedAt', label: 'Execution Time', sortable: true },
    { 
      key: 'errorMessage', 
      label: 'Error Message', 
      render: (val) => val ? <span className="text-red-500 dark:text-red-400 text-xs font-semibold">{val}</span> : <span className="text-neutral-400">-</span>
    },
  ];

  const filteredLogs = mockLogs.filter((log) =>
    log.sheetName.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Audit Logs
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Audit trail for worksheet loading operations.</p>
        </div>
        <div className="w-48 sm:w-64">
          <SearchBox
            placeholder="Search logs..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onClear={() => setSearchVal('')}
            className="h-9.5 text-xs pr-6"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredLogs} />
    </div>
  );
}
