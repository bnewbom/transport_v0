import { CheckCircle2, Headset, Send, Settings, ShieldCheck, Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';

type Plan = {
  name: string;
  description: string;
  monthlyPrice: string;
  capacity: string;
  features: string[];
  highlighted?: boolean;
  accent: 'blue' | 'green';
  icon: ReactNode;
};

const plans: Plan[] = [
  {
    name: '라이트',
    description: '기본 관리가 필요한 소규모 팀',
    monthlyPrice: '월 20만원',
    capacity: '기사 최대 30명',
    features: ['기사관리', '노선관리', '배차관리', '거래처관리'],
    accent: 'blue',
    icon: <Send className="h-8 w-8 text-blue-500" />,
  },
  {
    name: '스탠다드',
    description: '운영 효율을 높이고 싶은 팀',
    monthlyPrice: '월 40만원',
    capacity: '기사 최대 50명',
    features: ['Lite 기능 포함', '기사 출근웹', '근태관리'],
    highlighted: true,
    accent: 'blue',
    icon: <Star className="h-8 w-8 fill-blue-500 text-blue-500" />,
  },
  {
    name: '프로',
    description: '체계적인 운영 관리가 필요한 팀',
    monthlyPrice: '월 70만원',
    capacity: '기사 최대 100명',
    features: ['Standard 기능 포함', '급여관리', '차량 운영관리', '정비 이력관리'],
    accent: 'green',
    icon: <ShieldCheck className="h-8 w-8 text-emerald-500" />,
  },
];

const bottomItems = [
  {
    title: '100명 이상',
    description: '별도 협의',
    icon: <Users className="h-7 w-7 text-blue-500" />,
  },
  {
    title: '초기 세팅 지원',
    description: '엑셀 양식 제공 시',
    icon: <Settings className="h-7 w-7 text-blue-500" />,
  },
  {
    title: '도입 안정화 지원',
    description: '사용 문의, 오류 수정, 운영 지원',
    icon: <Headset className="h-7 w-7 text-blue-500" />,
  },
];

export default function PricePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 text-center">
          <p className="text-sm font-semibold text-blue-600">합리적인 선택</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">플랜 선택</h1>
          <p className="mt-4 text-lg text-slate-600">우리 회사에 맞는 플랜을 선택하고 모든 기능을 경험해보세요.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isGreen = plan.accent === 'green';
            return (
              <article
                key={plan.name}
                className={`relative flex rounded-2xl border bg-white p-8 shadow-sm ${
                  plan.highlighted ? 'border-blue-500 ring-1 ring-blue-400' : 'border-slate-200'
                }`}
              >
                <div className="flex w-full flex-col">
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
                      추천 플랜
                    </div>
                  )}

                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                    {plan.icon}
                  </div>

                  <h2 className="text-center text-3xl font-bold">{plan.name}</h2>
                  <p className="mt-2 text-center text-xl text-slate-500">{plan.description}</p>

                  <p className={`mt-7 text-center text-5xl font-extrabold ${isGreen ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {plan.monthlyPrice}
                  </p>

                  <div className="my-6 h-px bg-slate-200" />

                  <ul className="space-y-4 text-xl text-slate-700">
                    <li className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className={`h-5 w-5 ${isGreen ? 'text-emerald-500' : 'text-blue-500'}`} />
                      {plan.capacity}
                    </li>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className={`h-5 w-5 ${isGreen ? 'text-emerald-500' : 'text-blue-500'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`mt-12 h-14 rounded-xl border-2 text-xl font-bold transition-colors ${
                      plan.highlighted
                        ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                        : isGreen
                          ? 'border-emerald-400 text-emerald-500 hover:bg-emerald-50'
                          : 'border-blue-400 text-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    플랜 선택
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {bottomItems.map((item) => (
              <div key={item.title} className="flex items-center gap-4 rounded-xl px-2 py-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50">{item.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{item.title}</p>
                  <p className="text-lg text-slate-500">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xl text-slate-500">모든 플랜은 월 단위로 결제되며, 언제든지 변경 또는 해지할 수 있습니다.</p>
      </div>
    </main>
  );
}
