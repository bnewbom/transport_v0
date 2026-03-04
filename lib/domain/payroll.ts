export interface PeriodRange {
  start: Date;
  end: Date;
}

/**
 * 정산 기간은 YYYY-MM 값을 기준으로 해당 월 1일~말일로 계산한다.
 */
export function getPeriodRange(period: string): PeriodRange {
  const [yearRaw, monthRaw] = period.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

export function isDateInRange(value: Date | string, range: PeriodRange): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= range.start && date <= range.end;
}
