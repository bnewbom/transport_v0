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
class DispatchRepository extends SoftRepository<Dispatch> {}
class RunRepository extends BaseRepository<Run> {}
class PayrollRepository extends BaseRepository<Payroll> {}
class PayrollItemRepository extends BaseRepository<PayrollItem> {}
class ChangeLogRepository extends BaseRepository<ChangeLog> {}

export const repositories = {
  company: new CompanyRepository('company', [{ id: 'company-1', name: '운송 허브', allowedHolidaysPerMonth: 2, defaultBasicSalary: 2400000 }]),
  users: new UserRepository('users', [{ id: 'user-1', name: '관리자', role: 'owner' }]),
  clients: new ClientRepository('clients', [
    { id: 'client-1', name: '한빛물류', phone: '010-1111-1111', address: '서울', status: 'active', createdAt: now() },
  ]),
  drivers: new DriverRepository('drivers', [
    { id: 'driver-1', name: '김기사', phone: '010-2222-2222', licenseNumber: 'A123', status: 'active', joinDate: now() },
  ]),
  routes: new RouteRepository('routes', [
    { id: 'route-1', name: '서울-인천', startLocation: '서울', endLocation: '인천', distance: 35, estimatedTime: 70, baseRate: 80000, status: 'active', weekdayMask: 62, shiftType: 'day', baseAllowanceAmount: 80000, effectiveFrom: now().slice(0, 10) },
  ]),
  dispatches: new DispatchRepository('dispatches', []),
  runs: new RunRepository('runs', []),
  payroll: new PayrollRepository('payroll', []),
  payrollItems: new PayrollItemRepository('payroll_items', []),
  changeLogs: new ChangeLogRepository('change_logs', []),
};

export const recordChangeLog = (entry: Omit<ChangeLog, 'id' | 'createdAt'>) => {
  repositories.changeLogs.create({ ...entry, createdAt: now() });
};
