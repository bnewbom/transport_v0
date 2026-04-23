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
import { dayToBit } from '@/lib/labels';
import { ensureSeedData } from '@/lib/seed';

export default function DispatchesPage() {
  const visibleDriverNames = React.useMemo(() => ['김민준', '이성호', '박지원'], []);
  const router = useRouter();
  const toast = useAppToast();
  const [serviceDate, setServiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'draft' | 'published' | 'closed' | 'canceled'>('all');
  const [rows, setRows] = React.useState<Dispatch[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualRouteName, setManualRouteName] = React.useState('');
  const [manualDriverName, setManualDriverName] = React.useState('');

  const load = React.useCallback(() => {
    setRows([...repositories.dispatches.getAll()]);
    setRuns([...repositories.runs.getAll()]);
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
      const driver = repositories.drivers.getAll().find((d) => d.status === 'active' && visibleDriverNames.includes(d.name) && d.defaultRouteId === route.id);
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
    const routeName = manualRouteName.trim();
    const driverName = manualDriverName.trim();
    if (!routeName) {
      toast.error('수동 생성 실패', '노선을 입력해 주세요.');
      return;
    }

    const route = repositories.routes.getAll().find((item) => item.status === 'active' && item.name === routeName);
    if (!route) {
      toast.error('수동 생성 실패', '입력한 노선을 찾을 수 없습니다.');
      return;
    }

    const driver = driverName ? repositories.drivers.getAll().find((item) => item.status === 'active' && item.name === driverName) : null;
    if (driverName && !driver) {
      toast.error('수동 생성 실패', '입력한 기사를 찾을 수 없습니다.');
      return;
    }
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
    setManualRouteName('');
    setManualDriverName('');
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
    if (filteredDispatches.length === 0) {
      toast.error('대상 없음', '처리할 배차가 없습니다.');
      return;
    }
    const allConfirmed = filteredDispatches.every((dispatch) => runs.some((run) => run.dispatchId === dispatch.id));
    if (allConfirmed) {
      const ok = window.confirm('모든 운행을 취소합니까?');
      if (!ok) return;
      const targets = runs.filter((run) => filteredDispatches.some((dispatch) => dispatch.id === run.dispatchId));
      for (const run of targets) {
        const before = { ...run };
        repositories.runs.delete(run.id);
        recordChangeLog({ entityType: 'run', entityId: run.id, action: 'cancel', before });
      }
      load();
      toast.success('일괄 운행 취소', `${targets.length}건이 취소되었습니다.`);
      return;
    }

    const targets = filteredDispatches.filter((dispatch) => !runs.some((run) => run.dispatchId === dispatch.id));
    for (const dispatch of targets) createRun(dispatch);
    toast.success('일괄 운행 확정', `${targets.length}건이 확정되었습니다.`);
  };

  const toggleRun = (dispatch: Dispatch) => {
    const run = runs.find((item) => item.dispatchId === dispatch.id);
    if (!run) {
      createRun(dispatch);
      return;
    }
    const ok = window.confirm('운행을 취소합니까?');
    if (!ok) return;
    const before = { ...run };
    repositories.runs.delete(run.id);
    recordChangeLog({ entityType: 'run', entityId: run.id, action: 'cancel', before });
    load();
    toast.success('운행 취소', '운행 확정이 취소되었습니다.');
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

  const drivers = repositories.drivers.getAll().filter((d) => d.status === 'active' && visibleDriverNames.includes(d.name));
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
  const allConfirmedForDate = filteredDispatches.length > 0 && filteredDispatches.every((dispatch) => runs.some((run) => run.dispatchId === dispatch.id));

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
            {hasDispatchesForDate ? (
              <Button variant={allConfirmedForDate ? 'destructive' : 'default'} onClick={confirmAllDispatches}>
                {allConfirmedForDate ? '모두 운행 취소' : '모두 운행 확정'}
              </Button>
            ) : <Button onClick={autoGenerate}>자동 생성</Button>}
          </div>
          <Button
            onClick={() => {
              setManualRouteName('');
              setManualDriverName('');
              setManualOpen(true);
            }}
          >
            + 수동 배차 추가
          </Button>
        </div>

        <DataList
          data={filteredDispatches}
          actionsLabel="운행 상태"
          columns={[
            { key: 'routeId', label: '노선', render: (v) => repositories.routes.getById(String(v))?.name ?? '-' },
            { key: 'plannedDriverId', label: '기사', render: (_, d) => <select value={d.plannedDriverId ?? ''} onChange={(e) => updateDispatch(d, { plannedDriverId: e.target.value || null })} className="rounded-lg border border-input px-2 py-1 text-sm"><option value="">미배정</option>{drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select> },
            { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
            {
              key: 'status',
              label: '근태',
              render: (_, d) => {
                const run = runs.find((item) => item.dispatchId === d.id);
                if (!run) return <Badge variant="secondary">미확정</Badge>;
                return (
                  <select value={run.status} onChange={(e) => changeRun(run, { status: e.target.value as Run['status'] })} className="rounded-lg border border-input px-2 py-1 text-sm">
                    <option value="completed">완료</option>
                    <option value="absence">결근</option>
                    <option value="holiday">휴무</option>
                    <option value="canceled">취소</option>
                    <option value="replacement">대차</option>
                  </select>
                );
              },
            },
            {
              key: 'routeId',
              label: '수당',
              render: (_, d) => {
                const run = runs.find((item) => item.dispatchId === d.id);
                const route = repositories.routes.getById(d.routeId);
                return formatKRW(Number(run?.allowanceAmount ?? route?.baseAllowanceAmount ?? route?.baseRate ?? 0));
              },
            },
          ]}
          actions={(d) => (
            <div className="flex items-center gap-2">
              <Button size="sm" variant={runs.some((run) => run.dispatchId === d.id) ? 'destructive' : 'default'} onClick={() => toggleRun(d)}>
                {runs.some((run) => run.dispatchId === d.id) ? '운행 취소' : '운행 확정'}
              </Button>
            </div>
          )}
        />

        <ModalForm isOpen={manualOpen} onOpenChange={setManualOpen} onSubmit={createManualDispatch} title="수동 배차 추가" submitLabel="추가">
          <FormField label="노선" required>
            <input value={manualRouteName} onChange={(e) => setManualRouteName(e.target.value)} list="manual-route-list" className="w-full rounded-lg border border-input px-3 py-2 text-sm" placeholder="노선명을 입력하세요" />
            <datalist id="manual-route-list">
              {repositories.routes.getAll().filter((route) => route.status === 'active').map((route) => <option key={route.id} value={route.name} />)}
            </datalist>
          </FormField>
          <FormField label="기사">
            <input value={manualDriverName} onChange={(e) => setManualDriverName(e.target.value)} list="manual-driver-list" className="w-full rounded-lg border border-input px-3 py-2 text-sm" placeholder="기사명을 입력하세요(선택)" />
            <datalist id="manual-driver-list">
              {drivers.map((driver) => <option key={driver.id} value={driver.name} />)}
            </datalist>
          </FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
