import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==========================================
// 1. CONFIRMATION DIALOG
// ==========================================
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6">
        <DialogHeader className="flex flex-row gap-3.5 items-start space-y-0 text-left">
          <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5 sm:space-x-0">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isLoading}
            className="h-9 rounded-xl text-xs font-semibold px-4 border-neutral-200 hover:bg-neutral-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-9 rounded-xl text-xs font-semibold px-4"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 2. ALERT DIALOG
// ==========================================
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  buttonLabel?: string;
  variant?: 'danger' | 'warning';
}

export function CustomAlertDialog({
  isOpen,
  onClose,
  title,
  description,
  buttonLabel = 'Dismiss',
  variant = 'warning',
}: AlertDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl border border-neutral-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 p-6">
        <DialogHeader className="flex flex-row gap-3.5 items-start space-y-0 text-left">
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
            isDanger 
              ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
          )}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-50">{title}</DialogTitle>
            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            onClick={onClose}
            className={cn(
              'h-9 w-full sm:w-auto rounded-xl text-xs font-semibold px-4',
              isDanger && 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700'
            )}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
