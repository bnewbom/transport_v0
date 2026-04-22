'use client';

import { repositories } from '@/lib/repository';

const SEED_KEY = 'transport_v0_seed_v2';

const now = () => new Date().toISOString();

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  const seeded = localStorage.getItem(SEED_KEY);
  if (seeded) return;

  const routes = [
    { id: 'route-seed-1', name: '서울-인천-오전-출근', startLocation: '서울', endLocation: '인천', distance: 38, estimatedTime: 70, baseRate: 80000, status: 'active' as const, weekdayMask: 62, shiftType: 'day' as const, timeSlot: 'am' as const, commuteType: 'goWork' as const, baseAllowanceAmount: 80000 },
    { id: 'route-seed-2', name: '서울-수원-오후-퇴근', startLocation: '서울', endLocation: '수원', distance: 32, estimatedTime: 60, baseRate: 76000, status: 'active' as const, weekdayMask: 62, shiftType: 'day' as const, timeSlot: 'pm' as const, commuteType: 'offWork' as const, baseAllowanceAmount: 76000 },
    { id: 'route-seed-3', name: '서울-천안-오전-출근', startLocation: '서울', endLocation: '천안', distance: 95, estimatedTime: 120, baseRate: 120000, status: 'active' as const, weekdayMask: 124, shiftType: 'night' as const, timeSlot: 'am' as const, commuteType: 'goWork' as const, baseAllowanceAmount: 120000 },
    { id: 'route-seed-4', name: '인천-평택-오후-퇴근', startLocation: '인천', endLocation: '평택', distance: 84, estimatedTime: 110, baseRate: 115000, status: 'active' as const, weekdayMask: 31, shiftType: 'night' as const, timeSlot: 'pm' as const, commuteType: 'offWork' as const, baseAllowanceAmount: 115000 },
    { id: 'route-seed-5', name: '서울-용인-오전-출근', startLocation: '서울', endLocation: '용인', distance: 44, estimatedTime: 80, baseRate: 88000, status: 'active' as const, weekdayMask: 127, shiftType: 'day' as const, timeSlot: 'am' as const, commuteType: 'goWork' as const, baseAllowanceAmount: 88000 },
    { id: 'route-seed-6', name: '서울-대전-오후-퇴근', startLocation: '서울', endLocation: '대전', distance: 150, estimatedTime: 150, baseRate: 160000, status: 'inactive' as const, weekdayMask: 62, shiftType: 'day' as const, timeSlot: 'pm' as const, commuteType: 'offWork' as const, baseAllowanceAmount: 160000 },
  ];

  const clients = [
    { id: 'client-seed-1', name: '한빛물류', phone: '010-1001-1001', address: '서울 금천구', status: 'active' as const, createdAt: now() },
    { id: 'client-seed-2', name: '대성유통', phone: '010-1002-1002', address: '경기 수원시', status: 'active' as const, createdAt: now() },
    { id: 'client-seed-3', name: '푸른상사', phone: '010-1003-1003', address: '인천 남동구', status: 'inactive' as const, createdAt: now() },
  ];

  const drivers = Array.from({ length: 10 }).map((_, i) => ({
    id: `driver-seed-${i + 1}`,
    name: `기사${i + 1}`,
    phone: `010-20${String(i).padStart(2, '0')}-20${String(i).padStart(2, '0')}`,
    licenseNumber: `LIC-${1000 + i}`,
    status: (i === 7 ? 'leave' : i === 8 ? 'resigned' : i === 9 ? 'inactive' : 'active') as 'active' | 'leave' | 'resigned' | 'inactive',
    joinDate: now(),
    defaultRouteId: i < 6 ? routes[i % 5].id : undefined,
  }));

  if (repositories.routes.getAll().length < 5) routes.forEach((r) => repositories.routes.create(r));
  if (repositories.clients.getAll().length < 2) clients.forEach((c) => repositories.clients.create(c));
  if (repositories.drivers.getAll().length < 8) drivers.forEach((d) => repositories.drivers.create(d));

  const today = new Date().toISOString().slice(0, 10);
  const hasToday = repositories.dispatches.getAll().some((d) => (d.serviceDate ?? d.scheduledDate ?? '').toString().slice(0, 10) === today);
  if (!hasToday) {
    repositories.routes.getAll().filter((r) => r.status === 'active').slice(0, 3).forEach((route, idx) => {
      const driver = repositories.drivers.getAll().find((d) => d.status === 'active' && d.defaultRouteId === route.id);
      repositories.dispatches.create({
        routeId: route.id,
        plannedDriverId: driver?.id ?? null,
        driverId: driver?.id,
        clientId: repositories.clients.getAll()[idx % repositories.clients.getAll().length]?.id,
        serviceDate: today,
        scheduledDate: today,
        scheduledTime: route.shiftType === 'night' ? '20:00' : '08:00',
        shiftSlot: route.shiftType === 'night' ? 'pm' : 'am',
        status: 'draft',
        createdAt: now(),
      });
    });
  }

  localStorage.setItem(SEED_KEY, '1');
}
