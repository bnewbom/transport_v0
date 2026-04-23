'use client';

import { BaseRepository } from './base';
import { ChangeLog, Client, Company, Dispatch, Driver, Payroll, PayrollItem, Route, Run, User } from '@/lib/schemas';

const now = () => new Date().toISOString();

class SoftRepository<T extends { id: string; status?: string }> extends BaseRepository<T> {
  delete(id: string): boolean {
    const item = this.getById(id);
    if (!item) return false;
    if ('status' in item) {
      this.update(id, { status: 'inactive' } as Partial<Omit<T, 'id'>>);
      return true;
    }
    return super.delete(id);
  }
}

class CompanyRepository extends BaseRepository<Company> {}
class UserRepository extends BaseRepository<User> {}
class ClientRepository extends SoftRepository<Client> {}
class DriverRepository extends SoftRepository<Driver> {}
class RouteRepository extends SoftRepository<Route> {}
class DispatchRepository extends BaseRepository<Dispatch> {}
class RunRepository extends BaseRepository<Run> {}
class PayrollRepository extends BaseRepository<Payroll> {}
class PayrollItemRepository extends BaseRepository<PayrollItem> {}
class ChangeLogRepository extends BaseRepository<ChangeLog> {}

export const repositories = {
  company: new CompanyRepository('company', [{ id: 'company-1', name: '운송 허브', allowedHolidaysPerMonth: 2, defaultBasicSalary: 2400000 }]),
  users: new UserRepository('users', [{ id: 'user-1', name: '관리자', role: 'owner' }]),
  clients: new ClientRepository('clients', []),
  drivers: new DriverRepository('drivers', []),
  routes: new RouteRepository('routes', []),
  dispatches: new DispatchRepository('dispatches', []),
  runs: new RunRepository('runs', []),
  payroll: new PayrollRepository('payroll', []),
  payrollItems: new PayrollItemRepository('payroll_items', []),
  changeLogs: new ChangeLogRepository('change_logs', []),
};

export const recordChangeLog = (entry: Omit<ChangeLog, 'id' | 'createdAt'>) => {
  repositories.changeLogs.create({ ...entry, createdAt: now() });
};
