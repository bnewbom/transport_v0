'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Clients', href: '/clients', icon: '👥' },
  { label: 'Drivers', href: '/drivers', icon: '🚗' },
  { label: 'Routes', href: '/routes', icon: '🗺' },
  { label: 'Dispatches', href: '/dispatches', icon: '📋' },
  { label: 'Operations', href: '/operations', icon: '⚙️' },
  { label: 'Finance', href: '/finance', icon: '💰' },
  { label: 'Payroll', href: '/payroll', icon: '💳' },
  { label: 'Reports', href: '/reports', icon: '📈' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

const CATEGORIES: Record<string, string[]> = {
  income: ['route-revenue'],
  expense: ['fuel', 'maintenance', 'salary', 'insurance', 'other'],
};

export default function FinancePage() {
  const router = useRouter();
  const toast = useAppToast();
  const [records, setRecords] = React.useState<FinancialRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingRecord, setEditingRecord] = React.useState<FinancialRecord | null>(null);
  const [formData, setFormData] = React.useState({
    type: 'income' as const,
    category: 'route-revenue' as const,
    description: '',
    amount: 0,
    date: new Date(),
    reference: '',
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingRecord, setDeletingRecord] = React.useState<FinancialRecord | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

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
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.amount <= 0) errors.amount = 'Amount must be greater than 0';
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
        toast.success('Record updated', 'Changes have been saved successfully');
      } else {
        repositories.financialRecords.create({
          ...formData,
        } as Omit<FinancialRecord, 'id'>);
        toast.success('Record created', 'New financial record has been added');
      }
      loadRecords();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('Failed to save record', 'Please try again');
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
      toast.success('Record deleted', 'The financial record has been removed');
      loadRecords();
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
    } catch (error) {
      toast.error('Failed to delete record', 'Please try again');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (r.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const income = filteredRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const expense = filteredRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const profit = income - expense;

  // Available categories based on selected type
  const availableCategories = CATEGORIES[formData.type] || [];

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Finance"
          rightContent={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          }
        />
      }
    >
      <PageContent>
        {/* Stats */}
        <Grid columns={3} gap="md" className="mb-8">
          <StatCard 
            label="Total Income" 
            value={formatKRW(income)} 
            icon="💵"
          />
          <StatCard 
            label="Total Expense" 
            value={formatKRW(expense)} 
            icon="💸"
          />
          <StatCard 
            label="Net Profit" 
            value={formatKRW(profit)} 
            icon="📈"
          />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="route-revenue">Route Revenue</option>
              <option value="fuel">Fuel</option>
              <option value="maintenance">Maintenance</option>
              <option value="salary">Salary</option>
              <option value="insurance">Insurance</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Record Transaction
          </Button>
        </div>

        {/* Data Table */}
        <DataList<FinancialRecord>
          data={filteredRecords}
          isLoading={loading}
          columns={[
            {
              key: 'type',
              label: 'Type',
              render: (value) => (
                <Badge variant={value === 'income' ? 'default' : 'secondary'}>
                  {value === 'income' ? 'Income' : 'Expense'}
                </Badge>
              ),
            },
            {
              key: 'category',
              label: 'Category',
              render: (value) => <span className="text-sm capitalize">{String(value).replace(/-/g, ' ')}</span>,
            },
            {
              key: 'description',
              label: 'Description',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (value, item) => (
                <span className={`font-medium ${item.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {item.type === 'income' ? '+' : '-'}{formatKRW(value as number)}
                </span>
              ),
            },
            {
              key: 'date',
              label: 'Date',
              render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
            },
          ]}
          actions={(record) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(record)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(record)}
              >
                Delete
              </Button>
            </div>
          )}
          emptyMessage="No financial records found"
        />
      </PageContent>

      {/* Create/Edit Form Modal */}
      <ModalForm
        isOpen={isDrawerOpen}
        title={editingRecord ? 'Edit Transaction' : 'Record New Transaction'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveRecord}
        submitLabel={editingRecord ? 'Update' : 'Record'}
      >
        <FormField label="Type" required>
          <select
            value={formData.type}
            onChange={(e) => {
              const newType = e.target.value as 'income' | 'expense';
              setFormData({
                ...formData,
                type: newType,
                category: CATEGORIES[newType][0] as any,
              });
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </FormField>

        <FormField label="Category" required>
          <select
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value as any})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>
                {cat.replace(/-/g, ' ').charAt(0).toUpperCase() + cat.replace(/-/g, ' ').slice(1)}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Description"
          error={formErrors.description}
          required
        >
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter transaction description"
          />
        </FormField>

        <FormField
          label="Amount (KRW)"
          error={formErrors.amount}
          required
        >
          <input
            type="number"
            min="1"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter amount"
          />
        </FormField>

        <FormField label="Date" required>
          <input
            type="date"
            value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({...formData, date: new Date(e.target.value)})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormField>

        <FormField
          label="Reference"
          help="Optional: Reference code or ID"
        >
          <input
            type="text"
            value={formData.reference}
            onChange={(e) => setFormData({...formData, reference: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g., DP001, INV-123"
          />
        </FormField>
      </ModalForm>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Financial Record"
        displayValue={deletingRecord ? `${deletingRecord.description} (${formatKRW(deletingRecord.amount)})` : ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
