'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MENUS = [
  { href: '/user/today', label: '운행' },
  { href: '/user/calendar', label: '근무표' },
]

export default function UserBottomNav() {
  const pathname = usePathname()

  if (pathname === '/user/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto flex w-full max-w-md border-t border-slate-200 bg-white md:max-w-2xl">
      {MENUS.map((menu) => {
        const active = pathname === menu.href
        return (
          <Link
            key={menu.href}
            href={menu.href}
            className={`flex h-14 w-1/2 items-center justify-center text-base font-medium ${
              active ? 'text-blue-600' : 'text-slate-600'
            }`}
          >
            {menu.label}
          </Link>
        )
      })}
    </nav>
  )
}
