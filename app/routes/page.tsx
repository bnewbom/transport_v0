'use client';
import React from 'react';
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
import { DAY_LABELS, getShiftTypeLabel, getStatusLabel, labelsToWeekdayMask, maskIncludesDay, weekdayMaskToLabels } from '@/lib/labels';
import { ensureSeedData } from '@/lib/seed';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function RoutesPage() {
  const [rows, setRows] = React.useState<Route[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Route | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [shiftFilter, setShiftFilter] = React.useState<'all' | 'day' | 'night'>('all');
  const [dayFilter, setDayFilter] = React.useState<'all' | '0' | '1' | '2' | '3' | '4' | '5' | '6'>('all');
  const [selectedDays, setSelectedDays] = React.useState<number[]>(ALL_DAYS);
  const [form, setForm] = React.useState({ name: '', startLocation: '', endLocation: '', distance: 0, estimatedTime: 0, baseRate: 0, shiftType: 'day' as Route['shiftType'], baseAllowanceAmount: 0, status: 'active' as Route['status'] });

  const load = React.useCallback(() => setRows(repositories.routes.getAll()), []);

  React.useEffect(() => {
    ensureSeedData();
    load();
  }, [load]);

  const save = () => {
    const payload = { ...form, weekdayMask: labelsToWeekdayMask(selectedDays) };
    if (editing) repositories.routes.update(editing.id, payload);
    else repositories.routes.create(payload);
    setOpen(false);
    load();
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const filtered = rows.filter((row) => {
    const bySearch = row.name.toLowerCase().includes(search.toLowerCase());
    const byStatus = statusFilter === 'all' || row.status === statusFilter;
    const byShift = shiftFilter === 'all' || row.shiftType === shiftFilter;
    const byDay = dayFilter === 'all' || maskIncludesDay(row.weekdayMask, Number(dayFilter));
    return bySearch && byStatus && byShift && byDay;
  });

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.routes')} />}>
      <PageContent>
        <div className="mb-4 grid gap-4 md:grid-cols-4">
          <StatCard label="전체 노선" value={rows.length} />
          <StatCard label="활성" value={rows.filter((x) => x.status === 'active').length} />
          <StatCard label="주간" value={rows.filter((x) => x.shiftType === 'day').length} />
          <StatCard label="야간" value={rows.filter((x) => x.shiftType === 'night').length} />
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="노선명 검색" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value as typeof dayFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 요일</option>
              {DAY_LABELS.map((day, idx) => <option key={day} value={String(idx)}>{day}</option>)}
            </select>
            <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value as typeof shiftFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 주/야간</option><option value="day">주간</option><option value="night">야간</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 상태</option><option value="active">활성</option><option value="inactive">비활성</option>
            </select>
          </div>
          <Button onClick={() => { setEditing(null); setSelectedDays(ALL_DAYS); setForm({ name: '', startLocation: '', endLocation: '', distance: 0, estimatedTime: 0, baseRate: 0, shiftType: 'day', baseAllowanceAmount: 0, status: 'active' }); setOpen(true); }}>+ 노선 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'name', label: '노선명' },
            { key: 'weekdayMask', label: '요일', render: (v) => weekdayMaskToLabels(Number(v)) },
            { key: 'shiftType', label: '주/야간', render: (v) => <Badge>{getShiftTypeLabel(v)}</Badge> },
            { key: 'baseAllowanceAmount', label: '기본 수당(1회)', render: (v) => formatKRW(Number(v)) },
            { key: 'status', label: '상태', render: (v) => <Badge>{getStatusLabel(String(v))}</Badge> },
          ]}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                setEditing(row);
                setSelectedDays(ALL_DAYS.filter((day) => maskIncludesDay(row.weekdayMask, day)));
                setForm({ name: row.name, startLocation: row.startLocation, endLocation: row.endLocation, distance: row.distance, estimatedTime: row.estimatedTime, baseRate: row.baseRate, shiftType: row.shiftType, baseAllowanceAmount: row.baseAllowanceAmount, status: row.status });
                setOpen(true);
              }}>수정</Button>
              <Button size="sm" variant="outline" onClick={() => { repositories.routes.update(row.id, { status: 'inactive' }); load(); }}>비활성화</Button>
            </div>
          )}
        />

        <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '노선 수정' : '노선 추가'} submitLabel={editing ? '수정' : '추가'}>
          <FormField label="노선명" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
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
          <FormField label="주/야간"><select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value as Route['shiftType'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="day">주간</option><option value="night">야간</option></select></FormField>
          <FormField label="기본 수당(1회)"><input type="number" value={form.baseAllowanceAmount} onChange={(e) => setForm({ ...form, baseAllowanceAmount: Number(e.target.value) })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Route['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">활성</option><option value="inactive">비활성</option></select></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
