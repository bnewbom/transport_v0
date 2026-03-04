'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatDate, formatDateTime, getStatusLabel } from '@/lib/formatters';
import { Dispatch } from '@/lib/schemas';
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

  // Delete state
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
    if (!formData.routeId.trim()) errors.routeId = 'Route is required';
    if (!formData.driverId.trim()) errors.driverId = 'Driver is required';
    if (!formData.scheduledDate) errors.scheduledDate = 'Date is required';
    if (!formData.scheduledTime) errors.scheduledTime = 'Time is required';
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
        toast.success('Dispatch updated', 'Changes have been saved successfully');
      } else {
        repositories.dispatches.create({
          ...formData,
          scheduledDate: new Date(formData.scheduledDate),
        } as Omit<Dispatch, 'id' | 'changeLogs'>);
        toast.success('Dispatch created', 'New dispatch has been scheduled');
      }
      loadDispatches();
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Failed to save dispatch', 'Please try again');
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
      toast.success('Dispatch deleted', 'The dispatch has been removed');
      loadDispatches();
      setDeleteDialogOpen(false);
      setDeletingDispatch(null);
    } catch (error) {
      toast.error('Failed to delete dispatch', 'Please try again');
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
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Dispatches"
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
        <Grid columns={5} gap="md" className="mb-8">
          <StatCard label="Total" value={stats.total} icon="📦" />
          <StatCard label="Completed" value={stats.completed} icon="✅" />
          <StatCard label="In Progress" value={stats.inProgress} icon="🔄" />
          <StatCard label="Pending" value={stats.pending} icon="⏱" />
          <StatCard label="Cancelled" value={stats.cancelled} icon="❌" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search dispatches..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + New Dispatch
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Dispatch>
          data={filteredDispatches}
          isLoading={loading}
          columns={[
            {
              key: 'id',
              label: 'ID',
              render: (value) => <span className="font-mono text-sm">{value}</span>,
            },
            {
              key: 'routeId',
              label: 'Route',
              render: (value) => <span className="text-sm font-medium">{value}</span>,
            },
            {
              key: 'driverId',
              label: 'Driver',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'scheduledDate',
              label: 'Date',
              render: (value) => <span className="text-sm">{formatDate(value)}</span>,
            },
            {
              key: 'scheduledTime',
              label: 'Time',
              render: (value) => <span className="text-sm font-medium">{value}</span>,
            },
            {
              key: 'status',
              label: 'Status',
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
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(dispatch)}
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
        title={editingDispatch ? 'Edit Dispatch' : 'Create New Dispatch'}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSaveDispatch}
        submitLabel={editingDispatch ? 'Update' : 'Schedule'}
      >
        <FormField
          label="Route"
          error={formErrors.routeId}
          required
        >
          <input
            type="text"
            value={formData.routeId}
            onChange={(e) => setFormData({...formData, routeId: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter route ID"
          />
        </FormField>

        <FormField
          label="Driver"
          error={formErrors.driverId}
          required
        >
          <input
            type="text"
            value={formData.driverId}
            onChange={(e) => setFormData({...formData, driverId: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter driver ID"
          />
        </FormField>

        <FormField
          label="Scheduled Date"
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
          label="Scheduled Time"
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

        <FormField label="Status" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </FormField>
      </ModalForm>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Dispatch"
        displayValue={deletingDispatch?.id || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
