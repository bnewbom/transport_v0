import { z } from 'zod';

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  allowedHolidaysPerMonth: z.number().default(2),
  defaultBasicSalary: z.number().default(2400000),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(['owner', 'admin', 'manager']).default('owner'),
});

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string(),
  address: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.any(),
});

export const DriverSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string(),
  licenseNumber: z.string(),
  status: z.enum(['active', 'inactive', 'on-leave', 'leave', 'resigned']),
  joinDate: z.any(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
  defaultRouteId: z.string().optional(),
  routeIds: z.array(z.string()).optional(),
  resignedAt: z.any().optional(),
  basicSalaryOverride: z.number().optional(),
});

export const RouteSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startLocation: z.string(),
  endLocation: z.string(),
  distance: z.number().nonnegative(),
  estimatedTime: z.number().nonnegative(),
  baseRate: z.number().nonnegative(),
  status: z.enum(['active', 'inactive']),
  weekdayMask: z.number().int().min(0).max(127).default(127),
  shiftType: z.enum(['day', 'night']).default('day'),
  commuteType: z.enum(['goWork', 'offWork']).default('goWork'),
  baseAllowanceAmount: z.number().nonnegative().default(0),
  effectiveFrom: z.any().optional(),
  effectiveTo: z.any().optional(),
});

export const DispatchSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  driverId: z.string().optional(),
  plannedDriverId: z.string().nullable().optional(),
  clientId: z.string().optional(),
  serviceDate: z.any().optional(),
  scheduledDate: z.any().optional(),
  scheduledTime: z.string().optional(),
  shiftSlot: z.enum(['am', 'pm']).default('am'),
  status: z.enum(['draft', 'published', 'closed', 'canceled', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
  createdAt: z.any(),
});

export const RunSchema = z.object({
  id: z.string(),
  dispatchId: z.string(),
  routeId: z.string(),
  driverId: z.string().nullable(),
  serviceDate: z.any(),
  allowanceAmount: z.number().nonnegative(),
  status: z.enum(['completed', 'absence', 'holiday', 'canceled', 'replacement']),
  confirmedAt: z.any().optional(),
  confirmedBy: z.string().optional(),
});

export const PayrollItemSchema = z.object({
  id: z.string(),
  payrollId: z.string(),
  itemType: z.enum(['BASIC', 'ATTENDANCE_BONUS', 'RUN_ALLOWANCE', 'DEDUCTION']),
  amount: z.number(),
  note: z.string().optional(),
});

export const PayrollSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  settlementMonth: z.string(),
  status: z.enum(['draft', 'confirmed']),
  allowedHolidaysPerMonth: z.number().default(2),
  absenceCount: z.number().default(0),
  totalEarnings: z.number().default(0),
  totalDeductions: z.number().default(0),
  netAmount: z.number().default(0),
  createdAt: z.any(),
});

export const ChangeLogSchema = z.object({
  id: z.string(),
  entityType: z.enum(['dispatch', 'run', 'payroll', 'driver']),
  entityId: z.string(),
  action: z.enum(['create', 'update', 'confirm', 'cancel']),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  createdAt: z.any(),
});


export const OperationLogSchema = z.object({ id: z.string(), dispatchId: z.string(), driverId: z.string(), routeId: z.string(), status: z.string(), createdAt: z.any() });
export const PayrollSlipSchema = z.object({ id: z.string(), driverId: z.string(), period: z.string(), baseAmount: z.number(), bonusAmount: z.number(), deductions: z.number(), totalAmount: z.number(), status: z.string(), createdAt: z.any() });
export const FinancialRecordSchema = z.object({ id: z.string(), type: z.string(), category: z.string(), description: z.string(), amount: z.number(), date: z.any() });
export const ActivitySchema = z.object({ id: z.string(), type: z.string(), action: z.string(), entityType: z.string(), entityId: z.string(), timestamp: z.any() });
export type Company = z.infer<typeof CompanySchema>;
export type User = z.infer<typeof UserSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Dispatch = z.infer<typeof DispatchSchema>;
export type Run = z.infer<typeof RunSchema>;
export type Payroll = z.infer<typeof PayrollSchema>;
export type PayrollItem = z.infer<typeof PayrollItemSchema>;
export type ChangeLog = z.infer<typeof ChangeLogSchema>;
export type OperationLog = z.infer<typeof OperationLogSchema>;
export type PayrollSlip = z.infer<typeof PayrollSlipSchema>;
export type FinancialRecord = z.infer<typeof FinancialRecordSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
