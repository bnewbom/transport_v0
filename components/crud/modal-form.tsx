'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

interface ModalFormProps {
  isOpen: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
  children: React.ReactNode;
  submitLabel?: string;
}

export function ModalForm({
  isOpen,
  title,
  onOpenChange,
  onSubmit,
  isLoading = false,
  children,
  submitLabel = t('common.save'),
}: ModalFormProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !submitting) {
      onOpenChange(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 cursor-pointer"
        onClick={() => !submitting && onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg rounded-lg bg-background shadow-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-border px-6 py-4 bg-background">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-5">{children}</div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-border bg-background px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || isLoading}
          >
            {submitting || isLoading ? `${t('common.save')}...` : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
