'use client';
import React from 'react';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { ModalForm } from '@/components/crud/modal-form';
import { FormField } from '@/components/crud/form-field';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories } from '@/lib/repository';
import { Client } from '@/lib/schemas';
import { ensureSeedData } from '@/lib/seed';
import { getStatusLabel } from '@/lib/labels';

const getClientBadgeVariant = (status: Client['status']): 'success' | 'secondary' => {
  if (status === 'active') return 'success';
  return 'secondary';
};

export default function ClientsPage() {
  const [rows, setRows] = React.useState<Client[]>([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Client | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = React.useState({ name: '', phone: '', address: '', status: 'active' as Client['status'] });

  const load = React.useCallback(() => setRows(repositories.clients.getAll()), []);

  React.useEffect(() => {
    ensureSeedData();
    load();
  }, [load]);

  const save = () => {
    if (editing) repositories.clients.update(editing.id, form);
    else repositories.clients.create({ ...form, createdAt: new Date().toISOString() });
    setOpen(false);
    setEditing(null);
    load();
  };

  const filtered = rows.filter((row) => {
    const q = search.toLowerCase();
    const bySearch = row.name.toLowerCase().includes(q) || row.phone.includes(search);
    const byStatus = statusFilter === 'all' || row.status === statusFilter;
    return bySearch && byStatus;
  });

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.clients')} />}>
      <PageContent>
        <Grid columns={3} className="mb-4 hidden md:grid">
          <StatCard label="전체 거래처" value={rows.length} />
          <StatCard label="활성" value={rows.filter((x) => x.status === 'active').length} />
          <StatCard label="비활성" value={rows.filter((x) => x.status === 'inactive').length} />
        </Grid>

        <div className="mb-4 grid gap-2 md:flex md:items-center md:justify-between">
          <div className="grid gap-2 md:flex">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="거래처명/전화번호 검색" className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-auto" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm md:w-auto">
              <option value="all">전체 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <Button className="w-full md:w-auto" onClick={() => { setEditing(null); setForm({ name: '', phone: '', address: '', status: 'active' }); setOpen(true); }}>+ 거래처 추가</Button>
        </div>

        <DataList
          data={filtered}
          actionsColumnClassName="w-[1%] whitespace-nowrap"
          columns={[
            { key: 'name', label: '거래처명' },
            { key: 'phone', label: '연락처' },
            { key: 'address', label: '주소' },
            { key: 'status', label: '상태', render: (v) => <Badge variant={getClientBadgeVariant(v)}>{getStatusLabel(String(v))}</Badge> },
          ]}
          mobileCardRender={(row) => (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">거래처</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{row.name}</span>
                  <Badge variant={getClientBadgeVariant(row.status)}>{getStatusLabel(row.status)}</Badge>
                </div>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">연락처</span>
                <span className="text-sm text-foreground">{row.phone}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">주소</span>
                <span className="text-right text-sm text-foreground">{row.address}</span>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ name: row.name, phone: row.phone, address: row.address, status: row.status }); setOpen(true); }}>수정</Button>
                <Button size="sm" variant="outline" onClick={() => { repositories.clients.update(row.id, { status: 'inactive' }); load(); }}>비활성화</Button>
              </div>
            </div>
          )}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { setEditing(row); setForm({ name: row.name, phone: row.phone, address: row.address, status: row.status }); setOpen(true); }}>수정</Button>
              <Button size="sm" variant="outline" onClick={() => { repositories.clients.update(row.id, { status: 'inactive' }); load(); }}>비활성화</Button>
            </div>
          )}
        />

        <ModalForm isOpen={open} onOpenChange={setOpen} onSubmit={save} title={editing ? '거래처 수정' : '거래처 추가'} submitLabel={editing ? '수정' : '추가'}>
          <FormField label="거래처명" required><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="연락처" required><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="주소" required><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border border-input px-3 py-2 text-sm" /></FormField>
          <FormField label="상태"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Client['status'] })} className="w-full rounded-lg border border-input px-3 py-2 text-sm"><option value="active">활성</option><option value="inactive">비활성</option></select></FormField>
        </ModalForm>
      </PageContent>
    </SidebarLayout>
  );
}
