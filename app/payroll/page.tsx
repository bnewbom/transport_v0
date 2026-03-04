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
import { Client, Dispatch, Driver, PayrollSlip, Route } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';
import { getPeriodRange, isDateInRange } from '@/lib/domain/payroll';

type PayrollSlipWithLegacyDeduction = PayrollSlip & {
  deductionAmount?: number;
};

type PayrollFormState = {
  driverId: string;
  period: string;
  baseAmount: number;
  bonusAmount: number;
  deductions: number;
  status: 'draft' | 'approved' | 'paid';
};

const FALLBACK_DRIVER_NAME = '알 수 없음';
const FALLBACK_PHONE = '연락처 없음';

const getSlipDeduction = (slip: PayrollSlipWithLegacyDeduction) => {
  return slip.deductionAmount ?? slip.deductions ?? 0;
};

export default function PayrollPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [slips, setSlips] = React.useState<PayrollSlipWithLegacyDeduction[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [dispatches, setDispatches] = React.useState<Dispatch[]>([]);
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSlip, setEditingSlip] = React.useState<PayrollSlipWithLegacyDeduction | null>(null);
  const [formData, setFormData] = React.useState<PayrollFormState>({
    driverId: '',
    period: '',
    baseAmount: 0,
    bonusAmount: 0,
    deductions: 0,
    status: 'draft' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedSlip, setSelectedSlip] = React.useState<PayrollSlipWithLegacyDeduction | null>(null);
  const [detailTab, setDetailTab] = React.useState<'summary' | 'logs'>('summary');
  const [dispatchSearchTerm, setDispatchSearchTerm] = React.useState('');

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingSlip, setDeletingSlip] = React.useState<PayrollSlipWithLegacyDeduction | null>(null);

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
    loadPayrollPageData();
  }, [router]);

  React.useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDetailOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailOpen]);

  const loadPayrollPageData = () => {
    setSlips(repositories.payrollSlips.getAll() as PayrollSlipWithLegacyDeduction[]);
    setDrivers(repositories.drivers.getAll());
    setDispatches(repositories.dispatches.getAll());
    setRoutes(repositories.routes.getAll());
    setClients(repositories.clients.getAll());
    setLoading(false);
  };

  const driverMap = React.useMemo(() => {
    return new Map(drivers.map((driver) => [driver.id, driver]));
  }, [drivers]);

  const routeMap = React.useMemo(() => {
    return new Map(routes.map((route) => [route.id, route]));
  }, [routes]);

  const clientMap = React.useMemo(() => {
    return new Map(clients.map((client) => [client.id, client]));
  }, [clients]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.driverId.trim()) errors.driverId = t('common.required');
    if (!formData.period.trim()) errors.period = t('common.required');
    if (formData.baseAmount <= 0) errors.baseAmount = '기본 급여는 0보다 커야 합니다';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (slip?: PayrollSlipWithLegacyDeduction) => {
    if (slip) {
      setEditingSlip(slip);
      setFormData({
        driverId: slip.driverId,
        period: slip.period,
        baseAmount: slip.baseAmount,
        bonusAmount: slip.bonusAmount || 0,
        deductions: getSlipDeduction(slip),
        status: slip.status,
      });
    } else {
      setEditingSlip(null);
      setFormData({
        driverId: '',
        period: new Date().toISOString().slice(0, 7),
        baseAmount: 0,
        bonusAmount: 0,
        deductions: 0,
        status: 'draft',
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveSlip = () => {
    if (!validateForm()) return;

    try {
      const totalAmount = formData.baseAmount + formData.bonusAmount - formData.deductions;

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
          createdAt: new Date(),
        } as Omit<PayrollSlip, 'id'>);
        toast.success('급여 정산 생성 완료', '새 급여 정산이 생성되었습니다');
      }
      loadPayrollPageData();
      setIsModalOpen(false);
    } catch {
      toast.error('급여 정산 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (slip: PayrollSlipWithLegacyDeduction) => {
    setDeletingSlip(slip);
    setDeleteDialogOpen(true);
  };

  const handleOpenDetail = (slip: PayrollSlipWithLegacyDeduction) => {
    setSelectedSlip(slip);
    setDetailTab('summary');
    setDispatchSearchTerm('');
    setDetailOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingSlip) return;
    try {
      repositories.payrollSlips.delete(deletingSlip.id);
      toast.success('급여 정산 삭제 완료', '급여 정산이 삭제되었습니다');
      loadPayrollPageData();
      setDeleteDialogOpen(false);
      setDeletingSlip(null);
    } catch {
      toast.error('급여 정산 삭제 실패', t('common.retry'));
    }
  };

  const handlePrintPayrollDetail = () => {
    window.print();
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredSlips = slips.filter((s) => {
    const driver = driverMap.get(s.driverId);
    const driverName = driver?.name || '';
    const driverPhone = driver?.phone || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      s.driverId.toLowerCase().includes(search) ||
      s.period.includes(searchTerm) ||
      driverName.toLowerCase().includes(search) ||
      driverPhone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || s.period === periodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Get unique periods for filter
  const periods = Array.from(new Set(slips.map((s) => s.period))).sort().reverse();

  const stats = {
    total: slips.length,
    approved: slips.filter((s) => s.status === 'approved').length,
    paid: slips.filter((s) => s.status === 'paid').length,
    totalPayable: slips.filter((s) => s.status !== 'paid').reduce((sum, s) => sum + s.totalAmount, 0),
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'secondary' | 'warning' | 'default'> = {
      draft: 'secondary',
      approved: 'warning',
      paid: 'default',
    };
    return variants[status] || 'default';
  };

  const detailDriver = selectedSlip ? driverMap.get(selectedSlip.driverId) : undefined;
  const detailPeriodRange = selectedSlip ? getPeriodRange(selectedSlip.period) : null;
  const detailDispatches = React.useMemo(() => {
    if (!selectedSlip || !detailPeriodRange) return [];
    return dispatches.filter(
      (dispatch) =>
        dispatch.driverId === selectedSlip.driverId &&
        isDateInRange(dispatch.scheduledDate, detailPeriodRange),
    );
  }, [dispatches, detailPeriodRange, selectedSlip]);

  const filteredDetailDispatches = React.useMemo(() => {
    const keyword = dispatchSearchTerm.trim().toLowerCase();
    if (!keyword) return detailDispatches;

    return detailDispatches.filter((dispatch) => {
      const routeName = routeMap.get(dispatch.routeId)?.name ?? '';
      const clientName = clientMap.get(dispatch.clientId)?.name ?? '';
      const scheduled = formatDate(dispatch.scheduledDate, 'long').toLowerCase();
      return (
        routeName.toLowerCase().includes(keyword) ||
        clientName.toLowerCase().includes(keyword) ||
        scheduled.includes(keyword)
      );
    });
  }, [detailDispatches, dispatchSearchTerm, routeMap, clientMap]);

  const renderPayrollItemsSection = (slip: PayrollSlipWithLegacyDeduction) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-base font-semibold">지급 항목</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">기본급</span>
          <span>{formatKRW(slip.baseAmount)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">추가수당/보너스</span>
          <span>{formatKRW(slip.bonusAmount)}</span>
        </div>
      </div>

      <h3 className="mb-3 mt-6 text-base font-semibold">공제 항목</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">총 공제</span>
          <span>{formatKRW(getSlipDeduction(slip))}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">국민연금</span>
          <span>{formatKRW(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">건강보험</span>
          <span>{formatKRW(0)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">고용보험/소득세</span>
          <span>{formatKRW(0)}</span>
        </div>
      </div>
    </div>
  );

  const renderDispatchTable = (rows: Dispatch[], scrollClassName: string) => (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 text-base font-semibold">운행일지</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">해당 기간에 운행 기록이 없습니다.</p>
      ) : (
        <div className={`overflow-x-auto ${scrollClassName}`}>
          <table className="payroll-print-table w-full text-sm">
            <thead className="bg-card">
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="sticky top-0 bg-card py-2 pr-3">운행일자</th>
                <th className="sticky top-0 bg-card py-2 pr-3">노선</th>
                <th className="sticky top-0 bg-card py-2 pr-3">거래처</th>
                <th className="sticky top-0 bg-card py-2 pr-3">추가운행</th>
                <th className="sticky top-0 bg-card py-2">비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((dispatch) => {
                const route = routeMap.get(dispatch.routeId);
                const client = clientMap.get(dispatch.clientId);
                return (
                  <tr key={dispatch.id} className="border-b border-border/60 align-top">
                    <td className="py-2 pr-3">{formatDate(dispatch.scheduledDate, 'long')}</td>
                    <td className="py-2 pr-3">{route?.name ?? '알 수 없는 노선'}</td>
                    <td className="py-2 pr-3">{client?.name ?? '알 수 없는 거래처'}</td>
                    <td className="py-2 pr-3">{dispatch.status === 'completed' ? '완료 운행' : '기본 운행'}</td>
                    <td className="py-2">{dispatch.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

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
              placeholder="기사명, 연락처, 기간으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'approved' | 'paid')}
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
              {periods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={() => handleOpenForm()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            + 급여 정산 생성
          </Button>
        </div>

        {/* Data Table */}
        <DataList<PayrollSlipWithLegacyDeduction>
          data={filteredSlips}
          isLoading={loading}
          columns={[
            {
              key: 'driverId',
              label: '기사 정보',
              render: (_, item) => {
                const driver = driverMap.get(item.driverId);
                const driverName = driver?.name ?? FALLBACK_DRIVER_NAME;
                const phone = driver?.phone ?? FALLBACK_PHONE;

                return (
                  <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => handleOpenDetail(item)}
                  >
                    {driverName} ({phone})
                  </button>
                );
              },
            },
            {
              key: 'period',
              label: '정산 기간',
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
              render: (value) => (
                <span className="text-sm text-green-600 dark:text-green-400">
                  {value && (value as number) > 0 ? '+' + formatKRW(value as number) : '—'}
                </span>
              ),
            },
            {
              key: 'deductions',
              label: '공제',
              render: (_, item) => {
                const deduction = getSlipDeduction(item);
                return (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {deduction > 0 ? '-' + formatKRW(deduction) : '—'}
                  </span>
                );
              },
            },
            {
              key: 'totalAmount',
              label: '실수령액',
              render: (value) => <span className="font-medium">{formatKRW(value as number)}</span>,
            },
            {
              key: 'status',
              label: '상태',
              render: (value) => <Badge variant={getStatusBadgeVariant(value)}>{getStatusLabel(value)}</Badge>,
            },
          ]}
          actions={(slip) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleOpenForm(slip)}>
                수정
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(slip)}>
                삭제
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
        <FormField label="기사" error={formErrors.driverId} required>
          <select
            value={formData.driverId}
            onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">기사 선택</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} ({driver.phone})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="정산 기간" error={formErrors.period} required help="형식: YYYY-MM">
          <input
            type="month"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField label="기본 금액(원)" error={formErrors.baseAmount} required>
          <input
            type="number"
            min="1"
            value={formData.baseAmount}
            onChange={(e) => setFormData({ ...formData, baseAmount: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="기본 금액을 입력하세요"
          />
        </FormField>

        <FormField label="보너스(원)" help="선택 사항">
          <input
            type="number"
            min="0"
            value={formData.bonusAmount}
            onChange={(e) => setFormData({ ...formData, bonusAmount: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="보너스를 입력하세요"
          />
        </FormField>

        <FormField label="공제 금액(원)" help="선택 사항">
          <input
            type="number"
            min="0"
            value={formData.deductions}
            onChange={(e) => setFormData({ ...formData, deductions: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="공제 금액을 입력하세요"
          />
        </FormField>

        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">
            실수령액:{' '}
            <span className="font-semibold text-foreground">{formatKRW(formData.baseAmount + formData.bonusAmount - formData.deductions)}</span>
          </p>
        </div>

        <FormField label="상태" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'approved' | 'paid' })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="draft">임시</option>
            <option value="approved">승인</option>
            <option value="paid">지급</option>
          </select>
        </FormField>
      </ModalForm>

      {detailOpen && selectedSlip && detailPeriodRange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center payroll-print-root">
          <div className="absolute inset-0 bg-black/50 payroll-print-hide" onClick={() => setDetailOpen(false)} />
          <div className="payroll-print-area relative z-10 mx-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-background shadow-lg">
            <div className="sticky top-0 border-b border-border bg-background px-6 py-4 payroll-print-header">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">급여 상세</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {detailDriver?.name ?? FALLBACK_DRIVER_NAME} · {detailDriver?.phone ?? FALLBACK_PHONE}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(detailPeriodRange.start, 'long')} ~ {formatDate(detailPeriodRange.end, 'long')}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedSlip.status)}>{getStatusLabel(selectedSlip.status)}</Badge>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">총지급액</p>
                  <p className="mt-2 text-xl font-semibold">{formatKRW(selectedSlip.baseAmount + selectedSlip.bonusAmount)}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">총공제액</p>
                  <p className="mt-2 text-xl font-semibold">{formatKRW(getSlipDeduction(selectedSlip))}</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm text-muted-foreground">실수령액</p>
                  <p className="mt-2 text-xl font-semibold text-primary">{formatKRW(selectedSlip.totalAmount)}</p>
                </div>
              </div>

              {/* 모바일/태블릿: 기존 스택 레이아웃 유지 */}
              <div className="space-y-4 lg:hidden">
                {renderPayrollItemsSection(selectedSlip)}
                {renderDispatchTable(detailDispatches, '')}
              </div>

              {/* PC: 탭 기반 레이아웃으로 전환 */}
              <div className="hidden lg:block">
                <div className="mb-4 flex items-center gap-2 border-b border-border pb-3 payroll-print-hide">
                  <button
                    type="button"
                    onClick={() => setDetailTab('summary')}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${detailTab === 'summary' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    급여 내역
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('logs')}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${detailTab === 'logs' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                  >
                    운행 내역
                  </button>
                </div>

                {detailTab === 'summary' ? (
                  renderPayrollItemsSection(selectedSlip)
                ) : (
                  <div className="space-y-4">
                    <div className="payroll-print-hide">
                      <input
                        type="text"
                        value={dispatchSearchTerm}
                        onChange={(e) => setDispatchSearchTerm(e.target.value)}
                        placeholder="운행일자/노선/거래처 검색"
                        className="w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    {renderDispatchTable(filteredDetailDispatches, 'max-h-[28rem] overflow-y-auto')}
                  </div>
                )}
              </div>

              {/* 프린트 전용: 탭과 관계없이 급여+운행 전체 출력 */}
              <div className="hidden print:block space-y-4">
                {renderPayrollItemsSection(selectedSlip)}
                {renderDispatchTable(detailDispatches, '')}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background px-6 py-4 payroll-print-hide">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                닫기
              </Button>
              <Button onClick={handlePrintPayrollDetail}>프린트하기</Button>
            </div>
          </div>
        </div>
      )}

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
