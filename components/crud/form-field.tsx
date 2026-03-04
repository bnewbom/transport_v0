'use client';

import React from 'react';
import { t } from '@/lib/i18n';

interface FormFieldProps {
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  help,
  required = false,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">* ({t('common.required')})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {help && !error && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
