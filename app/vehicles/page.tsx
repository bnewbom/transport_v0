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
import { repositories } from '@/lib/repository';
import { ensureSeedData } from '@/lib/seed';

type VehicleRow = {
  id: string;
  type: string;
  firstRegisteredAt: string;
  inspectionSchedule: string;
  routeId: string;
  driverId: string;
  period: string;
};

type VehicleForm = Omit<VehicleRow, 'id'>;

const emptyForm: VehicleForm = {
  type: '',
  firstRegisteredAt: '',
  inspectionSchedule: '',
  routeId: '',
  driverId: '',
  period: '',
};

export default function VehiclesPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [rows, setRows] = React.useState<VehicleRow[]>([]);
  const [search, setSearch] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<VehicleRow | null>(null);
  const [form, setForm] = React.useState<VehicleForm>(emptyForm);

  const allRoutes = React.useMemo(() => repositories.routes.getAll().filter((x) => x.status === 'active'), [rows]);
  const allDrivers = React.useMemo(() => repositories.drivers.getAll().filter((x) => x.status === 'active'), [rows]);

  const routeMap = React.useMemo(() => new Map(allRoutes.map((route) => [route.id, route.name])), [allRoutes]);
  const driverMap = React.useMemo(() => new Map(allDrivers.map((driver) => [driver.id, driver.name])), [allDrivers]);

  React.useEffect(() => {
    if (!localStorage.getItem('auth')) {
      router.replace('/login');
      return;
    }
    ensureSeedData();
    setIsAuthorized(true);
    setRows([
      {
        id: 'vehicle-1',
        type: '45인승 통근버스',
        firstRegisteredAt: '2023-03-15',
        inspectionSchedule: '2026-06-05',
        routeId: repositories.routes.getAll()[0]?.id ?? '',
        driverId: repositories.drivers.getAll()[0]?.id ?? '',
        period: '2026-04-01 ~ 2026-12-31',
      },
    ]);
  }, [router]);

  if (!isAuthorized) return null;

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    const routeName = routeMap.get(row.routeId) ?? '';
    const driverName = driverMap.get(row.driverId) ?? '';
    return row.type.toLowerCase().includes(q) || routeName.toLowerCase().includes(q) || driverName.toLowerCase().includes(q);
  });

  const saveVehicle = () => {
    if (!form.routeId || !form.driverId) return;
    if (editing) setRows((prev) => prev.map((row) => (row.id === editing.id ? { ...row, ...form } : row)));
    else setRows((prev) => [...prev, { id: `vehicle-${Date.now()}`, ...form }]);
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.vehicles')} />}>
      <PageContent>
        <div className="mb-4 hidden gap-4 md:grid md:grid-cols-3">
          <StatCard label="전체 차량" value={rows.length} />
          <StatCard label="이번 달 검사 예정" value={rows.filter((x) => x.inspectionSchedule.slice(0, 7) === new Date().toISOString().slice(0, 7)).length} />
          <StatCard label="배정 기사 수" value={new Set(rows.map((x) => x.driverId).filter(Boolean)).size} />
        </div>

        <div className="mb-4 grid gap-2 md:flex md:items-center md:justify-between">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="차종/운행구간/기사명 검색" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-80" />
          <Button className="w-full md:w-auto" onClick={() => { setEditing(null); setForm(emptyForm); setIsOpen(true); }}>+ 차량 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'type', label: '차종' },
            { key: 'firstRegisteredAt', label: '최초 등록일' },
            { key: 'inspectionSchedule', label: '검사 일정' },
            { key: 'routeId', label: '운행구간', render: (v) => routeMap.get(v) ?? '-' },
            { key: 'driverId', label: '기사명', render: (v) => driverMap.get(v) ?? '-' },
            { key: 'period', label: '기간' },
          ]}
          actions={(row) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(row);
                setForm({
                  type: row.type,
                  firstRegisteredAt: row.firstRegisteredAt,
                  inspectionSchedule: row.inspectionSchedule,
                  routeId: row.routeId,
                  driverId: row.driverId,
                  period: row.period,
                });
                setIsOpen(true);
              }}
            >
              수정
            </Button>
          )}
        />

        <ModalForm isOpen={isOpen} onOpenChange={setIsOpen} title={editing ? '차량 수정' : '차량 추가'} onSubmit={saveVehicle}>
          <FormField label="차종" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} /></FormField>
          <FormField label="최초 등록일" required><input type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.firstRegisteredAt} onChange={(e) => setForm((prev) => ({ ...prev, firstRegisteredAt: e.target.value }))} /></FormField>
          <FormField label="검사 일정" required><input type="date" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.inspectionSchedule} onChange={(e) => setForm((prev) => ({ ...prev, inspectionSchedule: e.target.value }))} /></FormField>
          <FormField label="운행구간" required>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.routeId} onChange={(e) => setForm((prev) => ({ ...prev, routeId: e.target.value }))}>
              <option value="">노선 선택</option>
              {allRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </FormField>
          <FormField label="기사명" required>
            <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.driverId} onChange={(e) => setForm((prev) => ({ ...prev, driverId: e.target.value }))}>
              <option value="">기사 선택</option>
              {allDrivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
            </select>
          </FormField>
          <FormField label="기간" required><input className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.period} onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))} placeholder="예: 2026-04-01 ~ 2026-12-31" /></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
