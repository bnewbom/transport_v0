'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

interface GridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, columns = 1, gap = 'md', className }: GridProps) {
  const colsMap = { 1: 'grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' };
  const gapMap = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' };
  
  return (
    <div className={cn('grid', colsMap[columns], gapMap[gap], className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('flex items-start justify-between rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <p className={cn('mt-2 text-xs font-medium', trend.isPositive ? 'text-success' : 'text-destructive')}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
      {icon && (
        <div className="ml-4 flex-shrink-0 text-primary opacity-50">
          {icon}
        </div>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center">
      {icon && <div className="mb-4 text-4xl opacity-30">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <div className="text-4xl text-destructive opacity-30">⚠️</div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {message && (
        <p className="mt-2 text-center text-sm text-muted-foreground">{message}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
