'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

interface DataListColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataListProps<T extends { id: string }> {
  data: T[];
  columns: DataListColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  actionsLabel?: string;
  className?: string;
}

export function DataList<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = t('common.noData'),
  onRowClick,
  actions,
  actionsLabel = t('common.actions'),
  className,
}: DataListProps<T>) {
  const [isCompact, setIsCompact] = React.useState(false);

  // Detect mobile (for responsive behavior)
  React.useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card py-12">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Desktop Table View
  if (!isCompact) {
    return (
      <div className={cn('overflow-x-auto rounded-lg border border-border', className)}>
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn('px-4 py-3 text-left text-sm font-semibold text-foreground', col.className)}
                >
                  {col.label}
                  {col.sortable && <span className="ml-1 text-xs opacity-50">↕</span>}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">{actionsLabel}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn('bg-card hover:bg-muted/30', onRowClick && 'cursor-pointer transition-colors')}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-sm text-foreground', col.className)}>
                    {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3 text-sm">
                    <div onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mobile Card View
  return (
    <div className={cn('space-y-3', className)}>
      {data.map((item) => (
        <div
          key={item.id}
          onClick={() => onRowClick?.(item)}
          className={cn(
            'rounded-lg border border-border bg-card p-4',
            onRowClick && 'cursor-pointer transition-colors hover:bg-muted/30'
          )}
        >
          <div className="space-y-2">
            {columns.map((col) => (
              <div key={String(col.key)} className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">{col.label}</span>
                <span className="text-sm font-medium text-foreground">
                  {col.render ? col.render(item[col.key], item) : String(item[col.key])}
                </span>
              </div>
            ))}
            {actions && (
              <div className="pt-1">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">{actionsLabel}</span>
                <div onClick={(e) => e.stopPropagation()}>{actions(item)}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    secondary: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

interface TabsProps {
  tabs: { label: string; value: string; content: React.ReactNode }[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultValue, onValueChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <div className={className}>
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find((tab) => tab.value === activeTab)?.content}
      </div>
    </div>
  );
}
