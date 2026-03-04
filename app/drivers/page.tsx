'use client';
import React from 'react';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories } from '@/lib/repository';
import { Driver } from '@/lib/schemas';

export default function DriversPage() {
  const [rows, setRows] = React.useState<Driver[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Driver | null>(null);
  const [form, setForm] = React.useState({ name: '', phone: '', licenseNumber: '', status: 'active' as Driver['status'], defaultRouteId: '', resignedAt: '' });
  const routes = repositories.routes.getAll().filter((r) => r.status === 'active');
  const load = () => setRows(repositories.drivers.getAll());
  React.useEffect(() => load(), []);

  const save = () => {
    const payload = { ...form, defaultRouteId: form.defaultRouteId || undefined, resignedAt: form.resignedAt || undefined };
    if (payload.status === 'resigned' && !payload.resignedAt) payload.resignedAt = new Date().toISOString().slice(0, 10);
    if (editing) repositories.drivers.update(editing.id, payload);
    else repositories.drivers.create({ ...payload, joinDate: new Date().toISOString() });
    setOpen(false); load();
  };

  return <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.drivers')} />}>
    <PageContent>
      <div className='mb-4'><Button onClick={() => { setEditing(null); setForm({ name: '', phone: '', licenseNumber: '', status: 'active', defaultRouteId: '', resignedAt: '' }); setOpen(true); }}>+ 기사 추가</Button></div>
      <DataList data={rows} columns={[
        { key: 'name', label: '이름' }, { key: 'defaultRouteId', label: '기본 노선', render: (v) => repositories.routes.getById(String(v))?.name ?? '-' }, { key: 'status', label: '상태', render: (v) => <Badge>{String(v)}</Badge> },
      ]} actions={(r) => <div className='flex gap-2'><Button size='sm' variant='outline' onClick={() => { setEditing(r); setForm({ name: r.name, phone: r.phone, licenseNumber: r.licenseNumber, status: r.status, defaultRouteId: r.defaultRouteId ?? '', resignedAt: r.resignedAt ?? '' }); setOpen(true); }}>수정</Button><Button size='sm' variant='outline' onClick={() => { repositories.drivers.update(r.id, { status: 'inactive' }); load(); }}>비활성화</Button></div>} />
      <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '기사 수정' : '기사 추가'}>
        <FormField label='이름'><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='연락처'><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='면허번호'><input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='기본 노선'><select value={form.defaultRouteId} onChange={(e) => setForm({ ...form, defaultRouteId: e.target.value })} className='w-full rounded border px-3 py-2'><option value=''>미지정</option>{routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></FormField>
        <FormField label='상태'><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })} className='w-full rounded border px-3 py-2'><option value='active'>active</option><option value='leave'>leave</option><option value='resigned'>resigned</option><option value='inactive'>inactive</option></select></FormField>
      </ModalForm>
    </PageContent>
  </SidebarLayout>;
}
