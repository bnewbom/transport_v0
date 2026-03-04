'use client';

import React from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EntityDrawerFormProps {
  isOpen: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void | Promise<void>;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function EntityDrawerForm({
  isOpen,
  title,
  onOpenChange,
  onSubmit,
  isLoading = false,
  children,
}: EntityDrawerFormProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">{children}</div>
        </ScrollArea>

        {/* Footer - Sticky Buttons */}
        <div className="border-t border-border bg-card px-6 py-4 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={submitting || isLoading}
          >
            {submitting || isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
