'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { Button } from '@/components/ui/button';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories, recordChangeLog } from '@/lib/repository';
import { Dispatch, Run } from '@/lib/schemas';
import { formatDate, formatKRW } from '@/lib/formatters';
import { useAppToast } from '@/components/crud/toast';
import { dayToBit, getRunStatusLabel } from '@/lib/labels';
import { ensureSeedData } from '@/lib/seed';

export default function DispatchesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [serviceDate, setServiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'draft' | 'published' | 'closed' | 'canceled'>('all');
  const [rows, setRows] = React.useState<Dispatch[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualRouteId, setManualRouteId] = React.useState('');
  const [manualDriverId, setManualDriverId] = React.useState('');

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
    const existingDispatches = repositories.dispatches
      .getAll()
      .filter((dispatch) => String(dispatch.serviceDate ?? dispatch.scheduledDate).slice(0, 10) === serviceDate);

    if (existingDispatches.length > 0) {
      toast.error('자동 배차 불가', '해당 운행일에는 이미 배차가 생성되어 자동 배차는 1회만 가능합니다.');
      return;
    }

    const bit = dayToBit(new Date(serviceDate).getDay());
    const targets = repositories.routes.getAll().filter((r) => r.status === 'active' && (r.weekdayMask & bit) !== 0);

    if (targets.length === 0) {
      toast.error('자동 배차 대상 없음', '선택한 운행일에 운행하는 활성 노선이 없습니다.');
      return;
    }

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

  const createManualDispatch = () => {
    if (!manualRouteId) {
      toast.error('수동 생성 실패', '노선을 선택해 주세요.');
      return;
    }

    const route = repositories.routes.getById(manualRouteId);
    if (!route || route.status !== 'active') {
      toast.error('수동 생성 실패', '선택한 노선을 찾을 수 없습니다.');
      return;
    }

    const driver = manualDriverId ? repositories.drivers.getById(manualDriverId) : null;
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
    setManualRouteId('');
    setManualDriverId('');
    setManualOpen(false);
    load();
    toast.success('수동 배차 생성', '배차가 추가되었습니다.');
  };

  const updateDispatch = (dispatch: Dispatch, updates: Partial<Dispatch>) => {
    if (dispatch.status === 'closed') {
      toast.error('수정 불가', '마감 상태의 배차는 수정할 수 없습니다.');
      return;
    }

    const before = { ...dispatch };
    const optimistic = { ...dispatch, ...updates };

    setRows((prev) => prev.map((row) => (row.id === dispatch.id ? optimistic : row)));

    try {
      const updated = repositories.dispatches.update(dispatch.id, updates);
      if (!updated) throw new Error('update failed');
      recordChangeLog({ entityType: 'dispatch', entityId: dispatch.id, action: 'update', before, after: updated });
      toast.success('배차 정보가 즉시 반영되었습니다.');
    } catch {
      setRows((prev) => prev.map((row) => (row.id === dispatch.id ? before : row)));
      toast.error('배차 수정 실패', '변경 내용을 저장하지 못했습니다.');
    }
  };

  const createRun = (dispatch: Dispatch) => {
    if (!dispatch.serviceDate) return;
    if (isMonthLocked(String(dispatch.serviceDate))) return toast.error('잠금 월', '확정된 정산월은 운행 생성/수정이 불가합니다.');
    const alreadyConfirmed = repositories.runs.getAll().some((run) => run.dispatchId === dispatch.id);
    if (alreadyConfirmed) return toast.error('중복 확정 불가', '해당 배차는 이미 운행 확정되었습니다.');
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

  const confirmAllDispatches = () => {
    const targets = filteredDispatches.filter((dispatch) => !runs.some((run) => run.dispatchId === dispatch.id));
    if (targets.length === 0) {
      toast.error('확정 대상 없음', '이미 모두 운행 확정되었습니다.');
      return;
    }
    for (const dispatch of targets) {
      createRun(dispatch);
    }
    toast.success('일괄 운행 확정', `${targets.length}건이 확정되었습니다.`);
  };

  const deleteDispatch = (dispatch: Dispatch) => {
    const hasRun = repositories.runs.getAll().some((run) => run.dispatchId === dispatch.id);
    if (hasRun) {
      toast.error('삭제 불가', '이미 운행 확정된 배차는 삭제할 수 없습니다.');
      return;
    }
    const before = { ...dispatch };
    const deleted = repositories.dispatches.delete(dispatch.id);
    if (!deleted) {
      toast.error('삭제 실패', '배차를 삭제하지 못했습니다.');
      return;
    }
    recordChangeLog({ entityType: 'dispatch', entityId: dispatch.id, action: 'cancel', before });
    load();
    toast.success('삭제 완료', '배차가 삭제되었습니다.');
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
  const hasDispatchesForDate = rows.some((dispatch) => String(dispatch.serviceDate ?? dispatch.scheduledDate).slice(0, 10) === serviceDate);
  const activeRoutes = repositories.routes.getAll().filter((route) => route.status === 'active');

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.dispatches')} />}>
      <PageContent>
        <Grid columns={4} className="mb-4">
          <StatCard label="당일 배차" value={filteredDispatches.length} />
          <StatCard label="게시" value={filteredDispatches.filter((d) => d.status === 'published').length} />
          <StatCard label="마감" value={filteredDispatches.filter((d) => d.status === 'closed').length} />
          <StatCard label="당일 운행" value={runs.filter((r) => String(r.serviceDate).slice(0, 10) === serviceDate).length} />
        </Grid>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명/계획 기사 검색" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 상태</option>
              <option value="draft">임시저장</option>
              <option value="published">게시</option>
              <option value="closed">마감</option>
              <option value="canceled">취소</option>
            </select>
            {hasDispatchesForDate ? <Button onClick={confirmAllDispatches}>모두 운행 확정</Button> : <Button onClick={autoGenerate}>자동 생성</Button>}
          </div>
          <Button
            onClick={() => {
              setManualRouteId('');
              setManualDriverId('');
              setManualOpen(true);
            }}
          >
            + 수동 배차 추가
          </Button>
        </div>

        <DataList
          data={filteredDispatches}
          columns={[
            { key: 'routeId', label: '노선', render: (v) => repositories.routes.getById(String(v))?.name ?? '-' },
            { key: 'plannedDriverId', label: '계획 기사', render: (_, d) => <select value={d.plannedDriverId ?? ''} onChange={(e) => updateDispatch(d, { plannedDriverId: e.target.value || null })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="">미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
            { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
          ]}
          actions={(d) => (
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={runs.some((run) => run.dispatchId === d.id)} onClick={() => createRun(d)}>
                {runs.some((run) => run.dispatchId === d.id) ? '확정됨' : '운행 생성(확정)'}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => deleteDispatch(d)}>삭제</Button>
            </div>
          )}
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

        <ModalForm isOpen={manualOpen} onOpenChange={setManualOpen} onSubmit={createManualDispatch} title="수동 배차 추가" submitLabel="추가">
          <FormField label="노선" required>
            <select value={manualRouteId} onChange={(e) => setManualRouteId(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
              <option value="">노선을 선택하세요</option>
              {activeRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </FormField>
          <FormField label="기사">
            <select value={manualDriverId} onChange={(e) => setManualDriverId(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
              <option value="">미배정</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
          </FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
