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
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="mx-auto w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-700">운행 날짜 {today}</h1>
        <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-base font-medium text-slate-900">{TODAY_ROUTE}</p>

        <button
          onClick={() => setCheckedIn(true)}
          disabled={checkedIn}
          className="mt-6 h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {checkedIn ? '출근 확인 완료' : '확인'}
        </button>
      </section>
    </main>
  )
}
