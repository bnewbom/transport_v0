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
import { formatDate, formatKRW, getStatusLabel } from '@/lib/formatters';
import { useAppToast } from '@/components/crud/toast';

const getWeekdayBit = (date: string) => 1 << new Date(date).getDay();

export default function DispatchesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [serviceDate, setServiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = React.useState<Dispatch[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);

  const load = React.useCallback(() => {
    setRows(repositories.dispatches.getAll());
    setRuns(repositories.runs.getAll());
  }, []);

  React.useEffect(() => {
    if (!localStorage.getItem('auth')) router.push('/login');
    load();
  }, [router, load]);

  const isMonthLocked = (date: string) => repositories.payroll.getAll().some((p) => p.settlementMonth === date.slice(0, 7) && p.status === 'confirmed');

  const autoGenerate = () => {
    const activeRoutes = repositories.routes.getAll().filter((r) => r.status === 'active' && (r.weekdayMask & getWeekdayBit(serviceDate)) !== 0);
    for (const route of activeRoutes) {
      const driver = repositories.drivers.getAll().find((d) => d.status === 'active' && d.defaultRouteId === route.id);
      const dispatch = repositories.dispatches.create({
        routeId: route.id,
        plannedDriverId: driver?.id ?? null,
        driverId: driver?.id,
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
    toast.success('자동 배차 생성', `${activeRoutes.length}건 생성되었습니다.`);
  };

  const updateDispatch = (dispatch: Dispatch, updates: Partial<Dispatch>) => {
    if (dispatch.status === 'closed') return toast.error('수정 불가', 'closed 상태의 배차는 수정할 수 없습니다.');
    const before = { ...dispatch };
    const updated = repositories.dispatches.update(dispatch.id, updates);
    if (updated) {
      recordChangeLog({ entityType: 'dispatch', entityId: dispatch.id, action: 'update', before, after: updated });
      load();
    }
  };

  const createRun = (dispatch: Dispatch) => {
    if (!dispatch.serviceDate) return;
    if (isMonthLocked(dispatch.serviceDate)) return toast.error('잠금 월', '확정된 정산월은 run 수정/생성이 불가합니다.');
    const route = repositories.routes.getById(dispatch.routeId);
    const run = repositories.runs.create({
      dispatchId: dispatch.id,
      routeId: dispatch.routeId,
      driverId: dispatch.plannedDriverId ?? null,
      serviceDate: dispatch.serviceDate,
      allowanceAmount: route?.baseAllowanceAmount ?? route?.baseRate ?? 0,
      status: 'completed',
    });
    recordChangeLog({ entityType: 'run', entityId: run.id, action: 'create', after: run });
    load();
  };

  const changeRun = (run: Run, updates: Partial<Run>) => {
    if (isMonthLocked(run.serviceDate)) return toast.error('잠금 월', '정산 확정된 월입니다. draft로 되돌린 후 수정하세요.');
    const before = { ...run };
    const updated = repositories.runs.update(run.id, updates);
    if (updated) {
      recordChangeLog({ entityType: 'run', entityId: run.id, action: 'update', before, after: updated });
      load();
    }
  };

  const drivers = repositories.drivers.getAll().filter((d) => d.status === 'active');
  const dayRows = rows.filter((d) => (d.serviceDate ?? d.scheduledDate) === serviceDate);

  return <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.dispatches')} />}>
    <PageContent>
      <Grid columns={3} className="mb-4">
        <StatCard label="당일 배차" value={dayRows.length} />
        <StatCard label="published" value={dayRows.filter((d) => d.status === 'published').length} />
        <StatCard label="당일 run" value={runs.filter((r) => r.serviceDate === serviceDate).length} />
      </Grid>
      <div className="mb-4 flex gap-2">
        <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="rounded border px-3 py-2" />
        <Button onClick={autoGenerate}>자동 생성</Button>
      </div>

      <DataList data={dayRows} columns={[
        { key: 'routeId', label: '노선', render: (v) => repositories.routes.getById(String(v))?.name ?? v },
        { key: 'plannedDriverId', label: '계획 기사', render: (_, d) => <select value={d.plannedDriverId ?? ''} onChange={(e) => updateDispatch(d, { plannedDriverId: e.target.value || null })} className="rounded border px-2 py-1"><option value="">미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
        { key: 'status', label: '상태', render: (v, d) => <div className='flex items-center gap-2'><Badge>{getStatusLabel(String(v))}</Badge><select value={d.status} onChange={(e) => updateDispatch(d, { status: e.target.value as Dispatch['status'] })} className="rounded border px-2 py-1"><option value='draft'>draft</option><option value='published'>published</option><option value='closed'>closed</option><option value='canceled'>canceled</option></select></div> },
      ]} actions={(d) => <Button size="sm" onClick={() => createRun(d)}>Run 생성(확정)</Button>} />

      <h3 className="mt-6 mb-2 font-semibold">Run</h3>
      <DataList data={runs.filter((r) => r.serviceDate === serviceDate)} columns={[
        { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
        { key: 'driverId', label: '귀속 기사', render: (_, r) => <select value={r.driverId ?? ''} onChange={(e) => changeRun(r, { driverId: e.target.value || null })} className="rounded border px-2 py-1"><option value=''>미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
        { key: 'status', label: '상태', render: (_, r) => <select value={r.status} onChange={(e) => changeRun(r, { status: e.target.value as Run['status'] })} className="rounded border px-2 py-1"><option value='completed'>completed</option><option value='absence'>absence</option><option value='holiday'>holiday</option><option value='canceled'>canceled</option></select> },
        { key: 'allowanceAmount', label: '수당', render: (v) => formatKRW(Number(v)) },
      ]} />
    </PageContent>
  </SidebarLayout>;
}
