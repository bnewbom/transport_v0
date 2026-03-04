import { Client, Driver, Route, Dispatch, OperationLog, PayrollSlip, FinancialRecord, Activity } from './schemas';

// Mock Data Storage
const mockData = {
  clients: [] as Client[],
  drivers: [] as Driver[],
  routes: [] as Route[],
  dispatches: [] as Dispatch[],
  operationLogs: [] as OperationLog[],
  payrollSlips: [] as PayrollSlip[],
  financialRecords: [] as FinancialRecord[],
  activities: [] as Activity[],
};

// Initialize Mock Data
export function initializeMockData() {
  // Clients
  mockData.clients = [
    {
      id: 'C001',
      name: '서울익스프레스',
      phone: '02-1234-5678',
      address: '서울시 강남구',
      status: 'active',
      createdAt: new Date('2023-01-15'),
    },
    {
      id: 'C002',
      name: '부산물류',
      phone: '051-1234-5678',
      address: '부산시 중구',
      status: 'active',
      createdAt: new Date('2023-02-20'),
    },
    {
      id: 'C003',
      name: '인천트레이드',
      phone: '032-1234-5678',
      address: '인천시 남동구',
      status: 'active',
      createdAt: new Date('2023-03-10'),
    },
    {
      id: 'C004',
      name: '대구유통',
      phone: '053-1234-5678',
      address: '대구시 중구',
      status: 'inactive',
      createdAt: new Date('2023-04-05'),
    },
    {
      id: 'C005',
      name: '광주서비스',
      phone: '062-1234-5678',
      address: '광주시 동구',
      status: 'active',
      createdAt: new Date('2023-05-12'),
    },
    {
      id: 'C006',
      name: '대전운송',
      phone: '042-1234-5678',
      address: '대전시 중구',
      status: 'active',
      createdAt: new Date('2023-06-08'),
    },
    {
      id: 'C007',
      name: '울산화물',
      phone: '052-1234-5678',
      address: '울산시 중구',
      status: 'active',
      createdAt: new Date('2023-07-18'),
    },
  ];

  // Drivers
  mockData.drivers = [
    {
      id: 'D001',
      name: '김민준',
      phone: '010-1111-1111',
      licenseNumber: 'DL-2020-123456',
      status: 'active',
      joinDate: new Date('2020-05-10'),
      bankAccount: '123-456-789012',
      accountHolder: '김민준',
    },
    {
      id: 'D002',
      name: '이성호',
      phone: '010-2222-2222',
      licenseNumber: 'DL-2021-234567',
      status: 'active',
      joinDate: new Date('2021-03-15'),
      bankAccount: '234-567-890123',
      accountHolder: '이성호',
    },
    {
      id: 'D003',
      name: '박지원',
      phone: '010-3333-3333',
      licenseNumber: 'DL-2022-345678',
      status: 'on-leave',
      joinDate: new Date('2022-07-20'),
      bankAccount: '345-678-901234',
      accountHolder: '박지원',
    },
    {
      id: 'D004',
      name: '최태오',
      phone: '010-4444-4444',
      licenseNumber: 'DL-2023-456789',
      status: 'active',
      joinDate: new Date('2023-01-10'),
      bankAccount: '456-789-012345',
      accountHolder: '최태오',
    },
    {
      id: 'D005',
      name: '정해일',
      phone: '010-5555-5555',
      licenseNumber: 'DL-2019-567890',
      status: 'inactive',
      joinDate: new Date('2019-11-05'),
      bankAccount: '567-890-123456',
      accountHolder: '정해일',
    },
  ];

  // Routes
  mockData.routes = [
    {
      id: 'R001',
      name: '서울-인천',
      startLocation: '서울',
      endLocation: '인천',
      distance: 45,
      estimatedTime: 60,
      baseRate: 85000,
      status: 'active',
    },
    {
      id: 'R002',
      name: '서울-대전',
      startLocation: '서울',
      endLocation: '대전',
      distance: 160,
      estimatedTime: 180,
      baseRate: 185000,
      status: 'active',
    },
    {
      id: 'R003',
      name: '서울-부산',
      startLocation: '서울',
      endLocation: '부산',
      distance: 395,
      estimatedTime: 480,
      baseRate: 425000,
      status: 'active',
    },
    {
      id: 'R004',
      name: '부산-대구',
      startLocation: '부산',
      endLocation: '대구',
      distance: 150,
      estimatedTime: 150,
      baseRate: 165000,
      status: 'active',
    },
    {
      id: 'R005',
      name: '대구-광주',
      startLocation: '대구',
      endLocation: '광주',
      distance: 180,
      estimatedTime: 200,
      baseRate: 195000,
      status: 'inactive',
    },
  ];

  // Dispatches (May 2023)
  const may1 = new Date('2023-05-01');
  mockData.dispatches = [
    {
      id: 'DP001',
      routeId: 'R001',
      driverId: 'D001',
      clientId: 'C001',
      scheduledDate: new Date(may1.getTime()),
      scheduledTime: '08:00',
      status: 'completed',
      createdAt: new Date('2023-04-30'),
    },
    {
      id: 'DP002',
      routeId: 'R003',
      driverId: 'D002',
      clientId: 'C002',
      scheduledDate: new Date(may1.getTime()),
      scheduledTime: '06:00',
      status: 'completed',
      createdAt: new Date('2023-04-30'),
    },
    {
      id: 'DP003',
      routeId: 'R002',
      driverId: 'D001',
      clientId: 'C003',
      scheduledDate: new Date('2023-05-02'),
      scheduledTime: '09:00',
      status: 'completed',
      createdAt: new Date('2023-05-01'),
    },
    {
      id: 'DP004',
      routeId: 'R001',
      driverId: 'D004',
      clientId: 'C001',
      scheduledDate: new Date('2023-05-02'),
      scheduledTime: '14:00',
      status: 'completed',
      createdAt: new Date('2023-05-01'),
    },
    {
      id: 'DP005',
      routeId: 'R004',
      driverId: 'D002',
      clientId: 'C002',
      scheduledDate: new Date('2023-05-03'),
      scheduledTime: '07:00',
      status: 'completed',
      createdAt: new Date('2023-05-02'),
    },
  ];

  // Operation Logs (May 2023)
  mockData.operationLogs = [
    {
      id: 'OL001',
      dispatchId: 'DP001',
      driverId: 'D001',
      routeId: 'R001',
      actualStartTime: new Date('2023-05-01T08:15:00'),
      actualEndTime: new Date('2023-05-01T09:30:00'),
      fuelUsed: 5.2,
      distance: 45,
      status: 'completed',
      createdAt: new Date('2023-05-01'),
    },
    {
      id: 'OL002',
      dispatchId: 'DP002',
      driverId: 'D002',
      routeId: 'R003',
      actualStartTime: new Date('2023-05-01T06:30:00'),
      actualEndTime: new Date('2023-05-01T15:45:00'),
      fuelUsed: 38.5,
      distance: 395,
      status: 'completed',
      createdAt: new Date('2023-05-01'),
    },
  ];

  // Payroll Slips (May 2023)
  mockData.payrollSlips = [
    {
      id: 'PS001',
      driverId: 'D001',
      period: '2023-05',
      baseAmount: 3000000,
      bonusAmount: 250000,
      deductions: 300000,
      totalAmount: 2950000,
      status: 'approved',
      createdAt: new Date('2023-05-30'),
    },
    {
      id: 'PS002',
      driverId: 'D002',
      period: '2023-05',
      baseAmount: 3000000,
      bonusAmount: 300000,
      deductions: 300000,
      totalAmount: 3000000,
      status: 'approved',
      createdAt: new Date('2023-05-30'),
    },
    {
      id: 'PS003',
      driverId: 'D004',
      period: '2023-05',
      baseAmount: 2500000,
      bonusAmount: 150000,
      deductions: 250000,
      totalAmount: 2400000,
      status: 'draft',
      createdAt: new Date('2023-05-30'),
    },
  ];

  // Financial Records (May 2023)
  mockData.financialRecords = [
    { id: 'FR001', type: 'income', category: 'route-revenue', description: 'Route R001 - 5 trips', amount: 425000, date: new Date('2023-05-05'), reference: 'DP001-DP005' },
    { id: 'FR002', type: 'income', category: 'route-revenue', description: 'Route R003 - 2 trips', amount: 850000, date: new Date('2023-05-06'), reference: 'DP002' },
    { id: 'FR003', type: 'income', category: 'route-revenue', description: 'Route R002 - 3 trips', amount: 555000, date: new Date('2023-05-10'), reference: 'DP003-DP004' },
    { id: 'FR004', type: 'income', category: 'route-revenue', description: 'Route R004 - 4 trips', amount: 660000, date: new Date('2023-05-15'), reference: 'DP005' },
    { id: 'FR005', type: 'income', category: 'route-revenue', description: 'May operations income', amount: 48905000, date: new Date('2023-05-25') },
    
    { id: 'FR006', type: 'expense', category: 'salary', description: 'Driver salaries & bonuses', amount: 8350000, date: new Date('2023-05-31') },
    { id: 'FR007', type: 'expense', category: 'fuel', description: 'Fuel costs May', amount: 12450000, date: new Date('2023-05-30') },
    { id: 'FR008', type: 'expense', category: 'maintenance', description: 'Vehicle maintenance', amount: 2850000, date: new Date('2023-05-28') },
    { id: 'FR009', type: 'expense', category: 'insurance', description: 'Monthly insurance premium', amount: 1850000, date: new Date('2023-05-05') },
    { id: 'FR010', type: 'expense', category: 'other', description: 'Office supplies & misc', amount: 650000, date: new Date('2023-05-20') },
    { id: 'FR011', type: 'expense', category: 'maintenance', description: 'Tire replacements', amount: 450000, date: new Date('2023-05-18') },
    { id: 'FR012', type: 'expense', category: 'fuel', description: 'Fuel card top-up', amount: 5000000, date: new Date('2023-05-10') },
    { id: 'FR013', type: 'expense', category: 'other', description: 'Parking fees & tolls', amount: 399000, date: new Date('2023-05-25') },
  ];

  // Activities
  mockData.activities = [
    { id: 'A001', type: 'dispatch', action: '배차가 등록되었습니다', entityType: 'Dispatch', entityId: 'DP001', timestamp: new Date('2023-05-01T08:00:00') },
    { id: 'A002', type: 'operation', action: '운영 로그가 완료되었습니다', entityType: 'OperationLog', entityId: 'OL001', timestamp: new Date('2023-05-01T09:30:00') },
    { id: 'A003', type: 'payment', action: '급여 정산이 승인되었습니다', entityType: 'PayrollSlip', entityId: 'PS001', timestamp: new Date('2023-05-30T14:00:00') },
    { id: 'A004', type: 'financial', action: '수입이 기록되었습니다', entityType: 'FinancialRecord', entityId: 'FR005', timestamp: new Date('2023-05-25T10:30:00') },
  ];
}

// Service Layer
export const dataService = {
  // Clients
  getClients: () => mockData.clients,
  getClientById: (id: string) => mockData.clients.find(c => c.id === id),
  createClient: (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: `C${String(mockData.clients.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
    };
    mockData.clients.push(newClient);
    return newClient;
  },

  // Drivers
  getDrivers: () => mockData.drivers,
  getDriverById: (id: string) => mockData.drivers.find(d => d.id === id),
  
  // Routes
  getRoutes: () => mockData.routes,
  getRouteById: (id: string) => mockData.routes.find(r => r.id === id),

  // Dispatches
  getDispatches: () => mockData.dispatches,
  getDispatchById: (id: string) => mockData.dispatches.find(d => d.id === id),
  getDispatchesByDate: (date: Date) => 
    mockData.dispatches.filter(d => d.scheduledDate.toDateString() === date.toDateString()),

  // Operation Logs
  getOperationLogs: () => mockData.operationLogs,
  getOperationLogByDispatchId: (dispatchId: string) => 
    mockData.operationLogs.find(ol => ol.dispatchId === dispatchId),

  // Payroll
  getPayrollSlips: () => mockData.payrollSlips,
  getPayrollSlipsByPeriod: (period: string) => 
    mockData.payrollSlips.filter(ps => ps.period === period),

  // Financial
  getFinancialRecords: () => mockData.financialRecords,
  getFinancialRecordsByType: (type: 'income' | 'expense') =>
    mockData.financialRecords.filter(fr => fr.type === type),
  getFinancialRecordsByDateRange: (startDate: Date, endDate: Date) =>
    mockData.financialRecords.filter(fr => fr.date >= startDate && fr.date <= endDate),

  // Activities
  getActivities: () => mockData.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  getRecentActivities: (limit: number = 10) => mockData.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit),

  // Dashboard Stats
  getDashboardStats: () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const incomeRecords = mockData.financialRecords.filter(
      fr => fr.type === 'income' && fr.date >= monthStart && fr.date <= monthEnd
    );
    const expenseRecords = mockData.financialRecords.filter(
      fr => fr.type === 'expense' && fr.date >= monthStart && fr.date <= monthEnd
    );

    return {
      totalIncome: incomeRecords.reduce((sum, r) => sum + r.amount, 0),
      totalExpense: expenseRecords.reduce((sum, r) => sum + r.amount, 0),
      activeDispatches: mockData.dispatches.filter(d => d.status === 'in-progress').length,
      completedToday: mockData.dispatches.filter(d => 
        d.status === 'completed' && d.scheduledDate.toDateString() === now.toDateString()
      ).length,
      pendingPayrolls: mockData.payrollSlips.filter(ps => ps.status === 'draft').length,
      activeRoutes: mockData.routes.filter(r => r.status === 'active').length,
      activeDrivers: mockData.drivers.filter(d => d.status === 'active').length,
    };
  },
};

// Initialize on import
if (typeof window !== 'undefined') {
  initializeMockData();
}
