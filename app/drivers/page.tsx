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
import { Driver } from '@/lib/schemas';
import { ensureSeedData } from '@/lib/seed';
import { getDriverStatusLabel } from '@/lib/labels';
import { useAppToast } from '@/components/crud/toast';

const getDriverStatusOrder = (status: Driver['status']) => {
  if (status === 'active') return 0;
  if (status === 'leave' || status === 'on-leave') return 1;
  return 2;
};

const getDriverBadgeVariant = (status: Driver['status']): 'success' | 'warning' | 'destructive' => {
  if (status === 'active') return 'success';
  if (status === 'leave' || status === 'on-leave') return 'warning';
  return 'destructive';
};

export default function DriversPage() {
  const router = useRouter();
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
  const [savingRouteByKey, setSavingRouteByKey] = React.useState<Record<string, boolean>>({});
  const [form, setForm] = React.useState<DriverFormState>(buildFormState(null));
  const [isAuthorized, setIsAuthorized] = React.useState(false);

  const allRoutes = React.useMemo(() => repositories.routes.getAll(), [rows]);
  const activeRoutes = React.useMemo(() => repositories.routes.getAll().filter((r) => r.status === 'active'), [rows]);
  const load = React.useCallback(() => {
    setRows(repositories.drivers.getAll());
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

  const handleInlineRouteChange = (driver: Driver, routeIndex: number, routeId: string) => {
    const routeKey = `${driver.id}-${routeIndex}`;
    setSavingRouteByKey((prev) => ({ ...prev, [routeKey]: true }));
    try {
      const currentRouteIds = driver.routeIds?.length ? [...driver.routeIds] : [driver.defaultRouteId ?? ''];
      while (currentRouteIds.length <= routeIndex) currentRouteIds.push('');
      currentRouteIds[routeIndex] = routeId;
      const normalizedRouteIds = Array.from(new Set(currentRouteIds.map((id) => id.trim()).filter(Boolean)));
      repositories.drivers.update(driver.id, {
        routeIds: normalizedRouteIds.length ? normalizedRouteIds : undefined,
        defaultRouteId: normalizedRouteIds[0] || undefined,
      });
      load();
      toast.success('노선이 바로 반영되었습니다.');
    } catch {
      toast.error('노선 수정 실패', '잠시 후 다시 시도해주세요.');
    } finally {
      setSavingRouteByKey((prev) => ({ ...prev, [routeKey]: false }));
    }
  };

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    const bySearch = row.name.toLowerCase().includes(q) || row.phone.includes(search);
    const byStatus = statusFilter === 'all' || row.status === statusFilter;
    return bySearch && byStatus;
  }).sort((left, right) => {
    const byStatus = getDriverStatusOrder(left.status) - getDriverStatusOrder(right.status);
    if (byStatus !== 0) return byStatus;
    return left.name.localeCompare(right.name, 'ko');
  });

  const renderRouteSelector = React.useCallback((row: Driver) => {
    const rowRouteIds = row.routeIds?.length ? row.routeIds : row.defaultRouteId ? [row.defaultRouteId] : [''];
    return (
      <div className="space-y-2">
        {rowRouteIds.map((routeId, idx) => {
          const selectedByOthers = new Set(rowRouteIds.filter((_, i) => i !== idx).filter(Boolean));
          const selectableRoutes = allRoutes.filter((route) => !selectedByOthers.has(route.id));
          const routeKey = `${row.id}-${idx}`;
          return (
            <div key={`${row.id}-${routeId || 'empty'}-${idx}`}>
              <select
                value={routeId}
                onChange={(e) => handleInlineRouteChange(row, idx, e.target.value)}
                disabled={Boolean(savingRouteByKey[routeKey])}
                className="block w-56 rounded-lg border border-input bg-background px-2 py-1 text-sm disabled:opacity-70"
              >
                <option value="">미지정</option>
                {selectableRoutes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    );
  }, [allRoutes, savingRouteByKey]);

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.drivers')} />}>
      <PageContent>
        <div className="mb-4 hidden gap-4 md:grid md:grid-cols-4">
          <StatCard label="전체 기사" value={rows.length} />
          <StatCard label="재직" value={rows.filter((x) => x.status === 'active').length} />
          <StatCard label="휴직" value={rows.filter((x) => x.status === 'leave' || x.status === 'on-leave').length} />
          <StatCard label="퇴사" value={rows.filter((x) => x.status === 'resigned').length} />
        </div>

        <div className="mb-4 grid gap-2 md:flex md:items-center md:justify-between">
          <div className="grid gap-2 md:flex">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="기사명/전화번호 검색" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-auto" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-auto">
              <option value="all">전체 상태</option>
              <option value="active">재직</option>
              <option value="leave">휴직</option>
              <option value="resigned">퇴사</option>
            </select>
          </div>
          <Button className="w-full md:w-auto" onClick={() => { setEditing(null); setForm(buildFormState(null)); setOpen(true); }}>+ 기사 추가</Button>
        </div>

        <DataList
          data={filtered}
          columns={[
            { key: 'name', label: '이름' },
            { key: 'phone', label: '연락처' },
            {
              key: 'defaultRouteId',
              label: '노선',
              render: (_, row) => renderRouteSelector(row),
            },
            { key: 'status', label: '상태', render: (v) => <Badge variant={getDriverBadgeVariant(v)}>{getDriverStatusLabel(v)}</Badge> },
          ]}
          mobileCardRender={(row) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">이름</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{row.name}</span>
                  <Badge variant={getDriverBadgeVariant(row.status)}>{getDriverStatusLabel(row.status)}</Badge>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">연락처</span>
                <span className="text-sm text-foreground">{row.phone}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">노선</span>
                <div>{renderRouteSelector(row)}</div>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm(buildFormState(row)); setOpen(true); }}>수정</Button>
                {row.status !== 'resigned' && (
                  <Button size="sm" variant="destructive" onClick={() => { repositories.drivers.update(row.id, { status: 'resigned', resignedAt: new Date().toISOString().slice(0, 10) }); load(); toast.success('기사 퇴사 처리 완료'); }}>퇴사</Button>
                )}
              </div>
            </div>
          )}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm(buildFormState(row)); setOpen(true); }}>수정</Button>
              {row.status !== 'resigned' && (
                <Button size="sm" variant="destructive" onClick={() => { repositories.drivers.update(row.id, { status: 'resigned', resignedAt: new Date().toISOString().slice(0, 10) }); load(); toast.success('기사 퇴사 처리 완료'); }}>퇴사</Button>
              )}
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
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">재직</option><option value="leave">휴직</option><option value="resigned">퇴사</option></select></FormField>
          <FormField label="퇴사일(선택)"><input type="date" value={form.resignedAt} onChange={(e) => setForm({ ...form, resignedAt: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
