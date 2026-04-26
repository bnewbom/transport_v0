'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, StatCard } from '@/components/layout-shell';
import { DataList } from '@/components/data-list';
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

type DispatchCategoryFilter = 'all' | 'nightOff' | 'dayGo' | 'nightGo' | 'dayOff';

export default function DispatchesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [serviceDate, setServiceDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = React.useState('');
  const [dispatchShiftFilter, setDispatchShiftFilter] = React.useState<'all' | 'day' | 'night'>('all');
  const [dispatchCommuteFilter, setDispatchCommuteFilter] = React.useState<'all' | 'goWork' | 'offWork'>('all');
  const [categoryFilter, setCategoryFilterState] = React.useState<DispatchCategoryFilter>('all');
  const [rows, setRows] = React.useState<Dispatch[]>([]);
  const [runs, setRuns] = React.useState<Run[]>([]);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualRouteName, setManualRouteName] = React.useState('');
  const [manualDriverId, setManualDriverId] = React.useState('');
  const [manualDriverCustomName, setManualDriverCustomName] = React.useState('');
  const [driverRequiredDispatchIds, setDriverRequiredDispatchIds] = React.useState<string[]>([]);

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
    const routeName = manualRouteName.trim();
    if (!routeName) {
      toast.error('수동 생성 실패', '노선을 입력해 주세요.');
      return;
    }

    const route = repositories.routes.getAll().find((item) => item.status === 'active' && item.name === routeName);
    if (!route) {
      toast.error('수동 생성 실패', '입력한 노선을 찾을 수 없습니다.');
      return;
    }

    let driver = manualDriverId ? repositories.drivers.getById(manualDriverId) : null;
    if (manualDriverId === '__manual__') {
      const customName = manualDriverCustomName.trim();
      if (!customName) {
        toast.error('수동 생성 실패', '직접 입력할 기사 이름을 입력해 주세요.');
        return;
      }
      const existing = repositories.drivers.getAll().find((item) => item.name === customName);
      driver = existing ?? repositories.drivers.create({
        name: customName,
        phone: '-',
        licenseNumber: `MANUAL-${Date.now()}`,
        status: 'active',
        joinDate: new Date().toISOString(),
      });
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
    setManualDriverId('');
    setManualDriverCustomName('');
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
    if (!dispatch.plannedDriverId) {
      setDriverRequiredDispatchIds((prev) => Array.from(new Set([...prev, dispatch.id])));
      window.alert('노선에 기사 지정을 해주세요.');
      return;
    }
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
    const missingDriverTargets = targets.filter((dispatch) => !dispatch.plannedDriverId);
    if (missingDriverTargets.length > 0) {
      setDriverRequiredDispatchIds((prev) => Array.from(new Set([...prev, ...missingDriverTargets.map((dispatch) => dispatch.id)])));
      window.alert('노선에 기사 지정을 해주세요.');
      return;
    }
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

  const drivers = repositories.drivers.getAll();
  const filteredDispatches = rows.filter((d) => {
    const date = String(d.serviceDate ?? d.scheduledDate).slice(0, 10);
    const route = repositories.routes.getById(d.routeId);
    const routeName = repositories.routes.getById(d.routeId)?.name ?? '';
    const driverName = repositories.drivers.getById(d.plannedDriverId ?? '')?.name ?? '';
    const byDate = date === serviceDate;
    const byShift = dispatchShiftFilter === 'all' || route?.shiftType === dispatchShiftFilter;
    const byCommute = dispatchCommuteFilter === 'all' || route?.commuteType === dispatchCommuteFilter;
    const q = search.toLowerCase();
    const bySearch = routeName.toLowerCase().includes(q) || driverName.toLowerCase().includes(q);
    return byDate && byShift && byCommute && bySearch;
  });
  const hasDispatchesForDate = rows.some((dispatch) => String(dispatch.serviceDate ?? dispatch.scheduledDate).slice(0, 10) === serviceDate);
  const allConfirmedForDate = filteredDispatches.length > 0 && filteredDispatches.every((dispatch) => runs.some((run) => run.dispatchId === dispatch.id));
  const mobileFilterKey: 'all' | 'night-off' | 'day-go' | 'night-go' | 'day-off' =
    dispatchShiftFilter === 'night' && dispatchCommuteFilter === 'offWork'
      ? 'night-off'
      : dispatchShiftFilter === 'day' && dispatchCommuteFilter === 'goWork'
        ? 'day-go'
        : dispatchShiftFilter === 'night' && dispatchCommuteFilter === 'goWork'
          ? 'night-go'
          : dispatchShiftFilter === 'day' && dispatchCommuteFilter === 'offWork'
            ? 'day-off'
            : 'all';
  const setMobileFilterKey = (key: 'all' | 'night-off' | 'day-go' | 'night-go' | 'day-off') => {
    if (key === 'all') {
      setDispatchShiftFilter('all');
      setDispatchCommuteFilter('all');
      return;
    }
    if (key === 'night-off') {
      setDispatchShiftFilter('night');
      setDispatchCommuteFilter('offWork');
      return;
    }
    if (key === 'day-go') {
      setDispatchShiftFilter('day');
      setDispatchCommuteFilter('goWork');
      return;
    }
    if (key === 'night-go') {
      setDispatchShiftFilter('night');
      setDispatchCommuteFilter('goWork');
      return;
    }
    setDispatchShiftFilter('day');
    setDispatchCommuteFilter('offWork');
  };
  const setCategoryFilter = React.useCallback((next: DispatchCategoryFilter) => {
    setCategoryFilterState(next);
    if (next === 'all') {
      setDispatchShiftFilter('all');
      setDispatchCommuteFilter('all');
      return;
    }
    if (next === 'nightOff') {
      setDispatchShiftFilter('night');
      setDispatchCommuteFilter('offWork');
      return;
    }
    if (next === 'dayGo') {
      setDispatchShiftFilter('day');
      setDispatchCommuteFilter('goWork');
      return;
    }
    if (next === 'nightGo') {
      setDispatchShiftFilter('night');
      setDispatchCommuteFilter('goWork');
      return;
    }
    setDispatchShiftFilter('day');
    setDispatchCommuteFilter('offWork');
  }, []);
  React.useEffect(() => {
    const next: DispatchCategoryFilter =
      dispatchShiftFilter === 'night' && dispatchCommuteFilter === 'offWork'
        ? 'nightOff'
        : dispatchShiftFilter === 'day' && dispatchCommuteFilter === 'goWork'
          ? 'dayGo'
          : dispatchShiftFilter === 'night' && dispatchCommuteFilter === 'goWork'
            ? 'nightGo'
            : dispatchShiftFilter === 'day' && dispatchCommuteFilter === 'offWork'
              ? 'dayOff'
              : 'all';
    if (next !== categoryFilter) setCategoryFilterState(next);
  }, [dispatchShiftFilter, dispatchCommuteFilter, categoryFilter]);
  const copyDispatchSummary = async () => {
    const confirmedDispatches = filteredDispatches.filter((dispatch) => runs.some((run) => run.dispatchId === dispatch.id));
    if (confirmedDispatches.length === 0) return toast.error('복사 실패', '확정된 배차가 없습니다.');
    const groups: Array<{ title: string; items: string[] }> = [
      { title: '■■■ 주간 / 출근조 ■■■', items: [] },
      { title: '■■■ 주간 / 퇴근조 ■■■', items: [] },
      { title: '■■■ 야간 / 출근조 ■■■', items: [] },
      { title: '■■■ 야간 / 퇴근조 ■■■', items: [] },
    ];

    confirmedDispatches.forEach((dispatch) => {
      const route = repositories.routes.getById(dispatch.routeId);
      if (!route) return;
      const routeName = route.name ?? '-';
      const driverName = repositories.drivers.getById(dispatch.plannedDriverId ?? '')?.name ?? '미지정';
      const line = `${routeName} - ${driverName}`;

      if (route.shiftType === 'day' && route.commuteType === 'goWork') groups[0].items.push(line);
      if (route.shiftType === 'day' && route.commuteType === 'offWork') groups[1].items.push(line);
      if (route.shiftType === 'night' && route.commuteType === 'goWork') groups[2].items.push(line);
      if (route.shiftType === 'night' && route.commuteType === 'offWork') groups[3].items.push(line);
    });

    const nonEmptySections = groups
      .filter((group) => group.items.length > 0)
      .map((group) => {
        const lines = group.items.map((item, index) => `${index + 1}. ${item}`);
        return [group.title, ...lines].join('\n');
      });
    const text = nonEmptySections.join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      toast.success('복사 완료', '확정 배차표를 복사했습니다.');
    } catch {
      toast.error('복사 실패', '클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.dispatches')} />}>
      <PageContent>
        <div className="mb-4 hidden gap-4 md:grid md:grid-cols-5">
          <StatCard label="전체" value={filteredDispatches.length} />
          <StatCard label="야간/퇴근" value={filteredDispatches.filter((d) => {
            const route = repositories.routes.getById(d.routeId);
            return route?.shiftType === 'night' && route?.commuteType === 'offWork';
          }).length} />
          <StatCard label="주간/출근" value={filteredDispatches.filter((d) => {
            const route = repositories.routes.getById(d.routeId);
            return route?.shiftType === 'day' && route?.commuteType === 'goWork';
          }).length} />
          <StatCard label="야간/출근" value={filteredDispatches.filter((d) => {
            const route = repositories.routes.getById(d.routeId);
            return route?.shiftType === 'night' && route?.commuteType === 'goWork';
          }).length} />
          <StatCard label="주간/퇴근" value={filteredDispatches.filter((d) => {
            const route = repositories.routes.getById(d.routeId);
            return route?.shiftType === 'day' && route?.commuteType === 'offWork';
          }).length} />
        </div>

        <div className="mb-4 hidden items-center justify-between gap-2 md:flex">
          <div className="flex gap-2">
            <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명/계획 기사 검색" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={dispatchShiftFilter} onChange={(e) => setDispatchShiftFilter(e.target.value as typeof dispatchShiftFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">주/야간 전체</option>
              <option value="day">주간</option>
              <option value="night">야간</option>
            </select>
            <select value={dispatchCommuteFilter} onChange={(e) => setDispatchCommuteFilter(e.target.value as typeof dispatchCommuteFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">출/퇴근 전체</option>
              <option value="goWork">출근</option>
              <option value="offWork">퇴근</option>
            </select>
            {hasDispatchesForDate ? (
              <div className="flex items-center gap-2">
                <Button variant={allConfirmedForDate ? 'destructive' : 'default'} onClick={confirmAllDispatches}>
                  {allConfirmedForDate ? '모두 운행 취소' : '모두 운행 확정'}
                </Button>
                <Button
                  disabled={!allConfirmedForDate}
                  onClick={copyDispatchSummary}
                  className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:text-white"
                >
                  배차표 복사
                </Button>
              </div>
            ) : <Button onClick={autoGenerate}>자동 생성</Button>}
          </div>
          <Button
            onClick={() => {
              setManualRouteName('');
              setManualDriverId('');
              setManualDriverCustomName('');
              setManualOpen(true);
            }}
          >
            + 수동 배차 추가
          </Button>
        </div>

        <div className="mb-4 grid gap-2 md:hidden">
          <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="배차 선택" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <div className="grid grid-cols-5 gap-1">
            {[
              { key: 'all' as const, label: '전체' },
              { key: 'night-off' as const, label: '야/퇴' },
              { key: 'day-go' as const, label: '주/출' },
              { key: 'night-go' as const, label: '야/출' },
              { key: 'day-off' as const, label: '주/퇴' },
            ].map((item) => (
              <Button
                key={item.key}
                type="button"
                size="sm"
                variant={mobileFilterKey === item.key ? 'default' : 'outline'}
                className="px-1 text-xs"
                onClick={() => setMobileFilterKey(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="my-1 border-t border-border/70" />
          {hasDispatchesForDate ? (
            <div className="grid grid-cols-2 gap-2">
              <Button className="w-full" variant={allConfirmedForDate ? 'destructive' : 'default'} onClick={confirmAllDispatches}>
                {allConfirmedForDate ? '모두 운행 취소' : '모두 운행 확정'}
              </Button>
              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-300 disabled:text-white"
                disabled={!allConfirmedForDate}
                onClick={copyDispatchSummary}
              >
                배차표 복사
              </Button>
            </div>
          ) : <Button className="w-full" onClick={autoGenerate}>자동 생성</Button>}
          <Button
            className="w-full"
            onClick={() => {
              setManualRouteName('');
              setManualDriverId('');
              setManualDriverCustomName('');
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
            {
              key: 'plannedDriverId',
              label: '기사',
              render: (_, d) => (
                <select
                  value={d.plannedDriverId ?? ''}
                  onChange={(e) => {
                    updateDispatch(d, { plannedDriverId: e.target.value || null });
                    if (e.target.value) setDriverRequiredDispatchIds((prev) => prev.filter((id) => id !== d.id));
                  }}
                  className={`rounded-lg border px-2 py-1 text-sm ${driverRequiredDispatchIds.includes(d.id) ? 'border-pink-400 bg-pink-50' : 'border-input'}`}
                >
                  <option value="">미배정</option>
                  {drivers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              ),
            },
            { key: 'serviceDate', label: '운행일', render: (v) => formatDate(new Date(String(v)), 'long') },
            {
              key: 'status',
              label: '근태',
              render: (_, d) => {
                const run = runs.find((item) => item.dispatchId === d.id);
                if (!run) return <span className="inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">미확정</span>;
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
            <select value={manualDriverId} onChange={(e) => setManualDriverId(e.target.value)} className="w-full rounded-lg border border-input px-3 py-2 text-sm">
              <option value="">기사 선택</option>
              <option value="__manual__">직접 입력</option>
              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
            {manualDriverId === '__manual__' && (
              <input
                value={manualDriverCustomName}
                onChange={(e) => setManualDriverCustomName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-input px-3 py-2 text-sm"
                placeholder="기사 이름을 입력하세요"
              />
            )}
          </FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
