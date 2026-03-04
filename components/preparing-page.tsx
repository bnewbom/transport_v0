'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { SidebarLayout, Sidebar, Header } from '@/components/sidebar';
import { PageContent, EmptyState } from '@/components/layout-shell';
import { navItems } from '@/lib/navigation';
import { t } from '@/lib/i18n';

export function PreparingPage({ title }: { title: string }) {
  const router = useRouter();
  React.useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (!auth) router.push('/login');
  }, [router]);

  return (
    <SidebarLayout
      sidebar={<Sidebar items={navItems} title={t('common.appName')} />}
      header={<Header title={title} />}
    >
      <PageContent>
        <EmptyState title="준비중" description="MVP 1주차 범위에서 제외된 기능입니다." icon="🚧" />
      </PageContent>
    </SidebarLayout>
  );
}
