'use client';
import React from 'react';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
<<<<<<< codex/implement-mvp-features-for-transport-saas-4qlv1t
import { PageContent, StatCard } from '@/components/layout-shell';
=======
import { PageContent } from '@/components/layout-shell';
>>>>>>> main
import { DataList, Badge } from '@/components/data-list';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories, recordChangeLog } from '@/lib/repository';
import { Driver } from '@/lib/schemas';
import { ensureSeedData } from '@/lib/seed';
import { getDriverStatusLabel } from '@/lib/labels';
import { useAppToast } from '@/components/crud/toast';

export default function DriversPage() {
  const toast = useAppToast();
  const [rows, setRows] = React.useState<Driver[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Driver | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | Driver['status']>('all');
  const [savingRouteById, setSavingRouteById] = React.useState<Record<string, boolean>>({});
  const [form, setForm] = React.useState({ name: '', phone: '', licenseNumber: '', status: 'active' as Driver['status'], defaultRouteId: '', resignedAt: '' });

  const activeRoutes = React.useMemo(() => repositories.routes.getAll().filter((r) => r.status === 'active'), [rows]);
  const load = React.useCallback(() => setRows(repositories.drivers.getAll()), []);

  React.useEffect(() => {
    ensureSeedData();
    load();
  }, [load]);

  const save = () => {
    const payload = { ...form, defaultRouteId: form.defaultRouteId || undefined, resignedAt: form.resignedAt || undefined };
    if (payload.status === 'resigned' && !payload.resignedAt) payload.resignedAt = new Date().toISOString().slice(0, 10);
    if (editing) repositories.drivers.update(editing.id, payload);
    else repositories.drivers.create({ ...payload, joinDate: new Date().toISOString() });
    setOpen(false);
    load();
  };

  const handleInlineDefaultRoute = async (driver: Driver, routeId: string) => {
    const before = { ...driver };
    setSavingRouteById((prev) => ({ ...prev, [driver.id]: true }));
    try {
      const updated = repositories.drivers.update(driver.id, { defaultRouteId: routeId || undefined });
      if (!updated) throw new Error('update failed');
      recordChangeLog({ entityType: 'driver', entityId: driver.id, action: 'update', before, after: updated });
      toast.success('기본 노선 변경 완료');
      load();
    } catch {
      toast.error('기본 노선 변경 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setSavingRouteById((prev) => ({ ...prev, [driver.id]: false }));
    }
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
<<<<<<< codex/implement-mvp-features-for-transport-saas-4qlv1t
        <div className="mb-4 grid gap-4 md:grid-cols-4">
=======
        <Grid columns={4} className="mb-4">
>>>>>>> main
          <StatCard label="전체 기사" value={rows.length} />
          <StatCard label="재직" value={rows.filter((x) => x.status === 'active').length} />
          <StatCard label="휴직" value={rows.filter((x) => x.status === 'leave' || x.status === 'on-leave').length} />
          <StatCard label="퇴사/비활성" value={rows.filter((x) => x.status === 'resigned' || x.status === 'inactive').length} />
<<<<<<< codex/implement-mvp-features-for-transport-saas-4qlv1t
        </div>
=======
        </Grid>
>>>>>>> main

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
          <Button onClick={() => { setEditing(null); setForm({ name: '', phone: '', licenseNumber: '', status: 'active', defaultRouteId: '', resignedAt: '' }); setOpen(true); }}>+ 기사 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'name', label: '이름' },
            { key: 'phone', label: '연락처' },
            {
              key: 'defaultRouteId',
              label: '기본노선',
              render: (_, row) => (
                <select
                  value={row.defaultRouteId ?? ''}
                  onChange={(e) => handleInlineDefaultRoute(row, e.target.value)}
                  disabled={Boolean(savingRouteById[row.id])}
                  className="w-44 rounded-lg border border-input bg-background px-2 py-1 text-sm disabled:opacity-60"
                >
                  <option value="">미지정</option>
                  {activeRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
                </select>
              ),
            },
            { key: 'status', label: '상태', render: (v) => <Badge>{getDriverStatusLabel(v)}</Badge> },
          ]}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ name: row.name, phone: row.phone, licenseNumber: row.licenseNumber, status: row.status, defaultRouteId: row.defaultRouteId ?? '', resignedAt: row.resignedAt ? String(row.resignedAt).slice(0, 10) : '' }); setOpen(true); }}>수정</Button>
              <Button size="sm" variant="outline" onClick={() => { repositories.drivers.update(row.id, { status: 'inactive' }); load(); toast.success('기사 비활성화 완료'); }}>비활성화</Button>
            </div>
          )}
        />

        <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '기사 수정' : '기사 추가'} submitLabel={editing ? '수정' : '추가'}>
          <FormField label="이름" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="연락처" required><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="면허번호" required><input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="기본 노선"><select value={form.defaultRouteId} onChange={(e) => setForm({ ...form, defaultRouteId: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="">미지정</option>{activeRoutes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></FormField>
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">재직</option><option value="leave">휴직</option><option value="resigned">퇴사</option><option value="inactive">비활성</option></select></FormField>
          <FormField label="퇴사일(선택)"><input type="date" value={form.resignedAt} onChange={(e) => setForm({ ...form, resignedAt: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
