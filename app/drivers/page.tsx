'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatDate, getStatusLabel } from '@/lib/formatters';
import { Driver } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';



export default function DriversPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingDriver, setEditingDriver] = React.useState<Driver | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    licenseNumber: '',
    status: 'active' as const,
    joinDate: new Date(),
    bankAccount: '',
    accountHolder: '',
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // 삭제 state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingDriver, setDeletingDriver] = React.useState<Driver | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive' | 'on-leave'>('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadDrivers();
  }, [router]);

  const loadDrivers = () => {
    setDrivers(repositories.drivers.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t('common.required');
    if (!formData.phone.trim()) errors.phone = t('common.required');
    if (!formData.licenseNumber.trim()) errors.licenseNumber = t('common.required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        joinDate: driver.joinDate,
        bankAccount: driver.bankAccount || '',
        accountHolder: driver.accountHolder || '',
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        licenseNumber: '',
        status: 'active',
        joinDate: new Date(),
        bankAccount: '',
        accountHolder: '',
      });
    }
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleSaveDriver = () => {
    if (!validateForm()) return;

    try {
      if (editingDriver) {
        repositories.drivers.update(editingDriver.id, {
          ...formData,
        });
        toast.success('기사 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.drivers.create({
          ...formData,
        } as Omit<Driver, 'id'>);
        toast.success('기사 등록 완료', '새 기사가 추가되었습니다');
      }
      loadDrivers();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('기사 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (driver: Driver) => {
    setDeletingDriver(driver);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingDriver) return;
    try {
      repositories.drivers.delete(deletingDriver.id);
      toast.success('기사 삭제 완료', '기사가 삭제되었습니다');
      loadDrivers();
      setDeleteDialogOpen(false);
      setDeletingDriver(null);
    } catch (error) {
      toast.error('기사 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.phone.includes(searchTerm) ||
                         d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = drivers.filter(d => d.status === 'active').length;
  const onLeaveCount = drivers.filter(d => d.status === 'on-leave').length;
  const inactiveCount = drivers.filter(d => d.status === 'inactive').length;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.drivers')}
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
        <Grid columns={4} gap="md" className="mb-8">
          <StatCard label="전체 기사" value={drivers.length} icon="👤" />
          <StatCard label="활성" value={activeCount} icon="✅" />
          <StatCard label="휴무" value={onLeaveCount} icon="⏰" />
          <StatCard label="비활성" value={inactiveCount} icon="❌" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="기사 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">{t('common.all')} {t('common.status')}</option>
              <option value="active">활성</option>
              <option value="on-leave">휴무</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + 기사 추가
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Driver>
          data={filteredDrivers}
          isLoading={loading}
          columns={[
            {
              key: 'name',
              label: '이름',
              render: (value) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'phone',
              label: '연락처',
            },
            {
              key: 'licenseNumber',
              label: '면허번호',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'joinDate',
              label: '입사일',
              render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
            },
            {
              key: 'status',
              label: '상태',
              render: (value) => {
                const variantMap = {
                  active: 'default',
                  'on-leave': 'warning',
                  inactive: 'secondary',
                } as const;
                return (
                  <Badge variant={variantMap[value as keyof typeof variantMap]}>
                    {getStatusLabel(value)}
                  </Badge>
                );
              },
            },
          ]}
          actions={(driver) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(driver)}
              >
                수정
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(driver)}
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
        title={editingDriver ? '기사 수정' : '기사 추가'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveDriver}
        submitLabel={editingDriver ? '수정' : '추가'}
      >
        <FormField
          label="기사명"
          error={formErrors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="기사명을 입력하세요"
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
            placeholder="010-1234-5678"
          />
        </FormField>

        <FormField
          label="면허번호"
          error={formErrors.licenseNumber}
          required
        >
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: 면허번호를 입력하세요"
          />
        </FormField>

        <FormField
          label="입사일"
          required
        >
          <input
            type="date"
            value={formData.joinDate instanceof Date ? formData.joinDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({...formData, joinDate: new Date(e.target.value)})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField
          label="계좌번호"
          help="선택 사항: 급여 정산에 사용됩니다"
        >
          <input
            type="text"
            value={formData.bankAccount}
            onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="123-456-789012"
          />
        </FormField>

        <FormField
          label="예금주"
          help="선택 사항: 예금주명을 입력하세요"
        >
          <input
            type="text"
            value={formData.accountHolder}
            onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예금주를 입력하세요"
          />
        </FormField>

        <FormField label="상태" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'on-leave'})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">활성</option>
            <option value="on-leave">휴무</option>
            <option value="inactive">비활성</option>
          </select>
        </FormField>
      </ModalForm>

      {/* 삭제 Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="기사"
        displayValue={deletingDriver?.name || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
