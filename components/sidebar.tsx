'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  title?: string;
  collapsed?: boolean;
}

export function Sidebar({ items, title = 'Navigation', collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  return (
    <div
      className={cn(
        'h-screen w-64 border-r border-sidebar-border bg-sidebar transition-all duration-300',
        isCollapsed && 'w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-4">
        <h1 className={cn('font-bold text-sidebar-foreground', isCollapsed && 'hidden')}>
          {title}
        </h1>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground"
          aria-label="사이드바 토글"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-1 px-2 py-4">
        {items.map((item) => {
          const isActive = pathname === item.href;
          if (item.disabled) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-60 cursor-not-allowed',
                  'text-sidebar-foreground',
                  isCollapsed && 'justify-center'
                )}
                title={`${item.label} (준비중)`}
              >
                {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="rounded-full bg-sidebar-primary/30 px-2 py-0.5 text-xs font-semibold text-sidebar-primary">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary/20 text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/30',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon && <div className="flex-shrink-0">{item.icon}</div>}
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-sidebar-primary/30 px-2 py-0.5 text-xs font-semibold text-sidebar-primary">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

interface HeaderProps {
  title?: string;
  rightContent?: React.ReactNode;
  className?: string;
}

export function Header({ title, rightContent, className }: HeaderProps) {
  return (
    <header className={cn('border-b border-border bg-card px-6 py-4', className)}>
      <div className="flex items-center justify-between">
        {title && <h1 className="text-2xl font-bold text-foreground">{title}</h1>}
        {rightContent && <div className="flex items-center gap-4">{rightContent}</div>}
      </div>
    </header>
  );
}

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export function SidebarLayout({ sidebar, header, children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const bottomNavItems = [
    { href: '/clients', label: '거래처' },
    { href: '/drivers', label: '기사' },
    { href: '/routes', label: '노선' },
    { href: '/dispatches', label: '배차' },
    { href: '/payroll', label: '급여' },
  ];

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden flex-shrink-0 lg:block">{sidebar}</div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-shrink-0">{header}</div>
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-card lg:hidden">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 items-center justify-center text-sm font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
