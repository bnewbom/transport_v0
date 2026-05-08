import type { ReactNode } from 'react'
import UserBottomNav from '@/components/user-bottom-nav'

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-white md:max-w-2xl">
      {children}
      <UserBottomNav />
    </div>
  )
}
