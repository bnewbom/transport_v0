'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { Badge } from '@/components/data-list';
import { dataService, initializeMockData } from '@/lib/data-service';
import { formatKRW, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/formatters';




const activityTypeLabel: Record<string, string> = {
  payment: '급여',
  financial: '재무',
  operation: '운영',
  dispatch: '배차',
};

const activityEntityLabel: Record<string, string> = {
  PayrollSlip: '급여 명세',
  FinancialRecord: '수입/지출 내역',
  OperationLog: '운영 로그',
  Dispatch: '배차',
};

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
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.dashboard')}
          rightContent={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </button>
          }
        />
      }
    >
      <PageContent>
        {/* KPI Stats */}
        <Grid columns={4} gap="md" className="mb-12">
          <StatCard
            label={t('pages.dashboard.totalIncome')}
            value={formatKRW(stats.totalIncome)}
            icon="💵"
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            label={t('pages.dashboard.totalExpense')}
            value={formatKRW(stats.totalExpense)}
            icon="💸"
            trend={{ value: -3.2, isPositive: false }}
          />
          <StatCard
            label={t('pages.dashboard.activeDispatches')}
            value={stats.activeDispatches}
            icon="📦"
          />
          <StatCard
            label={t('pages.dashboard.completedToday')}
            value={stats.completedToday}
            icon="✅"
          />
        </Grid>

        {/* Navigation Cards */}
        <div className="mb-12">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">빠른 메뉴</h3>
          <Grid columns={4} gap="md" className="md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/clients"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">👥</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">거래처</h4>
              <p className="mt-1 text-sm text-muted-foreground">거래처 관리</p>
            </Link>
            <Link
              href="/vehicles"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">🚌</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">차량</h4>
              <p className="mt-1 text-sm text-muted-foreground">차량 관리</p>
            </Link>
            <Link
              href="/drivers"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">🚗</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">기사</h4>
              <p className="mt-1 text-sm text-muted-foreground">기사 관리</p>
            </Link>
            <Link
              href="/routes"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">🗺</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">노선</h4>
              <p className="mt-1 text-sm text-muted-foreground">노선 관리</p>
            </Link>
            <Link
              href="/dispatches"
              className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
            >
              <div className="mb-3 text-4xl">📋</div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">배차</h4>
              <p className="mt-1 text-sm text-muted-foreground">배차 관리</p>
            </Link>
          </Grid>
        </div>

        {/* Recent Activities */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">최근 활동</h2>
            <Link href="#" className="text-sm font-medium text-primary hover:underline">
              전체 보기
            </Link>
          </div>

          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start justify-between border-b border-border pb-3 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activityEntityLabel[activity.entityType] ?? activity.entityType}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">
                    {activityTypeLabel[activity.type] ?? activity.type}
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
