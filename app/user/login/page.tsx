'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

const REGISTERED_DRIVERS = ['01012345678', '01098765432', '01011112222', '01036859711']

const normalizePhone = (value: string) => value.replace(/[^0-9]/g, '')

export default function UserLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const normalized = normalizePhone(phone)

    if (!normalized) {
      setError('핸드폰 번호를 입력해 주세요.')
      return
    }

    if (!REGISTERED_DRIVERS.includes(normalized)) {
      setError('등록되지 않은 유저입니다.')
      return
    }

    localStorage.setItem('user_auth', JSON.stringify({ phone: normalized, loggedInAt: new Date().toISOString() }))
    router.push('/user/today')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <section className="w-full max-w-sm p-6">
        <h1 className="text-center text-2xl font-semibold text-slate-900">기사 로그인</h1>
        <p className="mt-2 text-center text-sm text-slate-500">등록된 번호로 간편 로그인</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setError('')
            }}
            placeholder="핸드폰 번호 입력"
            className="h-12 w-full border border-slate-300 px-4 text-base outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          {error && <p className="text-sm font-medium text-rose-500">{error}</p>}

          <button type="submit" className="h-12 w-full bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700">
            로그인
          </button>
        </form>
      </section>
    </main>
  )
}
