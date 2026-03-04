/* Core Entity Types */

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'on-leave';
  joinDate: Date;
  bankAccount?: string;
  accountHolder?: string;
}

export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distance: number; // km
  estimatedTime: number; // minutes
  baseRate: number; // KRW
  status: 'active' | 'inactive';
}

export interface Dispatch {
  id: string;
  routeId: string;
  driverId: string;
  clientId: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
}

export interface OperationLog {
  id: string;
  dispatchId: string;
  driverId: string;
  routeId: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  fuelUsed?: number; // liters
  distance?: number; // km actual
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  createdAt: Date;
}

export interface PayrollSlip {
  id: string;
  driverId: string;
  period: string; // YYYY-MM
  baseAmount: number; // KRW
  bonusAmount: number; // KRW
  deductions: number; // KRW
  totalAmount: number; // KRW
  status: 'draft' | 'approved' | 'paid';
  createdAt: Date;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: 'route-revenue' | 'fuel' | 'maintenance' | 'salary' | 'insurance' | 'other';
  description: string;
  amount: number; // KRW
  date: Date;
  reference?: string;
}

export interface Activity {
  id: string;
  type: 'dispatch' | 'operation' | 'payment' | 'route' | 'driver' | 'financial';
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  timestamp: Date;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  activeDispatches: number;
  completedToday: number;
  pendingPayrolls: number;
  activeRoutes: number;
  activeDrivers: number;
}

export interface FilterOptions {
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}
