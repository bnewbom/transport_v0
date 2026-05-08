import { t } from '@/lib/i18n';

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  disabled?: boolean;
  badge?: string;
};

export const navItems: NavItem[] = [
  { label: t('nav.dashboard'), href: '/dashboard', icon: '📊' },
  { label: t('nav.clients'), href: '/clients', icon: '👥' },
  { label: t('nav.vehicles'), href: '/vehicles', icon: '🚌' },
  { label: t('nav.drivers'), href: '/drivers', icon: '🚗' },
  { label: t('nav.routes'), href: '/routes', icon: '🗺' },
  { label: t('nav.dispatches'), href: '/dispatches', icon: '📋' },
  { label: t('nav.payroll'), href: '/payroll', icon: '💳' },
];
