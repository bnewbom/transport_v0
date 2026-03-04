'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatKRW, formatDate } from '@/lib/formatters';
import { FinancialRecord } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';

type FinanceType = 'income' | 'expense';
type FinanceCategory = FinancialRecord['category'];

const CATEGORIES: Record<FinanceType, readonly FinanceCategory[]> = {
  income: ['route-revenue'],
  expense: ['fuel', 'maintenance', 'salary', 'insurance', 'other'],
} as const;

const CATEGORY_LABEL: Record<FinanceCategory, string> = {
  'route-revenue': '노선 수익',
  fuel: '유류비',
  maintenance: '정비비',
  salary: '급여',
  insurance: '보험',
  other: '기타',
};

export default function FinancePage() {
  const router = useRouter();
  const toast = useAppToast();
  const [records, setRecords] = React.useState<FinancialRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<FinancialRecord | null>(null);
  const [formData, setFormData] = React.useState({
    type: 'income' as FinanceType,
    category: 'route-revenue' as FinanceCategory,
    description: '',
    amount: 0,
    date: new Date(),
    reference: '',
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingRecord, setDeletingRecord] = React.useState<FinancialRecord | null>(null);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | FinanceType>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | FinanceCategory>('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadRecords();
  }, [router]);

  const loadRecords = () => {
    setRecords(repositories.financialRecords.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.description.trim()) errors.description = t('common.required');
    if (formData.amount <= 0) errors.amount = '금액은 0보다 커야 합니다';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (record?: FinancialRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        type: record.type,
        category: record.category,
        description: record.description,
        amount: record.amount,
        date: record.date,
        reference: record.reference || '',
      });
    } else {
      setEditingRecord(null);
      setFormData({
        type: 'income',
        category: 'route-revenue',
        description: '',
        amount: 0,
        date: new Date(),
        reference: '',
      });
    }
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleSaveRecord = () => {
    if (!validateForm()) return;

    try {
      if (editingRecord) {
        repositories.financialRecords.update(editingRecord.id, {
          ...formData,
        });
        toast.success('거래 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.financialRecords.create({
          ...formData,
        } as Omit<FinancialRecord, 'id'>);
        toast.success('거래 등록 완료', '새 거래가 추가되었습니다');
      }
      loadRecords();
      setIsDrawerOpen(false);
    } catch {
      toast.error('거래 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (record: FinancialRecord) => {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRecord) return;
    try {
      repositories.financialRecords.delete(deletingRecord.id);
      toast.success('거래 삭제 완료', '거래가 삭제되었습니다');
      loadRecords();
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
    } catch {
      toast.error('거래 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const income = filteredRecords.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const expense = filteredRecords.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const profit = income - expense;

  const safeType: FinanceType = formData.type ?? 'expense';
  const availableCategories = CATEGORIES[safeType] ?? CATEGORIES.expense;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.finance')}
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
        <Grid columns={3} gap="md" className="mb-8">
          <StatCard label="총수입" value={formatKRW(income)} icon="💵" />
          <StatCard label="총지출" value={formatKRW(expense)} icon="💸" />
          <StatCard label="순이익" value={formatKRW(profit)} icon="📈" />
        </Grid>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="거래 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | FinanceType)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">전체 유형</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | FinanceCategory)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">전체 카테고리</option>
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + 거래 추가
          </Button>
        </div>

        <DataList<FinancialRecord>
          data={filteredRecords}
          isLoading={loading}
          columns={[
            {
              key: 'type',
              label: '유형',
              render: (value) => (
                <Badge variant={value === 'income' ? 'default' : 'secondary'}>
                  {value === 'income' ? '수입' : '지출'}
                </Badge>
              ),
            },
            {
              key: 'category',
              label: '카테고리',
              render: (value) => <span className="text-sm">{CATEGORY_LABEL[value as FinanceCategory]}</span>,
            },
            {
              key: 'description',
              label: '설명',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'amount',
              label: '금액',
              render: (value, item) => (
                <span className={`font-medium ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatKRW(value as number)}
                </span>
              ),
            },
            {
              key: 'date',
              label: '날짜',
              render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
            },
          ]}
          actions={(record) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleOpenForm(record)}>
                수정
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(record)}>
                삭제
              </Button>
            </div>
          )}
          emptyMessage="거래 내역이 없습니다"
        />
      </PageContent>

      <ModalForm
        isOpen={isDrawerOpen}
        title={editingRecord ? '거래 수정' : '거래 추가'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveRecord}
        submitLabel={editingRecord ? '수정' : '저장'}
      >
        <FormField label="유형" required>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as FinanceType;
              setFormData({
                ...formData,
                type: newType,
                category: CATEGORIES[newType][0],
              });
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </FormField>

        <FormField label="카테고리" required>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as FinanceCategory })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABEL[cat]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="설명" error={formErrors.description} required>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="거래 설명을 입력하세요"
          />
        </FormField>

        <FormField label="금액(원)" error={formErrors.amount} required>
          <input
            type="number"
            min="1"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="금액을 입력하세요"
          />
        </FormField>

        <FormField label="날짜" required>
          <input
            type="date"
            value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField label="참조" help="선택: 참조 코드 또는 ID">
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: DP001, INV-123"
          />
        </FormField>
      </ModalForm>

      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="거래"
        displayValue={deletingRecord ? `${deletingRecord.description} (${formatKRW(deletingRecord.amount)})` : ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
