'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { dataService, initializeMockData } from '@/lib/data-service';
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/formatters';
import { OperationLog } from '@/lib/schemas';

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

export default function OperationsPage() {
  const router = useRouter();
  const [logs, setLogs] = React.useState<OperationLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    initializeMockData();
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    setLogs(dataService.getOperationLogs());
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  const completed = logs.filter(l => l.status === 'completed').length;
  const inProgress = logs.filter(l => l.status === 'in-progress').length;
  const pending = logs.filter(l => l.status === 'pending').length;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Operations"
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
        {/* Stats */}
        <Grid columns={4} gap="md" className="mb-8">
          <StatCard label="Total Operations" value={logs.length} icon="⚙️" />
          <StatCard label="Completed" value={completed} icon="✅" />
          <StatCard label="In Progress" value={inProgress} icon="🔄" />
          <StatCard label="Pending" value={pending} icon="⏱" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option>All Status</option>
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            + New Operation
          </button>
        </div>

        {/* Data Table */}
        <DataList<OperationLog>
          data={logs}
          isLoading={loading}
          columns={[
            {
              key: 'dispatchId',
              label: 'Dispatch',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'driverId',
              label: 'Driver',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'distance',
              label: 'Distance',
              render: (value) => <span className="text-sm">{value ? `${value} km` : '—'}</span>,
            },
            {
              key: 'fuelUsed',
              label: 'Fuel Used',
              render: (value) => <span className="text-sm">{value ? `${value} L` : '—'}</span>,
            },
            {
              key: 'actualEndTime',
              label: 'End Time',
              render: (value) => <span className="text-sm">{value ? formatDateTime(value) : '—'}</span>,
            },
            {
              key: 'status',
              label: 'Status',
              render: (value) => (
                <Badge variant={value === 'completed' ? 'success' : value === 'in-progress' ? 'warning' : 'secondary'}>
                  {getStatusLabel(value)}
                </Badge>
              ),
            },
          ]}
        />
      </PageContent>
    </SidebarLayout>
  );
}
