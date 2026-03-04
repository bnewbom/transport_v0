'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { repositories } from '@/lib/repository';
import { formatKRW, getStatusLabel } from '@/lib/formatters';
import { Route } from '@/lib/schemas';
import { ModalForm } from '@/components/crud/modal-form';
import { ConfirmDeleteDialog } from '@/components/crud/confirm-delete-dialog';
import { FormField } from '@/components/crud/form-field';
import { useAppToast } from '@/components/crud/toast';
import { Button } from '@/components/ui/button';



export default function RoutesPage() {
  const router = useRouter();
  const toast = useAppToast();
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Form state
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    startLocation: '',
    endLocation: '',
    distance: 0,
    estimatedTime: 0,
    baseRate: 0,
    status: 'active' as const,
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deletingRoute, setDeletingRoute] = React.useState<Route | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return;
    }
    loadRoutes();
  }, [router]);

  const loadRoutes = () => {
    setRoutes(repositories.routes.getAll());
    setLoading(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Route name is required';
    if (!formData.startLocation.trim()) errors.startLocation = 'Start location is required';
    if (!formData.endLocation.trim()) errors.endLocation = 'End location is required';
    if (formData.distance <= 0) errors.distance = 'Distance must be greater than 0';
    if (formData.estimatedTime <= 0) errors.estimatedTime = 'Estimated time must be greater than 0';
    if (formData.baseRate <= 0) errors.baseRate = 'Base rate must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenForm = (route?: Route) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        name: route.name,
        startLocation: route.startLocation,
        endLocation: route.endLocation,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        baseRate: route.baseRate,
        status: route.status,
      });
    } else {
      setEditingRoute(null);
      setFormData({
        name: '',
        startLocation: '',
        endLocation: '',
        distance: 0,
        estimatedTime: 0,
        baseRate: 0,
        status: 'active',
      });
    }
    setFormErrors({});
    setIsDrawerOpen(true);
  };

  const handleSaveRoute = () => {
    if (!validateForm()) return;

    try {
      if (editingRoute) {
        repositories.routes.update(editingRoute.id, formData);
        toast.success('노선 수정 완료', '변경사항이 저장되었습니다');
      } else {
        repositories.routes.create(formData as Omit<Route, 'id'>);
        toast.success('노선 등록 완료', '새 노선이 추가되었습니다');
      }
      loadRoutes();
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error('노선 저장 실패', t('common.retry'));
    }
  };

  const handleDeleteClick = (route: Route) => {
    setDeletingRoute(route);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingRoute) return;
    try {
      repositories.routes.delete(deletingRoute.id);
      toast.success('노선 삭제 완료', '노선이 삭제되었습니다');
      loadRoutes();
      setDeleteDialogOpen(false);
      setDeletingRoute(null);
    } catch (error) {
      toast.error('노선 삭제 실패', t('common.retry'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  // Filtered data
  const filteredRoutes = routes.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.startLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.endLocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = routes.filter(r => r.status === 'active').length;
  const totalDistance = routes.reduce((sum, r) => sum + r.distance, 0);
  const avgRate = routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + r.baseRate, 0) / routes.length) : 0;

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.routes')}
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
          <StatCard label="전체 노선" value={routes.length} icon="🗺" />
          <StatCard label="활성 노선" value={activeCount} icon="✅" />
          <StatCard label="총 거리" value={`${totalDistance} km`} icon="📏" />
          <StatCard label="평균 기본요금" value={formatKRW(avgRate)} icon="💰" />
        </Grid>

        {/* Filter & Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="노선 검색"
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
            + Add Route
          </Button>
        </div>

        {/* Data Table */}
        <DataList<Route>
          data={filteredRoutes}
          isLoading={loading}
          columns={[
            {
              key: 'name',
              label: 'Route Name',
              render: (value) => <span className="font-medium">{value}</span>,
            },
            {
              key: 'startLocation',
              label: 'Start',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'endLocation',
              label: 'End',
              render: (value) => <span className="text-sm">{value}</span>,
            },
            {
              key: 'distance',
              label: 'Distance',
              render: (value) => <span className="font-medium">{value} km</span>,
            },
            {
              key: 'baseRate',
              label: 'Base Rate',
              render: (value) => <span className="font-medium">{formatKRW(value as number)}</span>,
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
          ]}
          actions={(route) => (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenForm(route)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDeleteClick(route)}
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
        title={editingRoute ? '노선 수정' : '노선 추가'}
        onOpenChange={setIsDrawerOpen}
        onSubmit={handleSaveRoute}
        submitLabel={editingRoute ? 'Update' : 'Create'}
      >
        <FormField
          label="노선명"
          error={formErrors.name}
          required
        >
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예: 서울-인천 고속"
          />
        </FormField>

        <FormField
          label="출발지"
          error={formErrors.startLocation}
          required
        >
          <input
            type="text"
            value={formData.startLocation}
            onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="출발지를 입력하세요"
          />
        </FormField>

        <FormField
          label="도착지"
          error={formErrors.endLocation}
          required
        >
          <input
            type="text"
            value={formData.endLocation}
            onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="도착지를 입력하세요"
          />
        </FormField>

        <FormField
          label="거리(km)"
          error={formErrors.distance}
          required
        >
          <input
            type="number"
            min="1"
            value={formData.distance}
            onChange={(e) => setFormData({...formData, distance: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="거리를 입력하세요"
          />
        </FormField>

        <FormField
          label="예상 소요시간(분)"
          error={formErrors.estimatedTime}
          required
        >
          <input
            type="number"
            min="1"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({...formData, estimatedTime: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="예상 시간을 입력하세요"
          />
        </FormField>

        <FormField
          label="기본요금(원)"
          error={formErrors.baseRate}
          required
        >
          <input
            type="number"
            min="1"
            value={formData.baseRate}
            onChange={(e) => setFormData({...formData, baseRate: parseInt(e.target.value) || 0})}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="기본요금을 입력하세요"
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
        entityName="노선"
        displayValue={deletingRoute?.name || ''}
        onConfirm={handleConfirmDelete}
      />
    </SidebarLayout>
  );
}
