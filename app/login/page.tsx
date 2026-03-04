'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('admin@transport.com');
  const [password, setPassword] = React.useState('admin123');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple auth check (in real app, would call API)
    if (email && password) {
      localStorage.setItem('auth', JSON.stringify({ email, authenticated: true }));
      router.push('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
            T
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('auth.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.subtitle')}</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              {t('auth.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-muted-foreground">
              {t('auth.rememberMe')}
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>{t('auth.demoCredentials')}</p>
          <p className="mt-2">
            <Link href="#" className="text-primary hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
