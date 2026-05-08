const STATUS_MAP = {
  work: { label: '출근', className: 'bg-emerald-100 text-emerald-800' },
  off: { label: '휴무', className: 'bg-rose-100 text-rose-800' },
  swap: { label: '대차', className: 'bg-amber-100 text-amber-800' },
} as const

const calendarData = [
  ['off', 'off', 'work', 'work', 'work', 'swap', 'off'],
  ['work', 'work', 'swap', 'work', 'off', 'work', 'work'],
  ['work', 'off', 'work', 'swap', 'work', 'work', 'off'],
  ['work', 'work', 'off', 'work', 'swap', 'work', 'work'],
  ['off', 'work', 'work', 'off', 'work', 'swap', 'work'],
] as const

export default function UserCalendarPage() {
  const flat = calendarData.flat()
  const totalWorkDays = flat.filter((day) => day === 'work').length
  const allowance = totalWorkDays * 120000

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">2026년 5월 근무표</h1>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-medium">
          {calendarData.map((week, weekIdx) =>
            week.map((status, dayIdx) => {
              const day = weekIdx * 7 + dayIdx + 1
              const style = STATUS_MAP[status]
              return (
                <div key={`${weekIdx}-${dayIdx}`} className={`rounded-lg px-1 py-2 ${style.className}`}>
                  <p className="text-sm font-semibold">{day}</p>
                  <p>{style.label}</p>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-6 space-y-2 rounded-xl bg-slate-100 p-4">
          <p className="text-sm text-slate-600">총 근무일</p>
          <p className="text-lg font-semibold text-slate-900">{totalWorkDays}일</p>
          <p className="pt-2 text-sm text-slate-600">운행 수당</p>
          <p className="text-lg font-semibold text-slate-900">{allowance.toLocaleString('ko-KR')}원</p>
        </div>
      </section>
    </main>
  )
}
