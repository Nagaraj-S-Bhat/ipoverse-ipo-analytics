import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  // Pagination Config
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function DataTable({
  columns,
  data,
  sortKey,
  sortDirection,
  onSort,
  page,
  totalPages,
  onPageChange,
  className,
}: DataTableProps) {
  const handleSortClick = (col: ColumnDef) => {
    if (!col.sortable || !onSort) return;
    const isCurrent = sortKey === col.key;
    const newDirection = isCurrent && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(col.key, newDirection);
  };

  const showPagination = page !== undefined && totalPages !== undefined && totalPages > 1;

  return (
    <div className={cn('space-y-4 w-full', className)}>
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/60 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-neutral-50/50 dark:bg-zinc-900/30 border-b border-neutral-200 dark:border-zinc-800">
            <TableRow>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const isCenter = col.align === 'center';
                const isRight = col.align === 'right';

                return (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-3.5 h-11 transition-colors select-none',
                      col.sortable && 'cursor-pointer hover:bg-neutral-100/50 dark:hover:bg-zinc-900/40 hover:text-neutral-800 dark:hover:text-neutral-200',
                      isCenter && 'text-center',
                      isRight && 'text-right'
                    )}
                    onClick={() => handleSortClick(col)}
                  >
                    <div className={cn(
                      'flex items-center gap-1.5 w-full',
                      isCenter && 'justify-center',
                      isRight && 'justify-end'
                    )}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-neutral-400 dark:text-neutral-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-neutral-400 dark:text-neutral-500 text-sm font-sans">
                  No records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIdx) => (
                <TableRow
                  key={row.id || rowIdx}
                  className="border-b border-neutral-150 dark:border-zinc-900 last:border-0 hover:bg-neutral-50/40 dark:hover:bg-zinc-900/20 transition-colors"
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const isCenter = col.align === 'center';
                    const isRight = col.align === 'right';

                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          'py-3.5 text-sm font-sans text-neutral-700 dark:text-neutral-300 font-medium',
                          isCenter && 'text-center',
                          isRight && 'text-right'
                        )}
                      >
                        {col.render ? col.render(value, row) : String(value ?? '-')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {showPagination && onPageChange && (
        <div className="flex items-center justify-between px-2 pt-1.5">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
            Page {page} of {totalPages}
          </span>
          <Pagination className="w-auto mx-0">
            <PaginationContent className="gap-1.5">
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page! - 1)}
                  disabled={page === 1}
                  className="h-8 rounded-lg text-xs"
                >
                  Previous
                </Button>
              </PaginationItem>
              
              {/* Simple current pages list */}
              {Array.from({ length: totalPages! }, (_, i) => i + 1)
                .filter(p => Math.abs(p - page!) <= 1 || p === 1 || p === totalPages)
                .map((p, idx, arr) => {
                  const isCurrent = p === page;
                  const prevVal = arr[idx - 1];
                  const showEllipsis = prevVal !== undefined && p - prevVal > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && (
                        <span className="text-neutral-400 dark:text-neutral-500 text-xs px-1">...</span>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => onPageChange(p)}
                          isActive={isCurrent}
                          className={cn(
                            'h-8 w-8 cursor-pointer rounded-lg text-xs font-semibold flex items-center justify-center border transition-all',
                            isCurrent
                              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-50 dark:text-zinc-950 dark:border-neutral-50'
                              : 'bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900'
                          )}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}

              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page! + 1)}
                  disabled={page === totalPages}
                  className="h-8 rounded-lg text-xs"
                >
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
