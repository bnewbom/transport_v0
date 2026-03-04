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
import { Route } from '@/lib/schemas';
import { formatKRW } from '@/lib/formatters';

export default function RoutesPage() {
  const [rows, setRows] = React.useState<Route[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Route | null>(null);
  const [form, setForm] = React.useState({ name: '', startLocation: '', endLocation: '', distance: 0, estimatedTime: 0, baseRate: 0, weekdayMask: 62, shiftType: 'day' as Route['shiftType'], baseAllowanceAmount: 0, effectiveFrom: '', effectiveTo: '', status: 'active' as Route['status'] });
  const load = () => setRows(repositories.routes.getAll());
  React.useEffect(() => load(), []);

  const save = () => {
    const payload = { ...form, effectiveFrom: form.effectiveFrom || undefined, effectiveTo: form.effectiveTo || undefined };
    if (editing) repositories.routes.update(editing.id, payload);
    else repositories.routes.create(payload);
    setOpen(false); load();
  };

  return <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.routes')} />}>
    <PageContent>
      <div className='mb-4'><Button onClick={() => { setEditing(null); setOpen(true); }}>+ 노선 추가</Button></div>
      <DataList data={rows} columns={[
        { key: 'name', label: '노선' },
        { key: 'weekdayMask', label: '요일마스크' },
        { key: 'shiftType', label: '근무' },
        { key: 'baseAllowanceAmount', label: '기본수당', render: (v) => formatKRW(Number(v)) },
        { key: 'status', label: '상태', render: (v) => <Badge>{String(v)}</Badge> },
      ]} actions={(r) => <div className='flex gap-2'><Button size='sm' variant='outline' onClick={() => { setEditing(r); setForm({ ...form, ...r, effectiveFrom: r.effectiveFrom ?? '', effectiveTo: r.effectiveTo ?? '' }); setOpen(true); }}>수정</Button><Button size='sm' variant='outline' onClick={() => { repositories.routes.update(r.id, { status: 'inactive' }); load(); }}>비활성화</Button></div>} />
      <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '노선 수정' : '노선 추가'}>
        <FormField label='노선명'><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='출발/도착'><div className='flex gap-2'><input value={form.startLocation} onChange={(e) => setForm({ ...form, startLocation: e.target.value })} className='w-full rounded border px-3 py-2' /><input value={form.endLocation} onChange={(e) => setForm({ ...form, endLocation: e.target.value })} className='w-full rounded border px-3 py-2' /></div></FormField>
        <FormField label='weekday_mask'><input type='number' value={form.weekdayMask} onChange={(e) => setForm({ ...form, weekdayMask: Number(e.target.value) })} className='w-full rounded border px-3 py-2' /></FormField>
        <FormField label='shift'><select value={form.shiftType} onChange={(e) => setForm({ ...form, shiftType: e.target.value as Route['shiftType'] })} className='w-full rounded border px-3 py-2'><option value='day'>day</option><option value='night'>night</option></select></FormField>
        <FormField label='base_allowance_amount'><input type='number' value={form.baseAllowanceAmount} onChange={(e) => setForm({ ...form, baseAllowanceAmount: Number(e.target.value) })} className='w-full rounded border px-3 py-2' /></FormField>
      </ModalForm>
    </PageContent>
  </SidebarLayout>;
}
