'use client';

import { BaseRepository } from './base';
import {
  Client,
  Driver,
  Route,
  Dispatch,
  OperationLog,
  PayrollSlip,
  FinancialRecord,
} from '@/lib/schemas';
import { initializeMockData, dataService } from '@/lib/data-service';

class ClientRepository extends BaseRepository<Client> {
  constructor() {
    super('clients', []);
    if (this.data.length === 0) {
      this.data = dataService.getClients();
      this.saveToStorage();
    }
  }
}

class DriverRepository extends BaseRepository<Driver> {
  constructor() {
    super('drivers', []);
    if (this.data.length === 0) {
      this.data = dataService.getDrivers();
      this.saveToStorage();
    }
  }
}

class RouteRepository extends BaseRepository<Route> {
  constructor() {
    super('routes', []);
    if (this.data.length === 0) {
      this.data = dataService.getRoutes();
      this.saveToStorage();
    }
  }
}

class DispatchRepository extends BaseRepository<Dispatch> {
  constructor() {
    super('dispatches', []);
    if (this.data.length === 0) {
      this.data = dataService.getDispatches();
      this.saveToStorage();
    }
  }
}

class OperationLogRepository extends BaseRepository<OperationLog> {
  constructor() {
    super('operationLogs', []);
    if (this.data.length === 0) {
      this.data = dataService.getOperationLogs();
      this.saveToStorage();
    }
  }
}

class PayrollSlipRepository extends BaseRepository<PayrollSlip> {
  constructor() {
    super('payrollSlips', []);
    if (this.data.length === 0) {
      this.data = dataService.getPayrollSlips();
      this.saveToStorage();
    }
  }
}

class FinancialRecordRepository extends BaseRepository<FinancialRecord> {
  constructor() {
    super('financialRecords', []);
    if (this.data.length === 0) {
      this.data = dataService.getFinancialRecords();
      this.saveToStorage();
    }
  }
}

// Export singleton instances
export const repositories = {
  clients: new ClientRepository(),
  drivers: new DriverRepository(),
  routes: new RouteRepository(),
  dispatches: new DispatchRepository(),
  operationLogs: new OperationLogRepository(),
  payrollSlips: new PayrollSlipRepository(),
  financialRecords: new FinancialRecordRepository(),
};
