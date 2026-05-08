import { CheckCircle2 } from 'lucide-react';

type Plan = {
  name: string;
  monthlyPrice: string;
  capacity: string;
  features: string[];
  highlighted?: boolean;
  accent: 'blue' | 'green';
};

const plans: Plan[] = [
  {
    name: 'Lite',
    monthlyPrice: '20만원',
    capacity: '기사 최대 30명',
    features: ['기사관리', '노선관리', '배차관리', '거래처관리'],
    accent: 'blue',
  },
  {
    name: 'Standard',
    monthlyPrice: '40만원',
    capacity: '기사 최대 50명',
    features: ['Lite 기능 포함', '기사 출근웹', '근태관리'],
    highlighted: true,
    accent: 'blue',
  },
  {
    name: 'Pro',
    monthlyPrice: '70만원',
    capacity: '기사 최대 100명',
    features: ['Standard 기능 포함', '급여관리', '차량 운영관리', '정비 이력관리'],
    accent: 'green',
  },
];

export default function PricePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <p className="text-sm font-semibold text-blue-600">합리적인 선택</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">플랜 선택</h1>
          <p className="mt-4 text-lg text-slate-600">우리 회사에 맞는 플랜을 선택해 보세요.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isGreen = plan.accent === 'green';
            return (
              <article
                key={plan.name}
                className={`relative rounded-2xl border bg-white p-8 shadow-sm ${
                  plan.highlighted ? 'border-blue-500 ring-1 ring-blue-400' : 'border-slate-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
                    추천 플랜
                  </div>
                )}

                <h2 className="text-center text-3xl font-bold">{plan.name}</h2>
                <p className={`mt-6 text-center text-4xl font-extrabold ${isGreen ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {plan.monthlyPrice}
                </p>

                <div className="my-6 h-px bg-slate-200" />

                <ul className="space-y-4 text-slate-700">
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
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
