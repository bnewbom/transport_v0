'use client';

import { repositories } from '@/lib/repository';

const SEED_KEY = 'transport_v0_seed_v4';
const RESET_KEY = SEED_KEY; // backward compatibility for legacy references
const now = () => new Date().toISOString();

const routeSeeds = [
  { name: '건대-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '건대1-:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '건대2-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '남오산-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '노원-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '노원-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '동탄2-2-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '동탄1-1-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '동탄1-2-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '동탄1-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '동탄2-1-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '병점-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '병점-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '북수원-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '북수원1-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '사당-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '사당과천-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '상봉면목-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '석계상봉-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '석계태능-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '수원역-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '수원역-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },
  { name: '호매실-동탄센터:[야간/출근]', shiftType: 'night', commuteType: 'goWork' },
  { name: '호매실-동탄센터:[주간/출근]', shiftType: 'day', commuteType: 'goWork' },

  { name: '동탄센터-건대1:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-건대2:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-건대:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-남오산:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-노원:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-노원:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-동탄2-1:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-동탄2-2:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-동탄1-1:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-동탄1-2:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-동탄1:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-병점:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-병점:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-북수원1:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-북수원:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-사당:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-사당과천:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-상봉면목:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-석계상봉:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-석계태능:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-수원역:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-수원역:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
  { name: '동탄센터-창동:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-호매실:[야간/퇴근]', shiftType: 'night', commuteType: 'offWork' },
  { name: '동탄센터-호매실:[주간/퇴근]', shiftType: 'day', commuteType: 'offWork' },
] as const;

const driverSeeds = [
  { name: '양찬홍', phone: '01093270335', routeName: null },
  { name: '연옥흠', phone: '0109898', routeName: '수원역-동탄센터:[야간/출근]' },
  { name: '유승철', phone: '01073287543', routeName: null },
  { name: '이여송', phone: '01057072820', routeName: '석계태능-동탄센터:[야간/출근]' },
  { name: '이영식', phone: '01090558899', routeName: '상봉면목-동탄센터:[야간/출근]' },
  { name: '이오성', phone: '0106688', routeName: null },
  { name: '장세민', phone: '01051077325', routeName: null },
  { name: '정경덕', phone: '01092499833', routeName: '동탄1-동탄센터:[야간/출근]' },
  { name: '조홍규', phone: '01074901148', routeName: '사당-동탄센터:[야간/출근]' },
  { name: '최도석', phone: '01089816727', routeName: '호매실-동탄센터:[야간/출근]' },
] as const;

const parseLocations = (routeName: string) => {
  const base = routeName.split(':')[0];
  if (base.startsWith('동탄센터-')) {
    return { startLocation: '동탄센터', endLocation: base.slice('동탄센터-'.length) || '미지정' };
  }
  if (base.endsWith('-동탄센터')) {
    return { startLocation: base.slice(0, -'-동탄센터'.length) || '미지정', endLocation: '동탄센터' };
  }
  const [startLocation = '미지정', ...rest] = base.split('-');
  return { startLocation, endLocation: rest.join('-') || '미지정' };
};

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY) || localStorage.getItem(RESET_KEY)) return;

  if (repositories.routes.getAll().length === 0) {
    routeSeeds.forEach((route) => {
      const { startLocation, endLocation } = parseLocations(route.name);
      repositories.routes.create({
        name: route.name,
        startLocation,
        endLocation,
        distance: 0,
        estimatedTime: 0,
        baseRate: 0,
        status: 'active',
        weekdayMask: 127,
        shiftType: route.shiftType,
        commuteType: route.commuteType,
        baseAllowanceAmount: 0,
        effectiveFrom: now().slice(0, 10),
      });
    });
  }

  if (repositories.drivers.getAll().length === 0) {
    const routes = repositories.routes.getAll();
    const routeIdByName = new Map(routes.map((route) => [route.name, route.id]));

    driverSeeds.forEach((driver, idx) => {
      repositories.drivers.create({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: `LIC-MOCK-${String(idx + 1).padStart(4, '0')}`,
        status: 'active',
        joinDate: now(),
        defaultRouteId: driver.routeName ? routeIdByName.get(driver.routeName) : undefined,
      });
    });
  }

  localStorage.setItem(SEED_KEY, '1');
  localStorage.setItem(RESET_KEY, '1');
}
