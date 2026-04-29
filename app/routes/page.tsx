'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories } from '@/lib/repository';
import { Route } from '@/lib/schemas';
import { formatKRW } from '@/lib/formatters';
import { DAY_LABELS, getShiftTypeLabel, labelsToWeekdayMask, maskIncludesDay, weekdayMaskToLabels } from '@/lib/labels';
import { ensureSeedData } from '@/lib/seed';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type RouteForm = {
  startLocation: string;
  endLocation: string;
  distance: number;
  estimatedTime: number;
  baseRate: number;
  shiftType: Route['shiftType'];
  commuteType: Route['commuteType'];
  baseAllowanceAmount: number;
  routeSupplyAmount: number;
  weekdayMask: number;
  status: Route['status'];
};

const createRouteFormDefaults = (): RouteForm => ({
  startLocation: '',
  endLocation: '',
  distance: 0,
  estimatedTime: 0,
  baseRate: 0,
  shiftType: 'day',
  commuteType: 'goWork',
  baseAllowanceAmount: 0,
  routeSupplyAmount: 0,
  weekdayMask: 127,
  status: 'active',
});

const getShiftSlotLabel = (shiftType: Route['shiftType']) => (shiftType === 'day' ? '주간' : '야간');
const getCommuteTypeLabel = (commuteType: Route['commuteType']) => (commuteType === 'goWork' ? '출근' : '퇴근');
const getShiftBadgeVariant = (shiftType: Route['shiftType']): 'success' | 'warning' => shiftType === 'day' ? 'success' : 'warning';
const getCommuteBadgeVariant = (commuteType: Route['commuteType']): 'success' | 'warning' => commuteType === 'goWork' ? 'success' : 'warning';
const sortRoutesByCommuteType = (left: Route, right: Route) => {
  const commuteOrder = { goWork: 0, offWork: 1 } as const;
  const byCommuteType = commuteOrder[left.commuteType] - commuteOrder[right.commuteType];
  if (byCommuteType !== 0) return byCommuteType;
  return left.name.localeCompare(right.name, 'ko');
};
const buildBaseRouteName = (route: Pick<RouteForm, 'startLocation' | 'endLocation' | 'shiftType' | 'commuteType'>) =>
  `${route.startLocation.trim()}-${route.endLocation.trim()}:[${getShiftSlotLabel(route.shiftType)}/${getCommuteTypeLabel(route.commuteType)}]`;
const buildUniqueRouteName = (baseName: string, usedNames: Set<string>) => {
  if (!usedNames.has(baseName)) return baseName;
  let suffixIndex = 0;
  while (suffixIndex < 26) {
    const candidate = `${baseName}${String.fromCharCode(65 + suffixIndex)}`;
    if (!usedNames.has(candidate)) return candidate;
    suffixIndex += 1;
  }
  let serial = 27;
  while (usedNames.has(`${baseName}${serial}`)) serial += 1;
  return `${baseName}${serial}`;
};

const normalizeRouteForm = (route?: Partial<Route> | null): RouteForm => {
  const defaults = createRouteFormDefaults();
  return {
    ...defaults,
    ...route,
    shiftType: route?.shiftType ?? defaults.shiftType,
    commuteType: route?.commuteType ?? defaults.commuteType,
    baseAllowanceAmount: Number(route?.baseAllowanceAmount ?? defaults.baseAllowanceAmount),
    routeSupplyAmount: Number(route?.routeSupplyAmount ?? defaults.routeSupplyAmount),
    weekdayMask: Number(route?.weekdayMask ?? defaults.weekdayMask),
    status: route?.status ?? defaults.status,
  };
};


const normalizeRouteEntity = (route: Route): Route => {
  const normalized = normalizeRouteForm(route);
  return {
    ...route,
    ...normalized,
  };
};

export default function RoutesPage() {
  const router = useRouter();
  const [rows, setRows] = React.useState<Route[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Route | null>(null);
  const [search, setSearch] = React.useState('');
  const [shiftFilter, setShiftFilter] = React.useState<'all' | 'day' | 'night'>('all');
  const [commuteFilter, setCommuteFilter] = React.useState<'all' | 'goWork' | 'offWork'>('all');
  const [dayFilter, setDayFilter] = React.useState<'all' | '0' | '1' | '2' | '3' | '4' | '5' | '6'>('all');
  const [selectedDays, setSelectedDays] = React.useState<number[]>(ALL_DAYS);
  const [form, setForm] = React.useState<RouteForm>(createRouteFormDefaults());
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  const load = React.useCallback(() => {
    const current = repositories.routes.getAll();
    const normalizedRows = current.map((row) => normalizeRouteEntity(row));
    const usedNames = new Set<string>();

    normalizedRows.forEach((row, idx) => {
      const original = current[idx];
      const uniqueName = buildUniqueRouteName(buildBaseRouteName(row), usedNames);
      usedNames.add(uniqueName);
      if (
        original.baseAllowanceAmount !== row.baseAllowanceAmount ||
        original.routeSupplyAmount !== row.routeSupplyAmount ||
        original.weekdayMask !== row.weekdayMask ||
        original.shiftType !== row.shiftType ||
        original.commuteType !== row.commuteType ||
        original.name !== uniqueName ||
        original.status !== row.status
      ) {
        repositories.routes.update(row.id, {
          baseAllowanceAmount: row.baseAllowanceAmount,
          routeSupplyAmount: row.routeSupplyAmount,
          weekdayMask: row.weekdayMask,
          shiftType: row.shiftType,
          commuteType: row.commuteType,
          name: uniqueName,
          status: row.status,
        });
      }
      row.name = uniqueName;
    });

    setRows(normalizedRows.sort(sortRoutesByCommuteType));
  }, []);

  React.useEffect(() => {
    if (!localStorage.getItem('auth')) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
    ensureSeedData();
    load();
  }, [router, load]);

  if (!isAuthorized) return null;

  const save = () => {
    const existingNames = new Set(rows.filter((row) => row.id !== editing?.id).map((row) => row.name));
    const payload = {
      ...form,
      name: buildUniqueRouteName(buildBaseRouteName(form), existingNames),
      weekdayMask: form.weekdayMask,
    };
    if (editing) repositories.routes.update(editing.id, payload);
    else repositories.routes.create(payload);
    setOpen(false);
    load();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      setForm((current) => ({ ...current, weekdayMask: labelsToWeekdayMask(next) }));
      return next;
    });
  };

  const filtered = rows.filter((row) => {
    const bySearch = row.name.toLowerCase().includes(search.toLowerCase());
    const byShift = shiftFilter === 'all' || row.shiftType === shiftFilter;
    const byCommute = commuteFilter === 'all' || row.commuteType === commuteFilter;
    const byDay = dayFilter === 'all' || maskIncludesDay(row.weekdayMask, Number(dayFilter));
    return bySearch && byShift && byCommute && byDay;
  }).sort(sortRoutesByCommuteType);

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.routes')} />}>
      <PageContent>
        <div className="mb-4 hidden gap-4 md:grid md:grid-cols-5">
          <StatCard label="전체 노선" value={rows.length} />
          <StatCard label="야간/퇴근" value={rows.filter((x) => x.shiftType === 'night' && x.commuteType === 'offWork').length} />
          <StatCard label="주간/출근" value={rows.filter((x) => x.shiftType === 'day' && x.commuteType === 'goWork').length} />
          <StatCard label="야간/출근" value={rows.filter((x) => x.shiftType === 'night' && x.commuteType === 'goWork').length} />
          <StatCard label="주간/퇴근" value={rows.filter((x) => x.shiftType === 'day' && x.commuteType === 'offWork').length} />
        </div>

        <div className="mb-4 hidden items-center justify-between gap-2 md:flex">
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명 검색" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value as typeof dayFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 요일</option>
              {DAY_LABELS.map((day, idx) => <option key={day} value={String(idx)}>{day}</option>)}
            </select>
            <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value as typeof shiftFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">주/야간 전체</option><option value="day">주간</option><option value="night">야간</option>
            </select>
            <select value={commuteFilter} onChange={(e) => setCommuteFilter(e.target.value as typeof commuteFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">출/퇴근 전체</option><option value="goWork">출근</option><option value="offWork">퇴근</option>
            </select>
          </div>
          <Button onClick={() => {
            const emptyForm = createRouteFormDefaults();
            setEditing(null);
            setForm(emptyForm);
            setSelectedDays(ALL_DAYS);
            setOpen(true);
          }}>+ 노선 추가</Button>
        </div>

        <div className="mb-4 grid gap-2 md:hidden">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명 검색" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <div className="grid gap-2">
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value as typeof dayFilter)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 요일</option>
              {DAY_LABELS.map((day, idx) => <option key={day} value={String(idx)}>{day}</option>)}
            </select>
            <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value as typeof shiftFilter)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">주/야간 전체</option><option value="day">주간</option><option value="night">야간</option>
            </select>
            <select value={commuteFilter} onChange={(e) => setCommuteFilter(e.target.value as typeof commuteFilter)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">출/퇴근 전체</option><option value="goWork">출근</option><option value="offWork">퇴근</option>
            </select>
          </div>
          <Button className="w-full" onClick={() => {
            const emptyForm = createRouteFormDefaults();
            setEditing(null);
            setForm(emptyForm);
            setSelectedDays(ALL_DAYS);
            setOpen(true);
          }}>+ 노선 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'name', label: '노선명' },
            { key: 'weekdayMask', label: '요일', render: (v) => weekdayMaskToLabels(Number(v)) },
            { key: 'shiftType', label: '주/야간', render: (v) => <Badge variant={getShiftBadgeVariant(v as Route['shiftType'])}>{getShiftTypeLabel(v)}</Badge> },
            { key: 'commuteType', label: '출/퇴근', render: (v) => <Badge variant={getCommuteBadgeVariant(v as Route['commuteType'])}>{getCommuteTypeLabel(v as Route['commuteType'])}</Badge> },
            { key: 'baseAllowanceAmount', label: '운행 수당', render: (v) => formatKRW(Number(v)) },
            { key: 'routeSupplyAmount', label: '공급가액', render: (v) => formatKRW(Number(v)) },
          ]}
          mobileCardRender={(row) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">노선</span>
                <span className="text-right text-sm font-semibold text-foreground">{row.name}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">요일</span>
                <span className="text-sm text-foreground">{weekdayMaskToLabels(Number(row.weekdayMask))}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">운행 수당</span>
                <span className="text-sm text-foreground">{formatKRW(Number(row.baseAllowanceAmount))}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">공급가액</span>
                <span className="text-sm text-foreground">{formatKRW(Number(row.routeSupplyAmount))}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setEditing(row);
                  const normalized = normalizeRouteForm(row);
                  setSelectedDays(ALL_DAYS.filter((day) => maskIncludesDay(normalized.weekdayMask, day)));
                  setForm(normalized);
                  setOpen(true);
                }}>수정</Button>
                <Button size="sm" variant="destructive" onClick={() => { repositories.routes.delete(row.id); load(); }}>삭제</Button>
              </div>
            </div>
          )}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                setEditing(row);
                const normalized = normalizeRouteForm(row);
                setSelectedDays(ALL_DAYS.filter((day) => maskIncludesDay(normalized.weekdayMask, day)));
                setForm(normalized);
                setOpen(true);
              }}>수정</Button>
              <Button size="sm" variant="destructive" onClick={() => { repositories.routes.delete(row.id); load(); }}>삭제</Button>
            </div>
          )}
        />

        <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '노선 수정' : '노선 추가'} submitLabel={editing ? '수정' : '추가'}>
          <FormField label="출발지" required><input value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="도착지" required><input value={form.endLocation} onChange={(e) => setForm({ ...form, endLocation: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="요일" required>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((day, idx) => {
                const selected = selectedDays.includes(idx);
                return <button type="button" key={day} onClick={() => toggleDay(idx)} className={`rounded-lg border px-3 py-1 text-sm ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-input'}`}>{day}</button>;
              })}
            </div>
          </FormField>
          <FormField label="주/야간" required><select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value as Route['shiftType'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="day">주간</option><option value="night">야간</option></select></FormField>
          <FormField label="출근/퇴근" required><select value={form.commuteType} onChange={(e) => setForm({ ...form, commuteType: e.target.value as Route['commuteType'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="goWork">출근</option><option value="offWork">퇴근</option></select></FormField>
          <FormField label="운행 수당"><input type="number" value={form.baseAllowanceAmount ?? 0} onChange={(e) => setForm({ ...form, baseAllowanceAmount: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="공급가액"><input type="number" value={form.routeSupplyAmount ?? 0} onChange={(e) => setForm({ ...form, routeSupplyAmount: e.target.value === '' ? 0 : Number(e.target.value) })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Route['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">활성</option><option value="inactive">비활성</option></select></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
