'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const TODAY_ROUTE = '건대-동탄센터:[주간/출근]'

export default function UserTodayPage() {
  const router = useRouter()
  const [checkedIn, setCheckedIn] = useState(false)

  useEffect(() => {
    const auth = localStorage.getItem('user_auth')
    if (!auth) {
      router.replace('/user/login')
    }
  }, [router])

  const today = new Date().toISOString().slice(0, 10).replaceAll('-', '.')

  return (
    <main className="min-h-screen bg-white px-6 py-8 pb-24">
      <h1 className="text-lg font-semibold text-slate-700">운행 날짜 {today}</h1>
      <p className="mt-5 px-2 py-3 text-base font-medium text-slate-900">{TODAY_ROUTE}</p>

      <button
        onClick={() => setCheckedIn(true)}
        disabled={checkedIn}
        className="mt-6 h-12 w-full rounded-lg bg-emerald-600 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {checkedIn ? '출근 확인 완료' : '출근 확인'}
      </button>
    </main>
  )
}
