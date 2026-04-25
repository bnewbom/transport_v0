'use client';

import { repositories } from '@/lib/repository';

const SEED_KEY = 'transport_v0_seed_v3';
const RESET_KEY = SEED_KEY; // backward compatibility for legacy references
const now = () => new Date().toISOString();

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY) || localStorage.getItem(RESET_KEY)) return;

  if (repositories.routes.getAll().length === 0) {
    repositories.routes.create({
      name: '서울-인천:[주간/출근]',
      startLocation: '서울',
      endLocation: '인천',
      distance: 35,
      estimatedTime: 70,
      baseRate: 80000,
      status: 'active',
      weekdayMask: 62,
      shiftType: 'day',
      commuteType: 'goWork',
      baseAllowanceAmount: 80000,
      effectiveFrom: now().slice(0, 10),
    });
    repositories.routes.create({
      name: '동탄-수원:[주간/출근]',
      startLocation: '동탄',
      endLocation: '수원',
      distance: 28,
      estimatedTime: 55,
      baseRate: 72000,
      status: 'active',
      weekdayMask: 62,
      shiftType: 'day',
      commuteType: 'goWork',
      baseAllowanceAmount: 72000,
      effectiveFrom: now().slice(0, 10),
    });
    repositories.routes.create({
      name: '평택-천안:[야간/퇴근]',
      startLocation: '평택',
      endLocation: '천안',
      distance: 42,
      estimatedTime: 75,
      baseRate: 95000,
      status: 'active',
      weekdayMask: 124,
      shiftType: 'night',
      commuteType: 'offWork',
      baseAllowanceAmount: 95000,
      effectiveFrom: now().slice(0, 10),
    });
  }

  if (repositories.drivers.getAll().length === 0) {
    const [route1, route2, route3] = repositories.routes.getAll();
    repositories.drivers.create({
      name: '김민준',
      phone: '010-3000-0001',
      licenseNumber: 'LIC-KMJ-1001',
      status: 'active',
      joinDate: now(),
      defaultRouteId: route1?.id,
    });
    repositories.drivers.create({
      name: '이성호',
      phone: '010-3000-0002',
      licenseNumber: 'LIC-LSH-1002',
      status: 'active',
      joinDate: now(),
      defaultRouteId: route2?.id,
    });
    repositories.drivers.create({
      name: '박지원',
      phone: '010-3000-0003',
      licenseNumber: 'LIC-PJW-1003',
      status: 'active',
      joinDate: now(),
      defaultRouteId: route3?.id,
    });
  }

  localStorage.setItem(SEED_KEY, '1');
  localStorage.setItem(RESET_KEY, '1');
}
