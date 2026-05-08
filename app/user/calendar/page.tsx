'use client'

import { useMemo, useState } from 'react'

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']
type WorkStatus = 'work' | 'off' | 'swap'

const STATUS_MAP = {
  work: { label: '출근', className: 'bg-emerald-100 text-emerald-800' },
  off: { label: '휴무', className: 'bg-rose-100 text-rose-800' },
  swap: { label: '대차', className: 'bg-amber-100 text-amber-800' },
} as const

export default function UserCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4, 1))

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const leading = Array.from({ length: firstDay }, () => null)
  const cells = [...leading, ...days]

  const statuses = useMemo(() => {
    const monthKey = year * 100 + month
    const offCount = monthKey % 2 === 0 ? 2 : 3
    const swapCount = monthKey % 3 === 0 ? 3 : 2

    const statusByDay = new Array<WorkStatus>(daysInMonth).fill('work')
    const used = new Set<number>()

    const pickDays = (count: number, seed: number) => {
      const picked: number[] = []
      let cursor = seed
      while (picked.length < count) {
        cursor = (cursor * 7 + 11) % daysInMonth
        if (!used.has(cursor)) {
          used.add(cursor)
          picked.push(cursor)
        }
      }
      return picked
    }

    pickDays(offCount, month + 1).forEach((idx) => {
      statusByDay[idx] = 'off'
    })
    pickDays(swapCount, year % 17).forEach((idx) => {
      statusByDay[idx] = 'swap'
    })

    return statusByDay
  }, [daysInMonth, month, year])
  const totalWorkDays = statuses.filter((day) => day === 'work').length
  const allowance = totalWorkDays * 120000

  return (
    <main className="min-h-screen bg-white px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <button
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700"
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
        >
          이전 달
        </button>
        <h1 className="text-xl font-semibold text-slate-900 text-center">{month + 1}월 근무표</h1>
        <button
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700"
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
        >
          다음 달
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-600">
        {WEEKDAYS.map((weekday) => (
          <p key={weekday}>{weekday}</p>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-xs font-medium">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const style = STATUS_MAP[statuses[day - 1]]
          return (
            <div key={day} className={`px-1 py-2 ${style.className}`}>
              <p className="text-sm font-semibold">{day}</p>
              <p>{style.label}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6 space-y-2 bg-slate-100 p-4">
        <p className="text-sm text-slate-600">총 근무일</p>
        <p className="text-lg font-semibold text-slate-900">{totalWorkDays}일</p>
        <p className="pt-2 text-sm text-slate-600">운행 수당</p>
        <p className="text-lg font-semibold text-slate-900">{allowance.toLocaleString('ko-KR')}원</p>
      </div>
    </main>
  )
}
