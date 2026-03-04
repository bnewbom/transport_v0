// Currency Formatting (Korean Won)
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Date Formatting
export function formatDate(date: Date, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return formatDate(date, 'short') + ' ' + formatDate(date, 'time');
}

// Status Badge Colors
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  const statusMap: Record<string, { bg: string; text: string; border: string }> = {
    'active': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    'inactive': { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
    'on-leave': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
    'pending': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
    'confirmed': { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
    'in-progress': { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
    'completed': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    'cancelled': { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
    'draft': { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' },
    'approved': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
    'paid': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  };
  return statusMap[status] || { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' };
}

// Status Badge Labels
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'active': '활성',
    'inactive': '비활성',
    'on-leave': '휴무',
    'pending': '대기',
    'confirmed': '확정',
    'in-progress': '진행 중',
    'completed': '완료',
    'cancelled': '취소',
    'draft': '임시',
    'approved': '승인',
    'paid': '지급',
  };
  return labels[status] || status;
}

// Calculate Distance Color
export function getDistanceColor(distance: number): string {
  if (distance < 50) return 'text-success';
  if (distance < 150) return 'text-warning';
  return 'text-destructive';
}

// Calculate Financial Difference
export function calculateDifference(current: number, previous: number): { value: number; percentage: number; isPositive: boolean } {
  const diff = current - previous;
  const percentage = previous !== 0 ? (diff / previous) * 100 : 0;
  return {
    value: diff,
    percentage,
    isPositive: diff >= 0,
  };
}

// Currency Difference Display
export function formatCurrencyDifference(diff: number): string {
  if (diff === 0) return '변화 없음';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatKRW(diff)}`;
}
