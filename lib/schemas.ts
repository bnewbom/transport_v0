import { z } from 'zod';

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string(),
  address: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.coerce.date(),
});

export const DriverSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  phone: z.string(),
  licenseNumber: z.string(),
  status: z.enum(['active', 'inactive', 'on-leave']),
  joinDate: z.coerce.date(),
  bankAccount: z.string().optional(),
  accountHolder: z.string().optional(),
});

export const RouteSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  startLocation: z.string(),
  endLocation: z.string(),
  distance: z.number().positive(),
  estimatedTime: z.number().positive(),
  baseRate: z.number().positive(),
  status: z.enum(['active', 'inactive']),
});

export const DispatchSchema = z.object({
  id: z.string(),
  routeId: z.string(),
  driverId: z.string(),
  clientId: z.string(),
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string(),
  status: z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const OperationLogSchema = z.object({
  id: z.string(),
  dispatchId: z.string(),
  driverId: z.string(),
  routeId: z.string(),
  actualStartTime: z.coerce.date().optional(),
  actualEndTime: z.coerce.date().optional(),
  fuelUsed: z.number().optional(),
  distance: z.number().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
});

export const PayrollSlipSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  period: z.string(),
  baseAmount: z.number().nonnegative(),
  bonusAmount: z.number().nonnegative(),
  deductions: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  status: z.enum(['draft', 'approved', 'paid']),
  createdAt: z.coerce.date(),
});

export const FinancialRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  category: z.enum(['route-revenue', 'fuel', 'maintenance', 'salary', 'insurance', 'other']),
  description: z.string(),
  amount: z.number().positive(),
  date: z.coerce.date(),
  reference: z.string().optional(),
});

export const ActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['dispatch', 'operation', 'payment', 'route', 'driver', 'financial']),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  userId: z.string().optional(),
  timestamp: z.coerce.date(),
});

export type Client = z.infer<typeof ClientSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type Dispatch = z.infer<typeof DispatchSchema>;
export type OperationLog = z.infer<typeof OperationLogSchema>;
export type PayrollSlip = z.infer<typeof PayrollSlipSchema>;
export type FinancialRecord = z.infer<typeof FinancialRecordSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
