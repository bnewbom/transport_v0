'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function ClientsPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  // Form state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    address: '',
    status: 'active' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  
  // Delete state
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
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        address: client.address,
        status: client.status,
      });
    } else {
      setEditingClient(null);
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
        toast.success('Client updated', 'Changes have been saved successfully');
      } else {
        repositories.clients.create({
          ...formData,
        } as Omit<Client, 'id' | 'createdAt'>);
        toast.success('Client created', 'New client has been added');
      }
      loadClients();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('Failed to save client', 'Please try again');
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
      toast.success('Client deleted', 'The client has been removed');
      loadClients();
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    } catch (error) {
      toast.error('Failed to delete client', 'Please try again');
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
      sidebar={<Sidebar items={navItems} title="Transport Hub" />}
      header={
        <Header
          title="Clients"
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
          <StatCard label="Total Clients" value={clients.length} icon="👥" />
          <StatCard label="Active Clients" value={activeCount} icon="✅" />
          <StatCard label="Inactive Clients" value={inactiveCount} icon="⏸" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            onClick={() => handleOpenForm()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Add Client
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Client>
          data={filteredClients}
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
              key: 'address',
              label: 'Address',
              render: (value) => <span className="truncate text-sm">{value}</span>,
            },
            {
              key: 'status',
              label: 'Status',
              render: (value) => (
                <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                  {getStatusLabel(value)}
                </Badge>
              ),
            },
            {
              key: 'createdAt',
              label: 'Created',
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
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(client)}
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
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveClient}
        submitLabel={editingClient ? 'Update' : 'Create'}
      >
        <FormField
          label="Client Name"
          error={formErrors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter client name"
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
            placeholder="02-1234-5678"
          />
        </FormField>

        <FormField
          label="Address"
          error={formErrors.address}
          required
        >
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Enter address"
          />
        </FormField>

        <FormField label="Status" required>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </ModalForm>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Client"
        displayValue={deletingClient?.name || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
