import type { ReactNode } from 'react'

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm md:max-w-2xl">
        {children}
      </div>
    </div>
  )
}
