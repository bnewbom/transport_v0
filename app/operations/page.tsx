'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { dataService, initializeMockData } from '@/lib/data-service';
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/formatters';
import { OperationLog } from '@/lib/schemas';



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
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.operations')}
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
        {/* Stats */}
        <Grid columns={4} gap="md" className="mb-8">
          <StatCard label="총 운영 로그" value={logs.length} icon="⚙️" />
          <StatCard label="완료" value={completed} icon="✅" />
          <StatCard label="진행 중" value={inProgress} icon="🔄" />
          <StatCard label="대기" value={pending} icon="⏱" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <select className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              <option>전체 상태</option>
              <option>대기</option>
              <option>진행 중</option>
              <option>완료</option>
            </select>
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            + 운영 로그 추가
          </button>
        </div>

        {/* Data Table */}
        <DataList<OperationLog>
          data={logs}
          isLoading={loading}
          columns={[
            {
              key: 'dispatchId',
              label: '배차',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'driverId',
              label: '기사',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'distance',
              label: '거리',
              render: (value) => <span className="text-sm">{value ? `${value} km` : '—'}</span>,
            },
            {
              key: 'fuelUsed',
              label: '유류 사용량',
              render: (value) => <span className="text-sm">{value ? `${value} L` : '—'}</span>,
            },
            {
              key: 'actualEndTime',
              label: '종료 시각',
              render: (value) => <span className="text-sm">{value ? formatDateTime(value) : '—'}</span>,
            },
            {
              key: 'status',
              label: '상태',
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
