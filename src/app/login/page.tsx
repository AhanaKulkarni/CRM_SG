'use client';

import React, { useState } from 'react';
import { ArrowRight, Building2, UserPlus, LogIn, Lock, Mail, User } from 'lucide-react';
import { useStore } from '@/lib/store';
import { BrandMark } from '@/components/Shell';
import { Button, inputCls } from '@/components/kit';
import { toast } from 'sonner';

export default function LoginPage() {
  const store = useStore();
  const b = store.state.brand;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e?: React.FormEvent, customEmail?: string, customPw?: string, targetRoute = '/app/overview') => {
    if (e) e.preventDefault();
    setBusy(true);
    setErr('');

    const loginEmail = (customEmail || email).trim().toLowerCase();
    const loginPw = customPw || password;

    if (!loginEmail || !loginPw) {
      setErr('Please enter both email and password.');
      setBusy(false);
      return;
    }

    try {
      const endpoint = mode === 'signup' && !customEmail ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'signup' && !customEmail
          ? { name, email: loginEmail, password: loginPw, companyName: company }
          : { email: loginEmail, password: loginPw };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || 'Authentication failed');
        toast.error(data.error || 'Authentication failed');
        setBusy(false);
        return;
      }

      toast.success(mode === 'signup' ? 'Workspace created successfully!' : `Welcome back, ${data.user.name}`);
      store.set('session', data.user);

      // Reliable hard redirect to guarantee cookie delivery on Vercel
      window.location.href = targetRoute;
    } catch (e: any) {
      setErr('Network error, please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-white">
      {/* Left branding pane */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#111827] relative overflow-hidden text-white">
        <BrandMark brand={b} light size={36} />
        <div className="max-w-lg fade-up">
          <p
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-4"
            style={{ color: b?.secondary || '#8B5CF6' }}
          >
            Pure Business Management System
          </p>
          <h1
            className="text-4xl xl:text-5xl font-semibold text-white leading-[1.15] tracking-tight"
            data-testid="login-headline"
          >
            {b?.loginHeadline || 'Your complete revenue & operations platform.'}
          </h1>
          <p className="mt-5 text-slate-400 text-base leading-relaxed">
            {b?.loginSub ||
              'Capture leads, manage customers, schedule meetings, issue GST invoices, and run automated telecalling — with zero pre-populated demo data.'}
          </p>
          <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-6 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-white text-base">Pure & Addable</p>
              <p className="text-xs text-slate-400">Zero fake records at start</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-semibold text-white text-base">Production Ready</p>
              <p className="text-xs text-slate-400">PostgreSQL / Supabase support</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <p className="font-semibold text-white text-base">Multi-Device</p>
              <p className="text-xs text-slate-400">Desktop + Tablet + Mobile</p>
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-xs">© 2026 {b?.company?.legal || 'NEXORA CRM'}</p>
      </div>

      {/* Right form pane */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden mb-6">
            <BrandMark brand={b} size={34} />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErr('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErr('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create account
            </button>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
            {mode === 'signin' ? 'Welcome to NEXORA' : 'Create pure workspace'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signin'
              ? 'Enter your work email and password to continue.'
              : 'Start fresh with a clean, unpopulated database.'}
          </p>

          <form onSubmit={(e) => submit(e)} className="mt-6 space-y-3.5">
            {mode === 'signup' && (
              <>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Your Full Name</span>
                  <div className="relative mt-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      className={`${inputCls} h-11 pl-9`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ahana Kulkarni"
                      required
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Company / Organization</span>
                  <div className="relative mt-1">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      className={`${inputCls} h-11 pl-9`}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      required
                    />
                  </div>
                </label>
              </>
            )}

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Work Email</span>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  className={`${inputCls} h-11 pl-9`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600">Password</span>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  className={`${inputCls} h-11 pl-9`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </label>

            {err && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200" data-testid="login-error">
                {err}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" loading={busy} data-testid="login-submit-btn">
              {mode === 'signin' ? 'Sign in' : 'Create clean workspace'} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick-start shortcut */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => submit(undefined, 'admin@nexora.app', 'demo1234', '/app/overview')}
              className="text-xs text-slate-500 hover:text-brand font-medium transition-colors"
            >
              Or enter clean workspace with default admin credentials →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
