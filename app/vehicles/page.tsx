'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, StatCard } from '@/components/layout-shell';
import { DataList } from '@/components/data-list';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';

type VehicleRow = {
  id: string;
  type: string;
  firstRegisteredAt: string;
  inspectionSchedule: string;
  routeSection: string;
  driverName: string;
  period: string;
};

const initialVehicles: VehicleRow[] = [
  { id: 'vehicle-1', type: '45인승 통근버스', firstRegisteredAt: '2023-03-15', inspectionSchedule: '2026-06-05', routeSection: '판교역 ↔ 을지로입구역', driverName: '김민수', period: '2026-04-01 ~ 2026-12-31' },
  { id: 'vehicle-2', type: '25인승 미니버스', firstRegisteredAt: '2022-11-02', inspectionSchedule: '2026-07-20', routeSection: '수원역 ↔ 강남역', driverName: '이서준', period: '2026-01-01 ~ 2026-12-31' },
];

const emptyForm: Omit<VehicleRow, 'id'> = { type: '', firstRegisteredAt: '', inspectionSchedule: '', routeSection: '', driverName: '', period: '' };

export default function VehiclesPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [rows, setRows] = React.useState<VehicleRow[]>(initialVehicles);
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VehicleRow | null>(null);
  const [form, setForm] = React.useState<Omit<VehicleRow, 'id'>>(emptyForm);

  React.useEffect(() => {
    if (!localStorage.getItem('auth')) {
      router.replace('/login');
      return;
    }
    setIsAuthorized(true);
  }, [router]);

  if (!isAuthorized) return null;

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    return row.type.toLowerCase().includes(q) || row.driverName.toLowerCase().includes(q) || row.routeSection.toLowerCase().includes(q);
  });

  const saveVehicle = () => {
    if (editing) setRows((prev) => prev.map((row) => (row.id === editing.id ? { ...row, ...form } : row)));
    else setRows((prev) => [...prev, { id: `vehicle-${Date.now()}`, ...form }]);
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.vehicles')} />}>
      <PageContent>
        <div className="mb-4 hidden gap-4 md:grid md:grid-cols-3">
          <StatCard label="전체 차량" value={rows.length} />
          <StatCard label="이번 달 검사 예정" value={rows.filter((x) => x.inspectionSchedule.slice(0, 7) === new Date().toISOString().slice(0, 7)).length} />
          <StatCard label="배정 기사 수" value={new Set(rows.map((x) => x.driverName).filter(Boolean)).size} />
        </div>

        <div className="mb-4 grid gap-2 md:flex md:items-center md:justify-between">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="차종/운행구간/기사명 검색" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-80" />
          <Button className="w-full md:w-auto" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}>+ 차량 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'type', label: '차종' },
            { key: 'firstRegisteredAt', label: '최초 등록일' },
            { key: 'inspectionSchedule', label: '검사 일정' },
            { key: 'routeSection', label: '운행구간' },
            { key: 'driverName', label: '기사명' },
            { key: 'period', label: '기간' },
          ]}
          mobileCardRender={(row) => (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">차종</span><span>{row.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">최초 등록일</span><span>{row.firstRegisteredAt}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">검사 일정</span><span>{row.inspectionSchedule}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">운행구간</span><span>{row.routeSection}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">기사명</span><span>{row.driverName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">기간</span><span>{row.period}</span></div>
              <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ type: row.type, firstRegisteredAt: row.firstRegisteredAt, inspectionSchedule: row.inspectionSchedule, routeSection: row.routeSection, driverName: row.driverName, period: row.period }); setOpen(true); }}>수정</Button></div>
            </div>
          )}
          actions={(row) => (
            <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ type: row.type, firstRegisteredAt: row.firstRegisteredAt, inspectionSchedule: row.inspectionSchedule, routeSection: row.routeSection, driverName: row.driverName, period: row.period }); setOpen(true); }}>수정</Button>
          )}
        />

        <ModalForm open={open} onOpenChange={setOpen} title={editing ? '차량 수정' : '차량 추가'} onSubmit={saveVehicle}>
          <FormField label="차종" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} /></FormField>
          <FormField label="최초 등록일" required><input type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.firstRegisteredAt} onChange={(e) => setForm((prev) => ({ ...prev, firstRegisteredAt: e.target.value }))} /></FormField>
          <FormField label="검사 일정" required><input type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.inspectionSchedule} onChange={(e) => setForm((prev) => ({ ...prev, inspectionSchedule: e.target.value }))} /></FormField>
          <FormField label="운행구간" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.routeSection} onChange={(e) => setForm((prev) => ({ ...prev, routeSection: e.target.value }))} /></FormField>
          <FormField label="기사명" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.driverName} onChange={(e) => setForm((prev) => ({ ...prev, driverName: e.target.value }))} /></FormField>
          <FormField label="기간" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.period} onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))} placeholder="예: 2026-04-01 ~ 2026-12-31" /></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
