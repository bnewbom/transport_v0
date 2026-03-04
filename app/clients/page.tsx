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
import { Client } from '@/lib/schemas';

export default function ClientsPage() {
  const [rows, setRows] = React.useState<Client[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [form, setForm] = React.useState({ name: '', phone: '', address: '', status: 'active' as Client['status'] });
  const load = () => setRows(repositories.clients.getAll());
  React.useEffect(() => load(), []);

  const save = () => {
    if (editing) repositories.clients.update(editing.id, form);
    else repositories.clients.create({ ...form, createdAt: new Date().toISOString() });
    setOpen(false); setEditing(null); load();
  };

  return <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.clients')} />}>
    <PageContent>
      <div className='mb-4'><Button onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '', status: 'active' }); setOpen(true); }}>+ 거래처 추가</Button></div>
      <DataList data={rows} columns={[
        { key: 'name', label: '거래처명' }, { key: 'phone', label: '연락처' }, { key: 'status', label: '상태', render: (v) => <Badge>{String(v)}</Badge> },
      ]} actions={(r) => <div className='flex gap-2'><Button size='sm' variant='outline' onClick={() => { setEditing(r); setForm({ name: r.name, phone: r.phone, address: r.address, status: r.status }); setOpen(true); }}>수정</Button><Button size='sm' variant='outline' onClick={() => { repositories.clients.update(r.id, { status: 'inactive' }); load(); }}>비활성화</Button></div>} />
      <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '거래처 수정' : '거래처 추가'}>
        <FormField label='거래처명'><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='연락처'><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='주소'><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
      </ModalForm>
    </PageContent>
  </SidebarLayout>;
}
