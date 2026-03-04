'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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

  // Delete state
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
    if (!formData.name.trim()) errors.name = 'Driver name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.licenseNumber.trim()) errors.licenseNumber = 'License number is required';
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
        toast.success('Driver updated', 'Changes have been saved successfully');
      } else {
        repositories.drivers.create({
          ...formData,
        } as Omit<Driver, 'id'>);
        toast.success('Driver created', 'New driver has been added');
      }
      loadDrivers();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('Failed to save driver', 'Please try again');
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
      toast.success('Driver deleted', 'The driver has been removed');
      loadDrivers();
      setDeleteDialogOpen(false);
      setDeletingDriver(null);
    } catch (error) {
      toast.error('Failed to delete driver', 'Please try again');
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
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Drivers"
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
        <Grid columns={4} gap="md" className="mb-8">
          <StatCard label="Total Drivers" value={drivers.length} icon="👤" />
          <StatCard label="Active" value={activeCount} icon="✅" />
          <StatCard label="On Leave" value={onLeaveCount} icon="⏰" />
          <StatCard label="Inactive" value={inactiveCount} icon="❌" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on-leave">On Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Add Driver
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Driver>
          data={filteredDrivers}
          isLoading={loading}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (value) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'phone',
              label: 'Phone',
            },
            {
              key: 'licenseNumber',
              label: 'License Number',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'joinDate',
              label: 'Join Date',
              render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
            },
            {
              key: 'status',
              label: 'Status',
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
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(driver)}
              >
                Delete
              </Button>
            </div>
          )}
        />
      </PageContent>

      {/* Create/Edit Form Modal */}
      <ModalForm
        isOpen={isDrawerOpen}
        title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveDriver}
        submitLabel={editingDriver ? 'Update' : 'Create'}
      >
        <FormField
          label="Driver Name"
          error={formErrors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter driver name"
          />
        </FormField>

        <FormField
          label="Phone Number"
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
          label="License Number"
          error={formErrors.licenseNumber}
          required
        >
          <input
            type="text"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="DL-2020-123456"
          />
        </FormField>

        <FormField
          label="Join Date"
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
          label="Bank Account"
          help="Optional: For payroll processing"
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
          label="Account Holder Name"
          help="Optional: Name on bank account"
        >
          <input
            type="text"
            value={formData.accountHolder}
            onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter account holder name"
          />
        </FormField>

        <FormField label="Status" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive' | 'on-leave'})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </ModalForm>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Driver"
        displayValue={deletingDriver?.name || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
