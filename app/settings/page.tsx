'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { navItems } from '@/lib/navigation';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent } from '@/components/layout-shell';



export default function SettingsPage() {
  const router = useRouter();

  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    router.push('/login');
  };

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={
        <Header
          title={t('nav.settings')}
          rightContent={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              로그아웃
            </button>
          }
        />
      }
    >
      <PageContent>
        <div className="max-w-2xl space-y-6">
          {/* 일반 설정 */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">일반 설정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">회사명</label>
                <input
                  type="text"
                  defaultValue="운송 허브"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">이메일</label>
                <input
                  type="email"
                  defaultValue="admin@transport.com"
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                변경사항 저장
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">알림</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">이메일 알림</label>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">배차 알림</label>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Payroll 알림</label>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* API 설정 */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">API 설정</h2>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">외부 연동을 위한 API 키입니다</p>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="font-mono text-xs">API Key: sk_live_••••••••••••••••</p>
              </div>
              <button className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                키 재발급
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="mb-4 text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="mb-4 text-sm text-muted-foreground">되돌릴 수 없는 작업입니다</p>
            <button className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">
              Clear All Data
            </button>
          </div>
        </div>
      </PageContent>
    </SidebarLayout>
  );
}
