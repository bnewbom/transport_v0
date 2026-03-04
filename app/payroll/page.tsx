'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatKRW, formatDate, getStatusLabel } from '@/lib/formatters';
import { PayrollSlip } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';



export default function PayrollPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [slips, setSlips] = React.useState<PayrollSlip[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSlip, setEditingSlip] = React.useState<PayrollSlip | null>(null);
  const [formData, setFormData] = React.useState({
    driverId: '',
    period: '',
    baseAmount: 0,
    bonusAmount: 0,
    deductionAmount: 0,
    status: 'draft' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingSlip, setDeletingSlip] = React.useState<PayrollSlip | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [periodFilter, setPeriodFilter] = React.useState('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadSlips();
  }, [router]);

  const loadSlips = () => {
    setSlips(repositories.payrollSlips.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.driverId.trim()) errors.driverId = t('common.required');
    if (!formData.period.trim()) errors.period = t('common.required');
    if (formData.baseAmount <= 0) errors.baseAmount = '기본 급여는 0보다 커야 합니다';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (slip?: PayrollSlip) => {
    if (slip) {
      setEditingSlip(slip);
      setFormData({
        driverId: slip.driverId,
        period: slip.period,
        baseAmount: slip.baseAmount,
        bonusAmount: slip.bonusAmount || 0,
        deductionAmount: slip.deductionAmount || 0,
        status: slip.status,
      });
    } else {
      setEditingSlip(null);
      setFormData({
        driverId: '',
        period: new Date().toISOString().slice(0, 7),
        baseAmount: 0,
        bonusAmount: 0,
        deductionAmount: 0,
        status: 'draft',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveSlip = () => {
    if (!validateForm()) return;

    try {
      const totalAmount = formData.baseAmount + formData.bonusAmount - formData.deductionAmount;
      
      if (editingSlip) {
        repositories.payrollSlips.update(editingSlip.id, {
          ...formData,
          totalAmount,
        });
        toast.success('급여 정산 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.payrollSlips.create({
          ...formData,
          totalAmount,
        } as Omit<PayrollSlip, 'id'>);
        toast.success('급여 정산 생성 완료', '새 급여 정산이 생성되었습니다');
      }
      loadSlips();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('급여 정산 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (slip: PayrollSlip) => {
    setDeletingSlip(slip);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingSlip) return;
    try {
      repositories.payrollSlips.delete(deletingSlip.id);
      toast.success('급여 정산 삭제 완료', '급여 정산이 삭제되었습니다');
      loadSlips();
      setDeleteDialogOpen(false);
      setDeletingSlip(null);
    } catch (error) {
      toast.error('급여 정산 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredSlips = slips.filter(s => {
    const matchesSearch = s.driverId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.period.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || s.period === periodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Get unique periods for filter
  const periods = Array.from(new Set(slips.map(s => s.period))).sort().reverse();

  const stats = {
    total: slips.length,
    draft: slips.filter(s => s.status === 'draft').length,
    approved: slips.filter(s => s.status === 'approved').length,
    paid: slips.filter(s => s.status === 'paid').length,
    totalPayable: slips.filter(s => s.status !== 'paid').reduce((sum, s) => sum + s.totalAmount, 0),
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, any> = {
      'draft': 'secondary',
      'approved': 'warning',
      'paid': 'default',
    };
    return variants[status] || 'default';
  };

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.payroll')}
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
          <StatCard label="전체 정산" value={stats.total} icon="📄" />
          <StatCard label="지급 예정" value={formatKRW(stats.totalPayable)} icon="⏱" />
          <StatCard label="승인" value={stats.approved} icon="✅" />
          <StatCard label="지급" value={stats.paid} icon="💳" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="급여 정산 검색"
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
              <option value="draft">임시</option>
              <option value="approved">승인</option>
              <option value="paid">지급</option>
            </select>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">전체 기간</option>
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + 급여 정산 생성
          </Button>
        </div>

        {/* Data Table */}
        <DataList<PayrollSlip>
          data={filteredSlips}
          isLoading={loading}
          columns={[
            {
              key: 'driverId',
              label: 'Driver',
              render: (value) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'period',
              label: 'Period',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'baseAmount',
              label: '기본급',
              render: (value) => <span className="text-sm">{formatKRW(value as number)}</span>,
            },
            {
              key: 'bonusAmount',
              label: '보너스',
              render: (value, item) => (
                <span className="text-sm text-green-600 dark:text-green-400">
                  {value && (value as number) > 0 ? '+' + formatKRW(value as number) : '—'}
                </span>
              ),
            },
            {
              key: 'deductionAmount',
              label: '공제',
              render: (value) => (
                <span className="text-sm text-red-600 dark:text-red-400">
                  {value && (value as number) > 0 ? '-' + formatKRW(value as number) : '—'}
                </span>
              ),
            },
            {
              key: 'totalAmount',
              label: '합계',
              render: (value) => <span className="font-medium">{formatKRW(value as number)}</span>,
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
          actions={(slip) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(slip)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(slip)}
              >
                Delete
              </Button>
            </div>
          )}
        />
      </PageContent>

      {/* Create/Edit Form Modal */}
      <ModalForm
        isOpen={isModalOpen}
        title={editingSlip ? '급여 정산 수정' : '급여 정산 생성'}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSaveSlip}
        submitLabel={editingSlip ? '수정' : '생성'}
      >
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
            placeholder="기사 ID 또는 이름"
          />
        </FormField>

        <FormField
          label="정산 기간"
          error={formErrors.period}
          required
          help="Format: YYYY-MM"
        >
          <input
            type="month"
            value={formData.period}
            onChange={(e) => setFormData({...formData, period: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField
          label="기본 금액(원)"
          error={formErrors.baseAmount}
          required
        >
          <input
            type="number"
            min="1"
            value={formData.baseAmount}
            onChange={(e) => setFormData({...formData, baseAmount: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="기본 금액을 입력하세요"
          />
        </FormField>

        <FormField
          label="보너스(원)"
          help="Optional"
        >
          <input
            type="number"
            min="0"
            value={formData.bonusAmount}
            onChange={(e) => setFormData({...formData, bonusAmount: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="보너스를 입력하세요"
          />
        </FormField>

        <FormField
          label="공제 금액(원)"
          help="Optional"
        >
          <input
            type="number"
            min="0"
            value={formData.deductionAmount}
            onChange={(e) => setFormData({...formData, deductionAmount: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="공제 금액을 입력하세요"
          />
        </FormField>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">
              {formatKRW(formData.baseAmount + formData.bonusAmount - formData.deductionAmount)}
            </span>
          </p>
        </div>

        <FormField label="상태" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="draft">임시</option>
            <option value="approved">승인</option>
            <option value="paid">지급</option>
          </select>
        </FormField>
      </ModalForm>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="급여 정산"
        displayValue={deletingSlip ? `${deletingSlip.driverId} - ${deletingSlip.period}` : ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
