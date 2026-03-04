'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories, recordChangeLog } from '@/lib/repository';
import { Dispatch, Run } from '@/lib/schemas';
import { formatDate, formatKRW } from '@/lib/formatters';
import { useAppToast } from '@/components/crud/toast';
import { dayToBit, getDispatchStatusLabel, getRunStatusLabel } from '@/lib/labels';
import { ensureSeedData } from '@/lib/seed';

export default function DispatchesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [serviceDate, setServiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'draft' | 'published' | 'closed' | 'canceled'>('all');
  const [rows, setRows] = React.useState<Dispatch[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);

  const load = React.useCallback(() => {
    setRows(repositories.dispatches.getAll());
    setRuns(repositories.runs.getAll());
  }, []);

  React.useEffect(() => {
    if (!localStorage.getItem('auth')) router.push('/login');
    ensureSeedData();
    load();
  }, [router, load]);

  const isMonthLocked = (date: string) => repositories.payroll.getAll().some((p) => p.settlementMonth === date.slice(0, 7) && p.status === 'confirmed');

  const autoGenerate = () => {
    const bit = dayToBit(new Date(serviceDate).getDay());
    let targets = repositories.routes.getAll().filter((r) => r.status === 'active' && (r.weekdayMask & bit) !== 0);
    if (targets.length === 0) targets = repositories.routes.getAll().filter((r) => r.status === 'active').slice(0, 1);

    for (const route of targets) {
      const driver = repositories.drivers.getAll().find((d) => d.status === 'active' && d.defaultRouteId === route.id);
      const dispatch = repositories.dispatches.create({
        routeId: route.id,
        plannedDriverId: driver?.id ?? null,
        driverId: driver?.id,
        clientId: repositories.clients.getAll()[0]?.id,
        serviceDate,
        scheduledDate: serviceDate,
        scheduledTime: route.shiftType === 'night' ? '20:00' : '08:00',
        shiftSlot: route.shiftType === 'night' ? 'pm' : 'am',
        status: 'draft',
        createdAt: new Date().toISOString(),
      });
      recordChangeLog({ entityType: 'dispatch', entityId: dispatch.id, action: 'create', after: dispatch });
    }
    load();
    toast.success('자동 배차 생성', `${targets.length}건 생성되었습니다.`);
  };

  const updateDispatch = (dispatch: Dispatch, updates: Partial<Dispatch>) => {
    if (dispatch.status === 'closed') return toast.error('수정 불가', '마감 상태의 배차는 수정할 수 없습니다.');
    const before = { ...dispatch };
    const updated = repositories.dispatches.update(dispatch.id, updates);
    if (updated) {
      recordChangeLog({ entityType: 'dispatch', entityId: dispatch.id, action: 'update', before, after: updated });
      load();
    }
  };

  const createRun = (dispatch: Dispatch) => {
    if (!dispatch.serviceDate) return;
    if (isMonthLocked(String(dispatch.serviceDate))) return toast.error('잠금 월', '확정된 정산월은 운행 생성/수정이 불가합니다.');
    const route = repositories.routes.getById(dispatch.routeId);
    const run = repositories.runs.create({
      dispatchId: dispatch.id,
      routeId: dispatch.routeId,
      driverId: dispatch.plannedDriverId ?? null,
      serviceDate: dispatch.serviceDate,
      allowanceAmount: route?.baseAllowanceAmount ?? route?.baseRate ?? 0,
      status: 'completed',
      confirmedAt: new Date().toISOString(),
      confirmedBy: '관리자',
    });
    recordChangeLog({ entityType: 'run', entityId: run.id, action: 'create', after: run });
    load();
  };

  const changeRun = (run: Run, updates: Partial<Run>) => {
    if (isMonthLocked(String(run.serviceDate))) return toast.error('잠금 월', '정산 확정된 월입니다. 임시저장으로 되돌린 후 수정하세요.');
    const before = { ...run };
    const updated = repositories.runs.update(run.id, updates);
    if (updated) {
      recordChangeLog({ entityType: 'run', entityId: run.id, action: 'update', before, after: updated });
      load();
    }
  };

  const drivers = repositories.drivers.getAll().filter((d) => d.status === 'active');
  const filteredDispatches = rows.filter((d) => {
    const date = String(d.serviceDate ?? d.scheduledDate).slice(0, 10);
    const routeName = repositories.routes.getById(d.routeId)?.name ?? '';
    const driverName = repositories.drivers.getById(d.plannedDriverId ?? '')?.name ?? '';
    const byDate = date === serviceDate;
    const byStatus = statusFilter === 'all' || d.status === statusFilter;
    const q = search.toLowerCase();
    const bySearch = routeName.toLowerCase().includes(q) || driverName.toLowerCase().includes(q);
    return byDate && byStatus && bySearch;
  });

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.dispatches')} />}>
      <PageContent>
        <Grid columns={4} className="mb-4">
          <StatCard label="당일 배차" value={filteredDispatches.length} />
          <StatCard label="게시" value={filteredDispatches.filter((d) => d.status === 'published').length} />
          <StatCard label="마감" value={filteredDispatches.filter((d) => d.status === 'closed').length} />
          <StatCard label="당일 운행" value={runs.filter((r) => String(r.serviceDate).slice(0, 10) === serviceDate).length} />
        </Grid>

        <div className="mb-4 flex gap-2">
          <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명/계획 기사 검색" className="rounded-lg border border-input px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-input px-3 py-2 text-sm">
            <option value="all">전체 상태</option>
            <option value="draft">임시저장</option>
            <option value="published">게시</option>
            <option value="closed">마감</option>
            <option value="canceled">취소</option>
          </select>
          <Button onClick={autoGenerate}>자동 생성</Button>
        </div>

        <DataList
          data={filteredDispatches}
          columns={[
            { key: 'routeId', label: '노선', render: (v) => repositories.routes.getById(String(v))?.name ?? '-' },
            { key: 'plannedDriverId', label: '계획 기사', render: (_, d) => <select value={d.plannedDriverId ?? ''} onChange={(e) => updateDispatch(d, { plannedDriverId: e.target.value || null })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="">미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
            { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
            { key: 'status', label: '상태', render: (v, d) => <div className="flex items-center gap-2"><Badge>{getDispatchStatusLabel(v)}</Badge><select value={d.status} onChange={(e) => updateDispatch(d, { status: e.target.value as Dispatch['status'] })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="draft">임시저장</option><option value="published">게시</option><option value="closed">마감</option><option value="canceled">취소</option></select></div> },
          ]}
          actions={(d) => <Button size="sm" onClick={() => createRun(d)}>운행 생성(확정)</Button>}
        />

        <h3 className="mb-2 mt-6 font-semibold">운행 목록</h3>
        <DataList
          data={runs.filter((r) => String(r.serviceDate).slice(0, 10) === serviceDate)}
          columns={[
            { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
            { key: 'driverId', label: '귀속 기사', render: (_, r) => <select value={r.driverId ?? ''} onChange={(e) => changeRun(r, { driverId: e.target.value || null })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="">미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
            { key: 'status', label: '상태', render: (_, r) => <select value={r.status} onChange={(e) => changeRun(r, { status: e.target.value as Run['status'] })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="completed">완료</option><option value="absence">결근</option><option value="holiday">휴무</option><option value="canceled">취소</option></select> },
            { key: 'allowanceAmount', label: '수당', render: (v) => formatKRW(Number(v)) },
            { key: 'confirmedAt', label: '확정', render: (_, r) => <Badge>{r.confirmedAt ? '확정됨' : getRunStatusLabel(r.status)}</Badge> },
          ]}
        />
      </PageContent>
    </SidebarLayout>
  );
}
