import { Dispatch, Driver, Payroll, Route, Run } from '@/lib/schemas';

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: '활성',
    inactive: '비활성',
    leave: '휴직',
    'on-leave': '휴직',
    resigned: '퇴사',
    draft: '임시저장',
    published: '게시',
    closed: '마감',
    canceled: '취소',
    cancelled: '취소',
    pending: '대기',
    confirmed: '확정',
    completed: '완료',
    absence: '결근',
    holiday: '휴무',
    replacement: '대차',
    day: '주간',
    night: '야간',
  };
  return map[status] ?? status;
}

export function getDriverStatusLabel(status: Driver['status']) {
  if (status === 'active') return '재직';
  return getStatusLabel(status);
}

export function getDispatchStatusLabel(status: Dispatch['status']) {
  return getStatusLabel(status);
}

export function getPayrollStatusLabel(status: Payroll['status']) {
  return getStatusLabel(status);
}

export function getRunStatusLabel(status: Run['status']) {
  return getStatusLabel(status);
}

export function getShiftTypeLabel(shift: Route['shiftType']) {
  return getStatusLabel(shift);
}

export function weekdayMaskToLabels(mask: number): string {
  const days = DAY_LABELS.filter((_, idx) => (mask & (1 << idx)) !== 0);
  return days.length === 7 ? '매일' : days.join(', ');
}

export function dayToBit(dayIndex: number) {
  return 1 << dayIndex;
}

export function maskIncludesDay(mask: number, dayIndex: number) {
  return (mask & dayToBit(dayIndex)) !== 0;
}

export function labelsToWeekdayMask(selectedDays: number[]) {
  return selectedDays.reduce((acc, day) => acc | dayToBit(day), 0);
}
