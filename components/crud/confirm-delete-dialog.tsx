'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { t } from '@/lib/i18n';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  displayValue: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onOpenChange,
  entityName,
  displayValue,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const [confirming, setConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dialog.deleteTitle')} ({entityName})</AlertDialogTitle>
          <AlertDialogDescription>
            <strong>{displayValue}</strong> 항목을 삭제하시겠습니까? {t('dialog.cannotUndo')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          대상: <span className="font-mono text-foreground">{displayValue}</span>
        </div>
        <div className="flex justify-end gap-3">
          <AlertDialogCancel disabled={confirming || isLoading}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirming || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirming || isLoading ? `${t('common.delete')}...` : t('common.delete')}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
