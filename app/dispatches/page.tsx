'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatDate, getStatusLabel } from '@/lib/formatters';
import { Dispatch } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';



export default function DispatchesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [dispatches, setDispatches] = React.useState<Dispatch[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDispatch, setEditingDispatch] = React.useState<Dispatch | null>(null);
  const [formData, setFormData] = React.useState({
    routeId: '',
    driverId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '09:00',
    status: 'pending' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // 삭제 state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingDispatch, setDeletingDispatch] = React.useState<Dispatch | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'>('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadDispatches();
  }, [router]);

  const loadDispatches = () => {
    setDispatches(repositories.dispatches.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.routeId.trim()) errors.routeId = t('common.required');
    if (!formData.driverId.trim()) errors.driverId = t('common.required');
    if (!formData.scheduledDate) errors.scheduledDate = t('common.required');
    if (!formData.scheduledTime) errors.scheduledTime = t('common.required');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (dispatch?: Dispatch) => {
    if (dispatch) {
      setEditingDispatch(dispatch);
      setFormData({
        routeId: dispatch.routeId,
        driverId: dispatch.driverId,
        scheduledDate: dispatch.scheduledDate instanceof Date ? dispatch.scheduledDate.toISOString().split('T')[0] : dispatch.scheduledDate,
        scheduledTime: dispatch.scheduledTime,
        status: dispatch.status,
      });
    } else {
      setEditingDispatch(null);
      setFormData({
        routeId: '',
        driverId: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        status: 'pending',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveDispatch = () => {
    if (!validateForm()) return;

    try {
      if (editingDispatch) {
        repositories.dispatches.update(editingDispatch.id, {
          ...formData,
          scheduledDate: new Date(formData.scheduledDate),
        });
        toast.success('배차 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.dispatches.create({
          ...formData,
          scheduledDate: new Date(formData.scheduledDate),
        } as Omit<Dispatch, 'id' | 'changeLogs'>);
        toast.success('배차 등록 완료', '새 배차가 등록되었습니다');
      }
      loadDispatches();
      setIsModalOpen(false);
    } catch {
      toast.error('배차 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (dispatch: Dispatch) => {
    setDeletingDispatch(dispatch);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingDispatch) return;
    try {
      repositories.dispatches.delete(deletingDispatch.id);
      toast.success('배차 삭제 완료', '배차가 삭제되었습니다');
      loadDispatches();
      setDeleteDialogOpen(false);
      setDeletingDispatch(null);
    } catch {
      toast.error('배차 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredDispatches = dispatches.filter(d => {
    const matchesSearch = d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.routeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.driverId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: dispatches.length,
    completed: dispatches.filter(d => d.status === 'completed').length,
    inProgress: dispatches.filter(d => d.status === 'in-progress').length,
    pending: dispatches.filter(d => d.status === 'pending').length,
    cancelled: dispatches.filter(d => d.status === 'cancelled').length,
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, any> = {
      'completed': 'default',
      'in-progress': 'warning',
      'pending': 'secondary',
      'confirmed': 'primary',
      'cancelled': 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.dispatches')}
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
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="전체" value={stats.total} icon="📦" />
          <StatCard label="완료" value={stats.completed} icon="✅" />
          <StatCard label="진행 중" value={stats.inProgress} icon="🔄" />
          <StatCard label="대기" value={stats.pending} icon="⏱" />
          <StatCard label="취소" value={stats.cancelled} icon="❌" />
        </div>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="배차 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기</option>
              <option value="confirmed">확정</option>
              <option value="in-progress">진행 중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + 배차 추가
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Dispatch>
          data={filteredDispatches}
          isLoading={loading}
          columns={[
            {
              key: 'id',
              label: '번호',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'routeId',
              label: '노선',
              render: (value) => <span className="text-sm font-medium">{value}</span>,
            },
            {
              key: 'driverId',
              label: '기사',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'scheduledDate',
              label: '날짜',
              render: (value) => <span className="text-sm">{formatDate(value)}</span>,
            },
            {
              key: 'scheduledTime',
              label: '시간',
              render: (value) => <span className="text-sm font-medium">{value}</span>,
            },
            {
              key: 'status',
              label: '상태',
              render: (value) => (
                <Badge variant={getStatusBadgeVariant(value)}>
                  {getStatusLabel(value)}
                </Badge>
              ),
            },
          ]}
          actions={(dispatch) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(dispatch)}
              >
                수정
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(dispatch)}
              >
                삭제
              </Button>
            </div>
          )}
        />
      </PageContent>

      {/* Create/수정 Form Modal */}
      <ModalForm
        isOpen={isModalOpen}
        title={editingDispatch ? '배차 수정' : '배차 추가'}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSaveDispatch}
        submitLabel={editingDispatch ? '수정' : '배차 등록'}
      >
        <FormField
          label="노선"
          error={formErrors.routeId}
          required
        >
          <input
            type="text"
            value={formData.routeId}
            onChange={(e) => setFormData({...formData, routeId: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="노선 ID를 입력하세요"
          />
        </FormField>

        <FormField
          label="기사"
          error={formErrors.driverId}
          required
        >
          <input
            type="text"
            value={formData.driverId}
            onChange={(e) => setFormData({...formData, driverId: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="기사 ID를 입력하세요"
          />
        </FormField>

        <FormField
          label="배차일"
          error={formErrors.scheduledDate}
          required
        >
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField
          label="배차 시간"
          error={formErrors.scheduledTime}
          required
        >
          <input
            type="time"
            value={formData.scheduledTime}
            onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField label="상태" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="pending">대기</option>
            <option value="confirmed">확정</option>
            <option value="in-progress">진행 중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </FormField>
      </ModalForm>

      {/* 삭제 Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="배차"
        displayValue={deletingDispatch?.id || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
