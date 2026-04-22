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
import { Driver } from '@/lib/schemas';
import { ensureSeedData } from '@/lib/seed';
import { getDriverStatusLabel } from '@/lib/labels';
import { useAppToast } from '@/components/crud/toast';

export default function DriversPage() {
  const allowedDriverNames = React.useMemo(() => ['김민준', '이성호', '박지원'], []);
  type DriverFormState = {
    name: string;
    phone: string;
    licenseNumber: string;
    status: Driver['status'];
    routeIds: string[];
    resignedAt: string;
  };

  const buildFormState = React.useCallback((driver?: Driver | null): DriverFormState => {
    if (!driver) {
      return { name: '', phone: '', licenseNumber: '', status: 'active', routeIds: [''], resignedAt: '' };
    }
    const routeIds = driver.routeIds?.length ? driver.routeIds : [driver.defaultRouteId ?? ''];
    return {
      name: driver.name,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      routeIds: routeIds.length ? routeIds : [''],
      resignedAt: driver.resignedAt ? String(driver.resignedAt).slice(0, 10) : '',
    };
  }, []);

  const toast = useAppToast();
  const [rows, setRows] = React.useState<Driver[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Driver | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | Driver['status']>('all');
  const [form, setForm] = React.useState<DriverFormState>(buildFormState(null));

  const allRoutes = React.useMemo(() => repositories.routes.getAll(), [rows]);
  const activeRoutes = React.useMemo(() => repositories.routes.getAll().filter((r) => r.status === 'active'), [rows]);
  const load = React.useCallback(() => {
    const routeIds = repositories.routes.getAll().map((route) => route.id);
    const driverTemplates = [
      { name: '김민준', phone: '010-3000-0001', licenseNumber: 'LIC-KMJ-1001', defaultRouteId: routeIds[0] },
      { name: '이성호', phone: '010-3000-0002', licenseNumber: 'LIC-LSH-1002', defaultRouteId: routeIds[1] ?? routeIds[0] },
      { name: '박지원', phone: '010-3000-0003', licenseNumber: 'LIC-PJW-1003', defaultRouteId: routeIds[2] ?? routeIds[0] },
    ];

    driverTemplates.forEach((template) => {
      const exists = repositories.drivers.getAll().some((driver) => driver.name === template.name);
      if (!exists) {
        repositories.drivers.create({ ...template, status: 'active', joinDate: new Date().toISOString() });
      }
    });

    setRows(repositories.drivers.getAll().filter((driver) => allowedDriverNames.includes(driver.name)));
  }, [allowedDriverNames]);

  React.useEffect(() => {
    ensureSeedData();
    load();
  }, [load]);

  const save = () => {
    const normalizedRouteIds = Array.from(new Set(form.routeIds.map((id) => id.trim()).filter(Boolean)));
    const payload = {
      ...form,
      routeIds: normalizedRouteIds.length ? normalizedRouteIds : undefined,
      defaultRouteId: normalizedRouteIds[0] || undefined,
      resignedAt: form.resignedAt || undefined,
    };
    if (payload.status === 'resigned' && !payload.resignedAt) payload.resignedAt = new Date().toISOString().slice(0, 10);
    if (editing) repositories.drivers.update(editing.id, payload);
    else repositories.drivers.create({ ...payload, joinDate: new Date().toISOString() });
    setOpen(false);
    load();
  };

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    const bySearch = row.name.toLowerCase().includes(q) || row.phone.includes(search);
    const byStatus = statusFilter === 'all' || row.status === statusFilter;
    return bySearch && byStatus;
  });

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.drivers')} />}>
      <PageContent>
        <div className="mb-4 grid gap-4 md:grid-cols-4">
          <StatCard label="전체 기사" value={rows.length} />
          <StatCard label="재직" value={rows.filter((x) => x.status === 'active').length} />
          <StatCard label="휴직" value={rows.filter((x) => x.status === 'leave' || x.status === 'on-leave').length} />
          <StatCard label="퇴사/비활성" value={rows.filter((x) => x.status === 'resigned' || x.status === 'inactive').length} />
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="기사명/전화번호 검색" className="rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
              <option value="all">전체 상태</option>
              <option value="active">재직</option>
              <option value="leave">휴직</option>
              <option value="resigned">퇴사</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <Button onClick={() => { setEditing(null); setForm(buildFormState(null)); setOpen(true); }}>+ 기사 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'name', label: '이름' },
            { key: 'phone', label: '연락처' },
            {
              key: 'defaultRouteId',
              label: '노선',
              render: (_, row) => (
                <div className="space-y-1">
                  {(row.routeIds?.length ? row.routeIds : row.defaultRouteId ? [row.defaultRouteId] : ['']).map((routeId, idx) => (
                    <select
                      key={`${row.id}-${routeId || 'empty'}-${idx}`}
                      value={routeId}
                      disabled
                      className="w-56 rounded-lg border border-input bg-background px-2 py-1 text-sm disabled:opacity-100"
                    >
                      <option value="">미지정</option>
                      {allRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
                    </select>
                  ))}
                </div>
              ),
            },
            { key: 'status', label: '상태', render: (v) => <Badge>{getDriverStatusLabel(v)}</Badge> },
          ]}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm(buildFormState(row)); setOpen(true); }}>수정</Button>
              <Button size="sm" variant="outline" onClick={() => { repositories.drivers.update(row.id, { status: 'inactive' }); load(); toast.success('기사 비활성화 완료'); }}>비활성화</Button>
            </div>
          )}
        />

        <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '기사 수정' : '기사 추가'} submitLabel={editing ? '수정' : '추가'}>
          <FormField label="이름" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="연락처" required><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="면허번호" required><input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="기본 노선">
            <div className="space-y-2">
              {form.routeIds.map((routeId, idx) => {
                const selectedByOthers = new Set(form.routeIds.filter((_, i) => i !== idx).filter(Boolean));
                const selectableRoutes = activeRoutes.filter((route) => !selectedByOthers.has(route.id));
                return (
                  <div key={`driver-route-${idx}`} className="flex items-center gap-2">
                    <select
                      value={routeId}
                      onChange={(e) => setForm((prev) => ({ ...prev, routeIds: prev.routeIds.map((id, i) => (i === idx ? e.target.value : id)) }))}
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                    >
                      <option value="">미지정</option>
                      {selectableRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm((prev) => ({ ...prev, routeIds: [...prev.routeIds, ''] }))}
                      disabled={form.routeIds.length >= activeRoutes.length}
                    >
                      +
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => {
                          const nextRouteIds = prev.routeIds.filter((_, i) => i !== idx);
                          return { ...prev, routeIds: nextRouteIds.length ? nextRouteIds : [''] };
                        })
                      }
                      disabled={form.routeIds.length <= 1}
                    >
                      -
                    </Button>
                  </div>
                );
              })}
            </div>
          </FormField>
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">재직</option><option value="leave">휴직</option><option value="resigned">퇴사</option><option value="inactive">비활성</option></select></FormField>
          <FormField label="퇴사일(선택)"><input type="date" value={form.resignedAt} onChange={(e) => setForm({ ...form, resignedAt: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
