'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { dataService, initializeMockData } from '@/lib/data-service';
import { formatKRW, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/formatters';

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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = React.useState<any>(null);
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initialize data on mount
    initializeMockData();
    
    // Check auth
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }

    // Load data
    setStats(dataService.getDashboardStats());
    setActivities(dataService.getRecentActivities(5));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Dashboard"
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
        {/* KPI Stats */}
        <Grid columns={4} gap="md" className="mb-12">
          <StatCard
            label="Total Income"
            value={formatKRW(stats.totalIncome)}
            icon="💵"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            label="Total Expense"
            value={formatKRW(stats.totalExpense)}
            icon="💸"
            trend={{ value: -3.2, isPositive: false }}
          />
          <StatCard
            label="Active Dispatches"
            value={stats.activeDispatches}
            icon="📦"
          />
          <StatCard
            label="Completed Today"
            value={stats.completedToday}
            icon="✅"
          />
        </Grid>

        {/* Navigation Cards */}
        <div className="mb-12">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Access</h3>
          <Grid columns={4} gap="md" className="md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/clients"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">👥</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Clients</h4>
              <p className="mt-1 text-sm text-muted-foreground">Manage clients</p>
            </Link>
            <Link
              href="/drivers"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">🚗</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Drivers</h4>
              <p className="mt-1 text-sm text-muted-foreground">Manage drivers</p>
            </Link>
            <Link
              href="/routes"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">🗺</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Routes</h4>
              <p className="mt-1 text-sm text-muted-foreground">Manage routes</p>
            </Link>
            <Link
              href="/dispatches"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">📋</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">Dispatches</h4>
              <p className="mt-1 text-sm text-muted-foreground">Manage dispatches</p>
            </Link>
          </Grid>
        </div>

        {/* Recent Activities */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <Link href="#" className="text-sm font-medium text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.entityType}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {activity.type}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </SidebarLayout>
  );
}
