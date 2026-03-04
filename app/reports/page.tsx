'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent } from '@/components/layout-shell';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'Drivers', href: '/drivers', icon: '🚗' },
  { label: 'Routes', href: '/routes', icon: '🗺' },
  { label: 'Dispatches', href: '/dispatches', icon: '📋' },
  { label: 'Operations', href: '/operations', icon: '⚙️' },
  { label: 'Finance', href: '/finance', icon: '💰' },
  { label: 'Payroll', href: '/payroll', icon: '💳' },
  { label: 'Reports', href: '/reports', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function ReportsPage() {
  const router = useRouter();

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Reports"
          rightContent={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          }
        />
      }
    >
      <PageContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Monthly Revenue Report</h3>
              <p className="mt-2 text-sm text-muted-foreground">Track income by route and client</p>
              <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Generate Report
              </button>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Expense Analysis</h3>
              <p className="mt-2 text-sm text-muted-foreground">Breakdown of operating costs</p>
              <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Generate Report
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Driver Performance</h3>
              <p className="mt-2 text-sm text-muted-foreground">Efficiency and earnings metrics</p>
              <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Generate Report
              </button>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Route Profitability</h3>
              <p className="mt-2 text-sm text-muted-foreground">Revenue vs expenses per route</p>
              <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </PageContent>
    </SidebarLayout>
  );
}
