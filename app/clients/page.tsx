'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, PageHeader, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/formatters';
import { Client } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';



export default function ClientsPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Form state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingClient, set수정ingClient] = React.useState<Client | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    address: '',
    status: 'active' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  
  // 삭제 state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingClient, setDeletingClient] = React.useState<Client | null>(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadClients();
  }, [router]);

  const loadClients = () => {
    setClients(repositories.clients.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('common.required');
    if (!formData.phone.trim()) errors.phone = t('common.required');
    if (!formData.address.trim()) errors.address = t('common.required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (client?: Client) => {
    if (client) {
      set수정ingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        address: client.address,
        status: client.status,
      });
    } else {
      set수정ingClient(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        status: 'active',
      });
    }
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleSaveClient = () => {
    if (!validateForm()) return;

    try {
      if (editingClient) {
        repositories.clients.update(editingClient.id, {
          ...formData,
        });
        toast.success('거래처 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.clients.create({
          ...formData,
        } as Omit<Client, 'id' | 'createdAt'>);
        toast.success('거래처 등록 완료', '새 거래처가 추가되었습니다');
      }
      loadClients();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('거래처 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingClient) return;
    try {
      repositories.clients.delete(deletingClient.id);
      toast.success('거래처 삭제 완료', '거래처가 삭제되었습니다');
      loadClients();
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (error) {
      toast.error('거래처 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = clients.filter(c => c.status === 'active').length;
  const inactiveCount = clients.filter(c => c.status === 'inactive').length;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.clients')}
          rightContent={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </button>
          }
        />
      }
    >
      <PageContent>
        {/* Stats */}
        <Grid columns={3} gap="md" className="mb-8">
          <StatCard label={`${t('nav.clients')} 수`} value={clients.length} icon="👥" />
          <StatCard label="활성 거래처" value={activeCount} icon="✅" />
          <StatCard label="비활성 거래처" value={inactiveCount} icon="⏸" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="거래처 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">{t('common.all')} {t('common.status')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="inactive">{t('status.inactive')}</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + 거래처 추가
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Client>
          data={filteredClients}
          isLoading={loading}
          columns={[
            {
              key: 'name',
              label: '거래처명',
              render: (value) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'phone',
              label: '연락처',
            },
            {
              key: 'address',
              label: '주소',
              render: (value) => <span className="truncate text-sm">{value}</span>,
            },
            {
              key: 'status',
              label: '상태',
              render: (value) => (
                <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                  {getStatusLabel(value)}
                </Badge>
              ),
            },
            {
              key: 'createdAt',
              label: '등록일',
              render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
            },
          ]}
          actions={(client) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(client)}
              >
                수정
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(client)}
              >
                삭제
              </Button>
            </div>
          )}
        />
      </PageContent>

      {/* Create/수정 Form Modal */}
      <ModalForm
        isOpen={isDrawerOpen}
        title={editingClient ? '거래처 수정' : '거래처 추가'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveClient}
        submitLabel={editingClient ? '수정' : '추가'}
      >
        <FormField
          label="거래처명"
          error={formErrors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="거래처명을 입력하세요"
          />
        </FormField>

        <FormField
          label="연락처"
          error={formErrors.phone}
          required
        >
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="02-1234-5678"
          />
        </FormField>

        <FormField
          label="주소"
          error={formErrors.address}
          required
        >
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="주소를 입력하세요"
          />
        </FormField>

        <FormField label="상태" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </select>
        </FormField>
      </ModalForm>

      {/* 삭제 Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="거래처"
        displayValue={deletingClient?.name || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
