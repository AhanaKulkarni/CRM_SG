'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  RotateCcw,
  Check,
  Users,
  IndianRupee,
  ArrowUpRight,
  Target,
  Receipt,
  Building,
  Shield,
  Bell,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  Card,
  CardHead,
  PageHeader,
  Badge,
  Stat,
  Button,
  Tabs,
  Toggle,
  Field,
  inr,
  fmtDate,
  inputCls,
  cn,
  Avatar,
  Modal,
} from '@/components/kit';
import { BrandMark } from '@/components/Shell';

const PLANS = [
  { name: 'Basic', price: 999, desc: 'Core CRM for growing businesses & teams' },
  { name: 'Pro', price: 1299, desc: 'Full AI capabilities, workflow automation & white-label' },
];

function readFile(e: React.ChangeEvent<HTMLInputElement>, cb: (data: string) => void) {
  const f = e.target.files?.[0];
  if (!f) return;
  if (f.size > 600000) {
    toast.error('Please upload an image under 600 KB');
    return;
  }
  const r = new FileReader();
  r.onload = () => cb(r.result as string);
  r.readAsDataURL(f);
}

export function WhiteLabelView() {
  const store = useStore();
  const b = store.state.brand || {
    name: 'StartAppGuru CRM',
    short: 'StartAppGuru',
    primary: '#1E2B6D',
    secondary: '#22C55E',
    logo: '/logo.png',
    loginHeadline: 'Accelerate your entire revenue engine',
    loginSub: 'Manage leads, run telecalling campaigns, record calls and grow your business — all in one platform.',
    company: {
      legal: 'Start App Guru Pvt. Ltd.',
      gst: '',
      email: 'hello@startappguru.com',
      phone: '',
      website: 'https://startappguru.com',
      address: '',
    },
  };

  const set = (patch: any) => store.set('brand', { ...b, ...patch });
  const setCo = (patch: any) =>
    store.set('brand', { ...b, company: { ...(b.company || {}), ...patch } });

  const [pv, setPv] = useState<'Dashboard' | 'Login'>('Dashboard');
  const presets = [
    ['#1E2B6D', '#22C55E'],
    ['#0D9488', '#0EA5E9'],
    ['#6366F1', '#8B5CF6'],
    ['#EA580C', '#F59E0B'],
    ['#2563EB', '#7C3AED'],
    ['#16A34A', '#65A30D'],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="White-Label Configuration"
        subtitle="Rebrand the entire platform for your organisation. Colors, logo and domain apply instantly."
        actions={
          <Button
            variant="secondary"
            data-testid="brand-reset-btn"
            onClick={() => {
              store.set('brand', {
                name: 'StartAppGuru CRM',
                short: 'StartAppGuru',
                primary: '#1E2B6D',
                secondary: '#22C55E',
                logo: '/logo.png',
                loginHeadline: 'Accelerate your entire revenue engine',
                loginSub:
                  'Manage leads, run telecalling campaigns, record calls and grow your business — all in one platform.',
                company: {
                  legal: 'Start App Guru Pvt. Ltd.',
                  gst: '',
                  email: 'hello@startappguru.com',
                  phone: '',
                  website: 'https://startappguru.com',
                  address: '',
                },
              });
              toast.success('Branding reset to default');
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to default
          </Button>
        }
      />

      <div className="grid xl:grid-cols-[1fr_1.1fr] gap-6">
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-[#111827]">Brand identity</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                f={{ key: 'brand-name', label: 'Organisation / product name' }}
                value={b.name}
                onChange={(v: string) => set({ name: v })}
              />
              <Field
                f={{ key: 'brand-short', label: 'Short name' }}
                value={b.short}
                onChange={(v: string) => set({ short: v })}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {[
                ['logo', 'Logo (Header & Sidebar)', b.logo],
                ['favicon', 'Favicon / Icon', b.favicon],
              ].map(([k, l, v]: any) => (
                <div key={k}>
                  <span className="block text-xs font-medium text-slate-600 mb-1.5">{l}</span>
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-lg border border-[#E5E7EB] bg-slate-50 flex items-center justify-center overflow-hidden">
                      {v ? (
                        <img src={v} alt={l} className="w-full h-full object-contain" />
                      ) : (
                        <span
                          className="text-white text-lg font-bold w-full h-full flex items-center justify-center"
                          style={{ background: b.primary }}
                        >
                          {(b.short || b.name || 'N')[0]}
                        </span>
                      )}
                    </span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E5E7EB] text-sm hover:bg-slate-50">
                      <Upload className="w-4 h-4 text-slate-500" />
                      Upload
                      <input
                        data-testid={`brand-${k}-upload`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          readFile(e, (data) => {
                            set({ [k]: data });
                            toast.success(`${l} updated`);
                          })
                        }
                      />
                    </label>
                    {v && (
                      <button
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => set({ [k]: '' })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-[#111827]">Brand colours</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['primary', 'Primary accent'],
                ['secondary', 'Secondary accent'],
              ].map(([k, l]) => (
                <label key={k} className="block">
                  <span className="block text-xs font-medium text-slate-600 mb-1.5">{l}</span>
                  <div className="flex gap-2">
                    <input
                      data-testid={`brand-${k}-color`}
                      type="color"
                      value={b[k] || '#6366F1'}
                      onChange={(e) => set({ [k]: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5"
                    />
                    <input
                      className={cn(inputCls, 'font-mono uppercase')}
                      value={b[k] || ''}
                      onChange={(e) => set({ [k]: e.target.value })}
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {presets.map(([p, s]) => (
                <button
                  key={p}
                  data-testid={`brand-preset-${p.slice(1)}`}
                  onClick={() => set({ primary: p, secondary: s })}
                  className={cn(
                    'flex rounded-lg overflow-hidden ring-2 ring-offset-2 transition-all',
                    b.primary === p ? 'ring-slate-900 shadow-sm' : 'ring-transparent opacity-80 hover:opacity-100'
                  )}
                >
                  <span className="w-7 h-7" style={{ background: p }} />
                  <span className="w-7 h-7" style={{ background: s }} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="font-semibold text-sm text-[#111827]">Login page customization</h3>
            <Field
              f={{ key: 'login-headline', label: 'Login Hero Headline' }}
              value={b.loginHeadline}
              onChange={(v: string) => set({ loginHeadline: v })}
            />
            <Field
              f={{ key: 'login-sub', label: 'Hero Subtitle', type: 'textarea' }}
              value={b.loginSub}
              onChange={(v: string) => set({ loginSub: v })}
            />
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-sm text-[#111827] mb-4">
              Company & invoice entity details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['legal', 'Legal Entity Name'],
                ['gst', 'GSTIN / Tax ID'],
                ['email', 'Billing & Support Email'],
                ['phone', 'Office Phone'],
                ['website', 'Website URL'],
                ['address', 'Registered Office Address'],
              ].map(([k, l]) => (
                <Field
                  key={k}
                  f={{ key: `co-${k}`, label: l, full: k === 'address' }}
                  value={b.company?.[k] || ''}
                  onChange={(v: string) => setCo({ [k]: v })}
                />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 h-fit">
          <Card className="p-5" data-testid="brand-preview">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-[#111827]">Live preview</h3>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                {(['Dashboard', 'Login'] as const).map((x) => (
                  <button
                    key={x}
                    data-testid={`brand-preview-${x.toLowerCase()}`}
                    onClick={() => setPv(x)}
                    className={cn(
                      'px-3 h-7 rounded-md text-xs font-medium transition-all',
                      pv === x
                        ? 'bg-white text-[#111827] shadow-sm font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>

            {pv === 'Dashboard' ? (
              <div className="rounded-xl border border-[#E5E7EB] overflow-hidden flex h-[380px] text-[11px] shadow-sm">
                <div className="w-36 bg-[#111827] p-3 space-y-1.5 shrink-0 flex flex-col">
                  <div className="mb-3 scale-90 origin-left">
                    <BrandMark brand={b} light size={22} />
                  </div>
                  {['Overview', 'Leads', 'Customers', 'Invoices', 'Reports'].map((x, i) => (
                    <div
                      key={x}
                      className={cn(
                        'px-2 py-1.5 rounded-md text-[11px]',
                        i === 0 ? 'bg-white/10 text-white font-medium' : 'text-slate-400'
                      )}
                    >
                      {x}
                    </div>
                  ))}
                </div>

                <div className="flex-1 bg-[#F8FAFC] p-4 space-y-3 min-w-0 overflow-hidden">
                  <p className="font-semibold text-sm text-[#111827]">Overview</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Leads', '1,284'],
                      ['Revenue', '₹12.4L'],
                      ['Conv.', '24.8%'],
                    ].map(([l, val]) => (
                      <div key={l} className="bg-white rounded-lg border border-[#E5E7EB] p-2">
                        <p className="text-slate-400 text-[10px]">{l}</p>
                        <p className="font-semibold text-xs text-[#111827]">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg border border-[#E5E7EB] p-3 h-28 flex items-end gap-1.5">
                    {[40, 65, 50, 80, 60, 90, 75, 100].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all"
                        style={{
                          height: `${h}%`,
                          background: i % 2 ? b.secondary || '#8B5CF6' : b.primary || '#6366F1',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <span
                      className="px-3 py-1.5 rounded-md text-white text-xs font-medium shadow-sm"
                      style={{ background: b.primary }}
                    >
                      Primary action
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-md border text-xs font-medium"
                      style={{ borderColor: b.secondary, color: b.secondary }}
                    >
                      Secondary
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden grid grid-cols-2 h-[380px] text-[11px] border border-[#E5E7EB] shadow-sm">
                <div className="bg-[#111827] p-5 flex flex-col justify-between">
                  <BrandMark brand={b} light size={22} />
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">
                      {b.loginHeadline || 'Welcome'}
                    </p>
                    <p className="text-slate-400 text-[11px] mt-1.5 line-clamp-3 leading-relaxed">
                      {b.loginSub}
                    </p>
                  </div>
                  <p className="text-slate-500 text-[10px]">© {b.company?.legal || 'AetherX'}</p>
                </div>
                <div className="bg-white p-5 flex flex-col justify-center gap-2 border-l border-[#E5E7EB]">
                  <p className="font-semibold text-xs text-[#111827]">Sign in to your account</p>
                  <div className="h-7 rounded border border-[#E5E7EB] bg-slate-50" />
                  <div className="h-7 rounded border border-[#E5E7EB] bg-slate-50" />
                  <div
                    className="h-7 rounded text-white flex items-center justify-center font-medium text-xs shadow-sm mt-1"
                    style={{ background: b.primary }}
                  >
                    Sign in
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5" data-testid="tenant-brands">
            <h3 className="font-semibold text-sm text-[#111827] mb-1">
              Multi-tenant brand presets
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apply a sample client organization branding to verify instant multi-tenant white-labeling.
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {(store.state.orgs || []).slice(0, 6).map((o: any) => (
                <button
                  key={o.id}
                  data-testid={`apply-tenant-${o.id}`}
                  onClick={() => {
                    set({
                      name: o.name,
                      short: o.name.split(' ')[0],
                      primary: o.primary || '#6366F1',
                      secondary: o.secondary || '#8B5CF6',
                      logo: '',
                    });
                    toast.success(`${o.name} branding applied`);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-left transition-colors"
                >
                  <span
                    className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                    style={{ background: o.primary }}
                  >
                    {o.name[0]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate text-[#111827]">
                      {o.name}
                    </span>
                    <span className="block text-xs text-slate-500 truncate">{o.domain}</span>
                  </span>
                  {b.name === o.name && <Check className="w-4 h-4 text-brand ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionView() {
  const store = useStore();
  const { state } = store;
  const sub = state.subscription || {
    plan: 'Pro',
    seats: 42,
    renews: new Date(Date.now() + 864e5 * 24).toISOString().slice(0, 10),
  };

  const [seats, setSeats] = useState(sub.seats);
  const [confirm, setConfirm] = useState<any | null>(null);

  const plan = PLANS.find((p) => p.name === sub.plan) || PLANS[1];
  const orgs = state.orgs || [];
  const mrr = orgs
    .filter((o: any) => o.status !== 'Suspended')
    .reduce((a: number, o: any) => a + (o.users || 1) * (o.plan === 'Pro' ? 1299 : 999), 0);

  const featuresMap: Record<string, string[]> = state.features || {
    'Lead & Customer Pipelines': ['Basic', 'Pro'],
    'Task Management & Kanban': ['Basic', 'Pro'],
    'GST Invoicing & Payments': ['Basic', 'Pro'],
    'Internal Chat & Notes': ['Basic', 'Pro'],
    'AI Calling & Agent': ['Pro'],
    'Custom Automation Workflows': ['Pro'],
    'White-Label & Custom Branding': ['Pro'],
    'Unlimited Webhooks & API': ['Pro'],
  };

  const change = (p: any) => {
    store.set('subscription', { ...sub, plan: p.name });
    store.add('billing', {
      number: `NX-BILL-${2700 + (state.billing || []).length}`,
      date: new Date().toISOString().slice(0, 10),
      seats: sub.seats,
      plan: p.name,
      amount: sub.seats * p.price,
      status: 'Paid',
    });
    toast.success(`Plan changed to ${p.name}`, {
      description: 'Simulated subscription change applied',
    });
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your platform plan, active seats and billing history. Payments are simulated."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat
          label="Current Plan"
          value={sub.plan}
          icon={Receipt}
          hint={`Renews ${fmtDate(sub.renews)}`}
        />
        <Stat label="Licensed Seats" value={sub.seats} icon={Users} hint="Active employees" />
        <Stat
          label="Monthly Bill"
          value={inr(sub.seats * plan.price * 1.18)}
          icon={IndianRupee}
          hint="Includes 18% GST"
        />
        <Stat label="Platform Total MRR" value={inr(mrr)} icon={Target} delta="14%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const cur = sub.plan === p.name;
          return (
            <Card
              key={p.name}
              className={cn('p-6 relative flex flex-col justify-between', cur && 'ring-2 ring-brand')}
              data-testid={`plan-${p.name.toLowerCase()}`}
            >
              <div>
                {cur && (
                  <span className="absolute top-4 right-4">
                    <Badge tone="brand">Current plan</Badge>
                  </span>
                )}
                <p className="font-semibold text-lg text-[#111827]">{p.name}</p>
                <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                <p className="mt-4">
                  <span className="text-3xl font-semibold tracking-tight text-[#111827]">
                    {inr(p.price)}
                  </span>
                  <span className="text-sm text-slate-500"> /user/month</span>
                </p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {Object.entries(featuresMap).map(([f, plans]) => {
                    const hasFeat = plans.includes(p.name);
                    return (
                      <li
                        key={f}
                        className={cn(
                          'flex items-center gap-2',
                          !hasFeat && 'text-slate-300 line-through'
                        )}
                      >
                        <Check
                          className={cn(
                            'w-4 h-4 shrink-0',
                            hasFeat ? 'text-emerald-500' : 'text-slate-300'
                          )}
                        />
                        <span>{f}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Button
                className="w-full mt-6"
                variant={cur ? 'secondary' : 'primary'}
                disabled={cur}
                onClick={() => setConfirm(p)}
                data-testid={`plan-${p.name.toLowerCase()}-btn`}
              >
                {cur ? (
                  'Active plan'
                ) : p.price > plan.price ? (
                  <>
                    Upgrade to {p.name}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  `Switch to ${p.name}`
                )}
              </Button>
            </Card>
          );
        })}

        <Card className="p-6 flex flex-col justify-between" data-testid="seat-manager">
          <div>
            <p className="font-semibold text-lg text-[#111827]">Users & Seats</p>
            <p className="text-sm text-slate-500 mt-1">
              Adjust licensed seats to add more teammates
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] text-lg font-semibold hover:bg-slate-50"
                data-testid="seat-minus"
              >
                −
              </button>
              <input
                data-testid="seat-input"
                type="number"
                className={cn(inputCls, 'text-center text-lg font-semibold h-10')}
                value={seats}
                onChange={(e) => setSeats(Math.max(1, Number(e.target.value)))}
              />
              <button
                onClick={() => setSeats(seats + 1)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] text-lg font-semibold hover:bg-slate-50"
                data-testid="seat-plus"
              >
                +
              </button>
            </div>

            <div className="mt-6 text-sm space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>
                  {seats} seats × {inr(plan.price)}
                </span>
                <span>{inr(seats * plan.price)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST 18%</span>
                <span>{inr(seats * plan.price * 0.18)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-slate-200 text-[#111827]">
                <span>Total monthly renewal</span>
                <span data-testid="seat-total">{inr(seats * plan.price * 1.18)}</span>
              </div>
            </div>
          </div>

          <Button
            className="w-full mt-6"
            disabled={seats === sub.seats}
            data-testid="seat-save-btn"
            onClick={() => {
              store.set('subscription', { ...sub, seats });
              toast.success(`Seats updated to ${seats}`);
            }}
          >
            Update seats
          </Button>
        </Card>
      </div>

      <Card data-testid="billing-history">
        <CardHead title="Billing history" sub="Generated tax invoices for your subscription" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Seats</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(state.billing || [
                {
                  id: 'b1',
                  number: 'NX-BILL-2680',
                  date: new Date(Date.now() - 864e5 * 30).toISOString().slice(0, 10),
                  seats: 42,
                  plan: 'Pro',
                  amount: 42 * 1299 * 1.18,
                  status: 'Paid',
                },
                {
                  id: 'b2',
                  number: 'NX-BILL-2681',
                  date: new Date().toISOString().slice(0, 10),
                  seats: 42,
                  plan: 'Pro',
                  amount: 42 * 1299 * 1.18,
                  status: 'Paid',
                },
              ]).map((x: any) => (
                <tr key={x.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-[#111827]">{x.number}</td>
                  <td className="px-5 py-3 text-slate-600">{fmtDate(x.date)}</td>
                  <td className="px-5 py-3">
                    <Badge>{x.plan}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{x.seats}</td>
                  <td className="px-5 py-3 font-medium text-[#111827]">{inr(x.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone="success">{x.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Switch to ${confirm?.name}?`}
        description={
          confirm
            ? `${sub.seats} users × ${inr(confirm.price)} = ${inr(
                sub.seats * confirm.price
              )}/month. This is a simulated plan change.`
            : ''
        }
        testid="plan-confirm-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={() => change(confirm)} data-testid="plan-confirm-btn">
              Confirm Change
            </Button>
          </>
        }
      />
    </div>
  );
}

export default function SettingsView() {
  const store = useStore();
  const { state } = store;
  const [tab, setTab] = useState('Profile');
  const me = state.session || { name: 'Admin', email: 'admin@aetherx.app', role: 'Admin' };

  const [prof, setProf] = useState({
    name: me.name || 'Admin',
    email: me.email || 'admin@aetherx.app',
    phone: '+91 98765 43210',
    title: 'Head of Operations',
  });

  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    digest: true,
    sms: false,
  });

  const [sec, setSec] = useState({
    twofa: true,
    sso: false,
    ip: false,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, organization defaults, notification rules and security controls."
      />

      <Tabs
        testid="settings-tabs"
        tabs={['Profile', 'Organisation', 'Notifications', 'Security', 'Data']}
        value={tab}
        onChange={setTab}
      />

      <Card className="p-6 max-w-3xl">
        {tab === 'Profile' && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={prof.name || 'User'} size={56} />
              <div>
                <p className="font-semibold text-lg text-[#111827]">{prof.name}</p>
                <p className="text-sm text-slate-500">{me.role || 'Admin'}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['name', 'Full name'],
                ['email', 'Email address'],
                ['phone', 'Phone number'],
                ['title', 'Job title'],
              ].map(([k, l]) => (
                <Field
                  key={k}
                  f={{ key: `profile-${k}`, label: l }}
                  value={(prof as any)[k]}
                  onChange={(v: string) => setProf({ ...prof, [k]: v })}
                />
              ))}
            </div>
            <Button
              data-testid="profile-save-btn"
              onClick={() => {
                store.set('session', { ...me, name: prof.name, email: prof.email });
                toast.success('Profile details saved successfully');
              }}
            >
              Save profile
            </Button>
          </div>
        )}

        {tab === 'Organisation' && (
          <div className="space-y-4">
            <Field
              f={{ key: 'org-name', label: 'Organisation name' }}
              value={state.brand?.name || 'AetherX'}
              onChange={(v: string) =>
                store.set('brand', { ...(state.brand || {}), name: v })
              }
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                f={{
                  key: 'org-tz',
                  label: 'Time zone',
                  type: 'select',
                  options: ['Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'Asia/Singapore (SGT)'],
                }}
                value="Asia/Kolkata (IST)"
                onChange={() => toast.success('Time zone updated')}
              />
              <Field
                f={{
                  key: 'org-cur',
                  label: 'Currency',
                  type: 'select',
                  options: ['INR (₹)', 'USD ($)', 'AED (د.إ)', 'EUR (€)'],
                }}
                value="INR (₹)"
                onChange={() => toast.success('Workspace default currency updated')}
              />
            </div>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Logos, brand colors, tax legal entities and domains are managed under{' '}
              <span className="font-semibold text-brand">White-Label Configuration</span>.
            </p>
          </div>
        )}

        {tab === 'Notifications' && (
          <div className="divide-y divide-slate-100">
            {Object.entries({
              email: 'Email notifications for leads & tasks',
              push: 'Real-time browser push notifications',
              digest: 'Daily 9:00 AM summary digest',
              sms: 'SMS for urgent escalations & payments',
            }).map(([k, l]) => (
              <div key={k} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-[#111827]">{l}</span>
                <Toggle
                  testid={`pref-${k}`}
                  checked={(prefs as any)[k]}
                  onChange={(v) => {
                    setPrefs({ ...prefs, [k]: v });
                    toast.success('Notification preference saved');
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {tab === 'Security' && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              {Object.entries({
                twofa: 'Enforce Two-Factor Authentication (2FA)',
                sso: 'Single Sign-On (SAML / Okta)',
                ip: 'Restrict login to company IP allowlist',
              }).map(([k, l]) => (
                <div key={k} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-[#111827]">{l}</span>
                  <Toggle
                    testid={`sec-${k}`}
                    checked={(sec as any)[k]}
                    onChange={(v) => {
                      setSec({ ...sec, [k]: v });
                      toast.success(`${l} ${v ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-[#111827]">Active Login Sessions:</p>
              <p>• Chrome on Windows (Current session) — IP 122.161.42.18</p>
              <p>• AetherX Mobile App (iPhone 15) — Active 14 mins ago</p>
            </div>
          </div>
        )}

        {tab === 'Data' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-[#111827]">Workspace Data Management</h4>
              <p className="text-sm text-slate-600 mt-1">
                All records are saved directly in your PostgreSQL / SQLite database store.
                You can reset your organization back to initial clean state whenever required.
              </p>
            </div>
            <Button
              variant="danger"
              data-testid="settings-reset-btn"
              onClick={() => {
                store.reset();
                toast.success('Database reset to clean state with zero records');
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Reset Database State
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
