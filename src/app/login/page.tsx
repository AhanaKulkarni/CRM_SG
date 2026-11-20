'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Target, Sparkles, Receipt } from 'lucide-react';
import { useStore } from '@/lib/store';
import { BrandMark } from '@/components/Shell';
import { Button, inputCls } from '@/components/kit';
import { toast } from 'sonner';

export default function LoginPage() {
  const store = useStore();
  const b = store.state.brand;
  const router = useRouter();

  const [email, setEmail] = useState('admin@nexora.app');
  const [password, setPassword] = useState('demo1234');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e?: React.FormEvent, customEmail?: string, customPw?: string, targetRoute = '/app/overview') => {
    if (e) e.preventDefault();
    setBusy(true);
    setErr('');

    const loginEmail = customEmail || email;
    const loginPw = customPw || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Authentication failed');
        toast.error(data.error || 'Authentication failed');
        setBusy(false);
        return;
      }

      toast.success(`Welcome back, ${data.user.name}`);
      store.set('session', data.user);
      await store.refresh();
      router.push(targetRoute);
    } catch (e: any) {
      setErr('Network error, please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
      {/* Left branding pane */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#111827] grain relative overflow-hidden text-white">
        <BrandMark brand={b} light size={36} />
        <div className="max-w-lg fade-up">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: b?.secondary || '#8B5CF6' }}>
            Business management platform
          </p>
          <h1 className="text-4xl xl:text-5xl font-semibold text-white leading-[1.15] tracking-tight" data-testid="login-headline">
            {b?.loginHeadline || 'Accelerate your entire revenue engine'}
          </h1>
          <p className="mt-5 text-slate-400 text-lg leading-relaxed">
            {b?.loginSub ||
              'Manage leads, automate customer journeys, issue GST invoices and run AI-assisted telecalling in one command center.'}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              [Target, '1,284', 'leads tracked'],
              [Receipt, '₹12.4L', 'revenue billed'],
              [Sparkles, '86%', 'tasks automated'],
            ].map(([Icon, v, l]: any) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <Icon className="w-4 h-4 mb-3" style={{ color: b?.primary || '#6366F1' }} />
                <p className="text-white font-semibold text-xl">{v}</p>
                <p className="text-slate-500 text-xs">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-slate-500 text-xs">© 2026 {b?.company?.legal || 'Nexora Technologies Pvt. Ltd.'}</p>
      </div>

      {/* Right login form pane */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden mb-8">
            <BrandMark brand={b} size={34} />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">Welcome back</h2>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to your {b?.short || b?.name || 'NEXORA'} workspace</p>

          <form onSubmit={(e) => submit(e)} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Work email</span>
              <input
                data-testid="login-email-input"
                className={`${inputCls} h-11 mt-1.5`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Password</span>
              <input
                data-testid="login-password-input"
                type="password"
                className={`${inputCls} h-11 mt-1.5`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>

            {err && (
              <p className="text-sm text-red-600" data-testid="login-error">
                {err}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={busy} data-testid="login-submit-btn">
              Sign in <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="flex-1 h-px bg-[#E5E7EB]" />
            or 1-click authorized login
            <span className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <div className="grid gap-2">
            <Button
              variant="dark"
              size="lg"
              onClick={() => submit(undefined, 'admin@nexora.app', 'demo1234', '/app/overview')}
              data-testid="demo-login-btn"
            >
              Enter as Workspace Admin
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => submit(undefined, 'superadmin@nexora.app', 'demo1234', '/admin')}
              data-testid="superadmin-login-btn"
            >
              <ShieldCheck className="w-4 h-4" />
              Super Admin Portal
            </Button>
          </div>

          <div
            className="mt-6 rounded-xl bg-slate-50 border border-[#E5E7EB] p-4 text-xs text-slate-600 space-y-1.5"
            data-testid="demo-credentials"
          >
            <p className="font-semibold text-slate-800">Authorised Accounts</p>
            <p>
              Workspace Admin: <code>admin@nexora.app</code> / <code>demo1234</code>
            </p>
            <p>
              Super Admin: <code>superadmin@nexora.app</code> / <code>demo1234</code>
            </p>
            <p>
              Manager: <code>manager@nexora.app</code> / <code>demo1234</code>
            </p>
            <p>
              Sales Agent: <code>agent@nexora.app</code> / <code>demo1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
