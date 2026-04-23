'use client';

import { repositories } from '@/lib/repository';

const RESET_KEY = 'transport_v0_mock_reset_v1';

export function ensureSeedData() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(RESET_KEY)) return;

  repositories.clients.clear();
  repositories.drivers.clear();
  repositories.routes.clear();
  repositories.dispatches.clear();

  localStorage.setItem(RESET_KEY, '1');
}
