'use client';

import React from 'react';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, Grid, StatCard } from '@/components/layout-shell';
import { DataList, Badge } from '@/components/data-list';
import { Button } from '@/components/ui/button';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';
import { repositories, recordChangeLog } from '@/lib/repository';
import { Payroll, PayrollItem, Run } from '@/lib/schemas';
import { formatKRW } from '@/lib/formatters';
import { ensureSeedData } from '@/lib/seed';
import { getPayrollStatusLabel } from '@/lib/labels';
import { PayrollStatementModal } from '@/components/payroll/payroll-statement-modal';

const getItems = (payrollId: string) => repositories.payrollItems.getAll().filter((item) => item.payrollId === payrollId);

type PayrollRow = Payroll & { driverName: string; driverPhone: string };

export default function PayrollPage() {
  const [month, setMonth] = React.useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'draft' | 'confirmed'>('all');
  const [rows, setRows] = React.useState<Payroll[]>([]);
  const [selected, setSelected] = React.useState<Payroll | null>(null);

  const loadPayrollRows = React.useCallback(() => {
    setRows(repositories.payroll.getAll());
  }, []);

  const load = React.useCallback(() => setRows(repositories.payroll.getAll()), []);
  React.useEffect(() => {
    ensureSeedData();
    loadPayrollRows();
  }, [loadPayrollRows]);

  const generate = () => {
    const company = repositories.company.getAll()[0];
    const drivers = repositories.drivers.getAll().filter((driver) => driver.status !== 'inactive');
    const runs = repositories.runs.getAll().filter((run) => String(run.serviceDate).startsWith(month));

    drivers.forEach((driver) => {
      const exists = repositories.payroll.getAll().some((payroll) => payroll.driverId === driver.id && payroll.settlementMonth === month);
      if (exists) return;

      const ownRuns = runs.filter((run) => run.driverId === driver.id);
      const allowance = ownRuns.filter((run) => run.status === 'completed').reduce((sum, run) => sum + run.allowanceAmount, 0);
      const absenceCount = ownRuns.filter((run) => run.status === 'absence').length;
      const basic = driver.basicSalaryOverride ?? company.defaultBasicSalary;
      const attendance = absenceCount <= company.allowedHolidaysPerMonth ? 100000 : 0;

      const payroll = repositories.payroll.create({
        driverId: driver.id,
        settlementMonth: month,
        status: 'draft',
        allowedHolidaysPerMonth: company.allowedHolidaysPerMonth,
        absenceCount,
        totalEarnings: basic + attendance + allowance,
        totalDeductions: 0,
        netAmount: basic + attendance + allowance,
        createdAt: new Date().toISOString(),
      });

      const items: Omit<PayrollItem, 'id'>[] = [
        { payrollId: payroll.id, itemType: 'BASIC', amount: basic },
        { payrollId: payroll.id, itemType: 'ATTENDANCE_BONUS', amount: attendance },
        { payrollId: payroll.id, itemType: 'RUN_ALLOWANCE', amount: allowance },
      ];
      items.forEach((item) => repositories.payrollItems.create(item));
      recordChangeLog({ entityType: 'payroll', entityId: payroll.id, action: 'create', after: payroll });
    });

    loadPayrollRows();
  };

  const confirm = (row: Payroll) => {
    const before = { ...row };
    const updated = repositories.payroll.update(row.id, { status: 'confirmed' });
    if (updated) recordChangeLog({ entityType: 'payroll', entityId: row.id, action: 'confirm', before, after: updated });
    loadPayrollRows();
  };

  const rollback = (row: Payroll) => {
    const role = repositories.users.getAll()[0]?.role;
    if (!['owner', 'admin'].includes(role)) return;
    const before = { ...row };
    const updated = repositories.payroll.update(row.id, { status: 'draft' });
    if (updated) recordChangeLog({ entityType: 'payroll', entityId: row.id, action: 'update', before, after: updated });
    loadPayrollRows();
  };

  const filteredRows: PayrollRow[] = rows
    .filter((row) => {
      const driver = repositories.drivers.getById(row.driverId);
      const byMonth = row.settlementMonth === month;
      const byStatus = statusFilter === 'all' || row.status === statusFilter;
      const bySearch = (driver?.name ?? '').toLowerCase().includes(search.toLowerCase());
      return byMonth && byStatus && bySearch;
    })
    .map((row) => {
      const driver = repositories.drivers.getById(row.driverId);
      return {
        ...row,
        id: row.id,
        driverName: driver?.name ?? '-',
        driverPhone: driver?.phone ?? '-',
      };
    });

  const downloadCsv = () => {
    const data = filteredRows.map((row) => {
      const items = getItems(row.id);
      const byType = (type: PayrollItem['itemType']) => items.find((x) => x.itemType === type)?.amount ?? 0;
      return [row.driverName, row.settlementMonth, byType('BASIC'), byType('ATTENDANCE_BONUS'), byType('RUN_ALLOWANCE'), row.totalEarnings, row.totalDeductions, row.netAmount].join(',');
    });
    const csv = ['기사명,월,BASIC,ATTENDANCE_BONUS,RUN_ALLOWANCE,총지급,총공제,실수령액', ...data].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `급여정산-${month}.csv`;
    link.click();
  };

  const selectedItems = selected ? getItems(selected.id) : [];
  const selectedRuns: Run[] = selected
    ? repositories.runs.getAll().filter((run) => run.driverId === selected.driverId && String(run.serviceDate).startsWith(selected.settlementMonth))
    : [];
  const routeNameById = Object.fromEntries(repositories.routes.getAll().map((route) => [route.id, route.name]));
  const selectedDriver = selected ? repositories.drivers.getById(selected.driverId) : undefined;

  return (
    <SidebarLayout sidebar={<Sidebar items={navItems} title={t('common.appName')} />} header={<Header title={t('nav.payroll')} />}>
      <PageContent>
        <Grid columns={3} className="mb-4">
          <StatCard label="정산 건수" value={filteredRows.length} />
          <StatCard label="임시저장" value={filteredRows.filter((row) => row.status === 'draft').length} />
          <StatCard label="확정" value={filteredRows.filter((row) => row.status === 'confirmed').length} />
        </Grid>

        <div className="mb-4 flex gap-2">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-input px-3 py-2 text-sm" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="기사명 검색" className="rounded-lg border border-input px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-lg border border-input px-3 py-2 text-sm">
            <option value="all">전체 상태</option>
            <option value="draft">임시저장</option>
            <option value="confirmed">확정</option>
          </select>
          <Button onClick={generate}>월 정산 생성</Button>
          <Button variant="outline" onClick={downloadCsv}>엑셀 다운로드</Button>
        </div>

        <DataList<PayrollRow>
          data={filteredRows}
          columns={[
            { key: 'driverName', label: '기사명' },
            { key: 'driverPhone', label: '연락처' },
            { key: 'status', label: '상태', render: (value) => <Badge>{getPayrollStatusLabel(value)}</Badge> },
            { key: 'netAmount', label: '실수령액', render: (value) => formatKRW(Number(value)) },
          ]}
          actions={(row) => (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelected(row)}>명세서 보기</Button>
              {row.status === 'draft' ? (
                <Button size="sm" onClick={() => confirm(row)}>확정</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => rollback(row)}>임시저장으로</Button>
              )}
            </div>
          )}
        />

        <PayrollStatementModal
          payroll={selected}
          driverName={selectedDriver?.name ?? '-'}
          driverPhone={selectedDriver?.phone ?? '-'}
          payrollItems={selectedItems}
          runs={selectedRuns}
          routeNameById={routeNameById}
          onClose={() => setSelected(null)}
        />
      </PageContent>
    </SidebarLayout>
  );
}
