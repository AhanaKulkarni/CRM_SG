'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ShieldCheck,
  ArrowLeft,
  Building2,
  Users,
  IndianRupee,
  Activity,
  LogOut,
  Check,
  Lock,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import {
  Card,
  CardHead,
  CrudTable,
  Badge,
  Stat,
  Avatar,
  Button,
  Tabs,
  Toggle,
  CHART,
  inr,
  fmtDate,
  inputCls,
  cn,
  Field,
} from '@/components/kit';

const dayOffset = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function AdminView() {
  const store = useStore();
  const { state } = store;
  const router = useRouter();

  const [tab, setTab] = useState('Organisations');
  const orgs = state.orgs || [
    {
      id: 'org-1',
      name: 'Nexora Technologies',
      domain: 'nexora.app',
      plan: 'Pro',
      users: 42,
      status: 'Active',
      created: '2026-01-15',
      primary: '#6366F1',
      secondary: '#8B5CF6',
      region: 'Mumbai (ap-south-1)',
    },
    {
      id: 'org-2',
      name: 'Apex Global Logistics',
      domain: 'apexlogistics.in',
      plan: 'Pro',
      users: 18,
      status: 'Active',
      created: '2026-02-01',
      primary: '#0D9488',
      secondary: '#0EA5E9',
      region: 'Mumbai (ap-south-1)',
    },
    {
      id: 'org-3',
      name: 'Zenith Real Estate',
      domain: 'zenithrealty.co',
      plan: 'Basic',
      users: 8,
      status: 'Active',
      created: '2026-02-14',
      primary: '#EA580C',
      secondary: '#F59E0B',
      region: 'Hyderabad (ap-south-2)',
    },
    {
      id: 'org-4',
      name: 'Bluefin Wealth Advisory',
      domain: 'bluefinwealth.com',
      plan: 'Pro',
      users: 25,
      status: 'Active',
      created: '2026-02-20',
      primary: '#2563EB',
      secondary: '#7C3AED',
      region: 'Mumbai (ap-south-1)',
    },
    {
      id: 'org-5',
      name: 'Pulse Healthcare Labs',
      domain: 'pulselabs.health',
      plan: 'Basic',
      users: 12,
      status: 'Trial',
      created: '2026-03-01',
      primary: '#16A34A',
      secondary: '#65A30D',
      region: 'Singapore (ap-southeast-1)',
    },
  ];

  const [tenant, setTenant] = useState(orgs[0]?.id);
  const t = orgs.find((o: any) => o.id === tenant) || orgs[0];

  const mrr = orgs
    .filter((o: any) => o.status !== 'Suspended')
    .reduce((a: number, o: any) => a + (o.users || 1) * (o.plan === 'Pro' ? 1299 : 999), 0);

  const usage = Array.from({ length: 14 }, (_, i) => ({
    d: dayOffset(i - 13).slice(5),
    api: Math.round(42000 + Math.sin(i / 2) * 9000 + i * 1500),
    users: Math.round(120 + i * 3 + Math.cos(i) * 10),
  }));

  const employees = state.employees || [];
  const users = orgs.flatMap((o: any, oi: number) =>
    (oi === 0 && employees.length > 0
      ? employees.slice(0, 8)
      : [
          { id: '1', name: 'Aisha Khan', email: `aisha@${o.domain}`, role: 'Admin' },
          { id: '2', name: 'Rohan Mehta', email: `rohan@${o.domain}`, role: 'Manager' },
          { id: '3', name: 'Priya Nair', email: `priya@${o.domain}`, role: 'Executive' },
        ]
    ).map((e: any, i: number) => ({
      id: `${o.id}-${e.id || i}`,
      name: e.name,
      email: e.email || `${e.name.toLowerCase().replace(' ', '.')}@${o.domain}`,
      org: o.name,
      role: e.role || (i === 0 ? 'Admin' : 'Member'),
      status: o.status === 'Suspended' ? 'Suspended' : 'Active',
    }))
  );

  const [disabled, setDisabled] = useState<Record<string, boolean>>({});

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

  const sys = state.system || {
    maintenance: false,
    signups: false,
    twoFactor: true,
    region: 'Mumbai (ap-south-1)',
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Super Admin Top Header */}
      <header className="bg-[#111827] text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">Nexora Platform · Super Admin</p>
            <p className="text-[11px] text-slate-400">Multi-tenant control centre</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-white/10 text-xs sm:text-sm"
              onClick={() => router.push('/app/overview')}
              data-testid="admin-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Workspace</span>
            </Button>
            <Button
              variant="ghost"
              className="text-slate-300 hover:bg-white/10"
              onClick={handleLogout}
              data-testid="admin-logout-btn"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111827]">
            Platform Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global multi-tenant governance, organization subscriptions, usage logs and feature flags.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Stat
            testid="admin-stat-orgs"
            label="Total Organisations"
            value={orgs.length}
            icon={Building2}
            delta="+2"
            hint="This month"
          />
          <Stat
            label="Active Users"
            value={orgs.reduce((a: number, o: any) => a + (o.users || 1), 0)}
            icon={Users}
            delta="11%"
          />
          <Stat label="Platform Total MRR" value={inr(mrr)} icon={IndianRupee} delta="14%" />
          <Stat label="Platform Uptime (30d)" value="99.97%" icon={Activity} />
        </div>

        <Tabs
          testid="admin-tabs"
          tabs={[
            'Organisations',
            'Users',
            'Subscriptions',
            'Tenant Config',
            'Feature Access',
            'Usage',
            'System',
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'Organisations' && (
          <CrudTable
            testid="orgs"
            collection="orgs"
            entity="Organisation"
            addLabel="Add organisation"
            fields={FIELDS.orgs ? FIELDS.orgs() : []}
            defaults={{
              plan: 'Basic',
              users: 5,
              status: 'Active',
              created: new Date().toISOString().slice(0, 10),
              primary: '#6366F1',
              secondary: '#8B5CF6',
              region: 'Mumbai (ap-south-1)',
            }}
            searchKeys={['name', 'domain']}
            filters={[
              { key: 'plan', label: 'plans', options: ['Basic', 'Pro'] },
              { key: 'status', label: 'statuses', options: ['Active', 'Trial', 'Suspended'] },
            ]}
            rowActions={(o: any) => (
              <button
                data-testid={`org-suspend-${o.id}`}
                onClick={() => {
                  store.update('orgs', o.id, {
                    status: o.status === 'Suspended' ? 'Active' : 'Suspended',
                  });
                  toast.success(
                    o.status === 'Suspended'
                      ? 'Organisation reactivated'
                      : 'Organisation suspended'
                  );
                }}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-md font-medium transition-colors',
                  o.status === 'Suspended'
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    : 'text-red-700 bg-red-50 hover:bg-red-100'
                )}
              >
                {o.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
              </button>
            )}
            columns={[
              {
                key: 'name',
                label: 'Organisation',
                render: (o: any) => (
                  <span className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
                      style={{ background: o.primary || '#6366F1' }}
                    >
                      {o.name[0]}
                    </span>
                    <span>
                      <span className="block font-medium text-[#111827]">{o.name}</span>
                      <span className="block text-xs text-slate-500">{o.domain}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'plan', label: 'Plan', render: (o: any) => <Badge>{o.plan}</Badge> },
              { key: 'users', label: 'Users' },
              {
                key: 'mrr',
                label: 'MRR',
                render: (o: any) => inr(o.users * (o.plan === 'Pro' ? 1299 : 999)),
              },
              {
                key: 'status',
                label: 'Status',
                render: (o: any) => (
                  <Badge tone={o.status === 'Active' ? 'success' : o.status === 'Suspended' ? 'danger' : 'neutral'}>
                    {o.status}
                  </Badge>
                ),
              },
              {
                key: 'created',
                label: 'Created',
                render: (o: any) => fmtDate(o.created),
              },
            ]}
          />
        )}

        {tab === 'Users' && (
          <CrudTable
            testid="platform-users"
            rows={users}
            searchKeys={['name', 'email', 'org']}
            filters={[
              {
                key: 'org',
                label: 'organisations',
                options: orgs.map((o: any) => o.name),
              },
            ]}
            rowActions={(u: any) => (
              <Toggle
                testid={`user-toggle-${u.id}`}
                checked={!disabled[u.id] && u.status === 'Active'}
                onChange={(v) => {
                  setDisabled({ ...disabled, [u.id]: !v });
                  toast.success(v ? 'User login access enabled' : 'User login access suspended');
                }}
              />
            )}
            columns={[
              {
                key: 'name',
                label: 'User',
                render: (u: any) => (
                  <span className="flex items-center gap-2">
                    <Avatar name={u.name} size={28} />
                    <span>
                      <span className="block font-medium text-[#111827]">{u.name}</span>
                      <span className="block text-xs text-slate-500">{u.email}</span>
                    </span>
                  </span>
                ),
              },
              { key: 'org', label: 'Organisation' },
              {
                key: 'role',
                label: 'Role',
                render: (u: any) => <Badge tone="brand">{u.role}</Badge>,
              },
              {
                key: 'status',
                label: 'Status',
                render: (u: any) => (
                  <Badge tone={disabled[u.id] ? 'danger' : u.status === 'Active' ? 'success' : 'neutral'}>
                    {disabled[u.id] ? 'Suspended' : u.status}
                  </Badge>
                ),
              },
            ]}
          />
        )}

        {tab === 'Subscriptions' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card>
              <CardHead title="Plan distribution" sub="Pro vs Basic tenant breakdown" />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={['Basic', 'Pro'].map((p) => ({
                        name: p,
                        value: orgs.filter((o: any) => o.plan === p).length,
                      }))}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      <Cell fill="#94A3B8" />
                      <Cell fill="var(--brand)" />
                    </Pie>
                    <Tooltip {...CHART.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-5 pb-5 text-sm space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Basic · ₹999/user</span>
                  <span className="font-semibold text-[#111827]">
                    {orgs.filter((o: any) => o.plan === 'Basic').length} orgs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Pro · ₹1,299/user</span>
                  <span className="font-semibold text-[#111827]">
                    {orgs.filter((o: any) => o.plan === 'Pro').length} orgs
                  </span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 overflow-x-auto" data-testid="admin-subscriptions">
              <CardHead
                title="Active subscriptions"
                sub={`Monthly MRR ${inr(mrr)} · Annualized ARR ${inr(mrr * 12)}`}
              />
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70 border-b border-slate-100">
                    <th className="px-5 py-3">Organisation</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Users</th>
                    <th className="px-5 py-3">MRR</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o: any) => (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-[#111827]">{o.name}</td>
                      <td className="px-5 py-3">
                        <Badge tone={o.plan === 'Pro' ? 'brand' : 'neutral'}>{o.plan}</Badge>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{o.users}</td>
                      <td className="px-5 py-3 font-medium text-[#111827]">
                        {inr(o.users * (o.plan === 'Pro' ? 1299 : 999))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {o.plan === 'Basic' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            data-testid={`admin-upgrade-${o.id}`}
                            onClick={() => {
                              store.update('orgs', o.id, { plan: 'Pro' });
                              toast.success(`${o.name} upgraded to Pro`);
                            }}
                          >
                            Upgrade to Pro
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {tab === 'Tenant Config' && t && (
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-3 h-fit space-y-1">
              <p className="text-xs font-semibold uppercase text-slate-400 px-2 py-1">
                Select Client Tenant
              </p>
              {orgs.map((o: any) => (
                <button
                  key={o.id}
                  onClick={() => setTenant(o.id)}
                  data-testid={`tenant-${o.id}`}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors',
                    tenant === o.id ? 'bg-brand-soft text-brand font-medium' : 'hover:bg-slate-50'
                  )}
                >
                  <span
                    className="w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0"
                    style={{ background: o.primary || '#6366F1' }}
                  >
                    {o.name[0]}
                  </span>
                  <span className="text-sm font-medium truncate text-[#111827]">{o.name}</span>
                </button>
              ))}
            </Card>

            <Card className="lg:col-span-2 p-6 space-y-5" data-testid="tenant-config">
              <div>
                <h3 className="font-semibold text-lg text-[#111827]">{t.name} Configuration</h3>
                <p className="text-xs text-slate-500">
                  Override multi-tenant domain mapping, plan limits and isolated cloud region.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  f={{ key: 'tenant-domain', label: 'Custom Domain' }}
                  value={t.domain}
                  onChange={(v: string) => store.update('orgs', t.id, { domain: v })}
                />
                <Field
                  f={{
                    key: 'tenant-region',
                    label: 'Isolated Data Region',
                    type: 'select',
                    options: [
                      'Mumbai (ap-south-1)',
                      'Hyderabad (ap-south-2)',
                      'Singapore (ap-southeast-1)',
                    ],
                  }}
                  value={t.region || 'Mumbai (ap-south-1)'}
                  onChange={(v: string) => store.update('orgs', t.id, { region: v })}
                />
                <Field
                  f={{ key: 'tenant-users', label: 'Licensed User Limit', type: 'number' }}
                  value={t.users}
                  onChange={(v: any) => store.update('orgs', t.id, { users: Number(v) })}
                />
                <Field
                  f={{
                    key: 'tenant-plan',
                    label: 'Platform Plan',
                    type: 'select',
                    options: ['Basic', 'Pro'],
                  }}
                  value={t.plan}
                  onChange={(v: string) => store.update('orgs', t.id, { plan: v })}
                />
                <Field
                  f={{ key: 'tenant-primary', label: 'Brand Primary Accent', type: 'color' }}
                  value={t.primary}
                  onChange={(v: string) => store.update('orgs', t.id, { primary: v })}
                />
                <Field
                  f={{ key: 'tenant-secondary', label: 'Brand Secondary Accent', type: 'color' }}
                  value={t.secondary}
                  onChange={(v: string) => store.update('orgs', t.id, { secondary: v })}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Button
                  onClick={() => toast.success('Tenant configuration updated')}
                  data-testid="tenant-save-btn"
                >
                  Save Configuration
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    store.set('brand', {
                      ...state.brand,
                      name: t.name,
                      short: t.name.split(' ')[0],
                      primary: t.primary,
                      secondary: t.secondary,
                      logo: '',
                    });
                    router.push('/app/overview');
                    toast.success(`Switched active workspace view to ${t.name}`);
                  }}
                  data-testid="tenant-impersonate-btn"
                >
                  Open as Tenant
                </Button>
              </div>
            </Card>
          </div>
        )}

        {tab === 'Feature Access' && (
          <Card className="overflow-x-auto" data-testid="feature-access">
            <CardHead
              title="Feature access by plan"
              sub="Toggle feature flags dynamically across subscription tiers"
            />
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3">Feature Name</th>
                  <th className="px-5 py-3 text-center">Basic Tier</th>
                  <th className="px-5 py-3 text-center">Pro Tier</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(featuresMap).map(([f, plans]) => (
                  <tr key={f} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3 font-medium text-[#111827]">{f}</td>
                    {['Basic', 'Pro'].map((p) => {
                      const on = plans.includes(p);
                      return (
                        <td key={p} className="px-5 py-3 text-center">
                          <button
                            data-testid={`feature-${f.replace(/\s/g, '-').toLowerCase()}-${p.toLowerCase()}`}
                            onClick={() => {
                              store.set('features', {
                                ...featuresMap,
                                [f]: on
                                  ? featuresMap[f].filter((x) => x !== p)
                                  : [...featuresMap[f], p],
                              });
                              toast.success(
                                `${f} ${on ? 'disabled on' : 'enabled for'} ${p} plan`
                              );
                            }}
                            className={cn(
                              'w-6 h-6 rounded-md border inline-flex items-center justify-center transition-all',
                              on
                                ? 'bg-brand border-transparent text-white shadow-sm'
                                : 'border-slate-300 hover:border-slate-400'
                            )}
                          >
                            {on && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'Usage' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card data-testid="usage-api">
              <CardHead title="Platform API requests / day" sub="Aggregated multi-tenant requests" />
              <div className="h-64 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usage}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="d" tick={CHART.axis} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART.tooltip} />
                    <Area
                      dataKey="api"
                      stroke="var(--brand)"
                      fill="var(--brand)"
                      fillOpacity={0.12}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHead title="Daily active users" sub="Unique employee sessions" />
              <div className="h-64 px-2 pb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usage}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="d" tick={CHART.axis} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART.tooltip} />
                    <Bar dataKey="users" fill="var(--brand2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="lg:col-span-2 p-5">
              <h3 className="font-semibold text-sm text-[#111827] mb-1">
                Storage & Database consumption by tenant
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Storage quotas allocated per tenant plan (25 GB soft quota)
              </p>
              <div className="space-y-3.5">
                {orgs.map((o: any, i: number) => {
                  const gb = [18.4, 9.2, 5.1, 22.7, 1.3][i] || 3.5;
                  return (
                    <div key={o.id} className="flex items-center gap-4 text-sm">
                      <span className="w-48 font-medium truncate text-[#111827]">{o.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (gb / 25) * 100)}%`,
                            background: o.primary || '#6366F1',
                          }}
                        />
                      </div>
                      <span className="w-20 text-right text-xs font-semibold text-slate-600">
                        {gb} GB / 25GB
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {tab === 'System' && (
          <Card className="p-6 max-w-2xl space-y-4" data-testid="system-settings">
            <h3 className="font-semibold text-base text-[#111827]">Global Platform Settings</h3>
            <div className="divide-y divide-slate-100">
              {[
                ['maintenance', 'Maintenance mode', 'Show a maintenance banner to all tenants'],
                ['signups', 'Self-serve sign-ups', 'Allow new organizations to self-register without invitation'],
                ['twoFactor', 'Enforce 2FA for admins', 'Require two-factor authentication for all client tenant admins'],
              ].map(([k, l, d]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{l}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{d}</p>
                  </div>
                  <Toggle
                    testid={`system-${k}`}
                    checked={(sys as any)[k]}
                    onChange={(v) => {
                      store.set('system', { ...sys, [k]: v });
                      toast.success(`${l} ${v ? 'enabled' : 'disabled'}`);
                    }}
                  />
                </div>
              ))}
            </div>
            <label className="block pt-3 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-600 block mb-1">
                Default primary data region for new tenants
              </span>
              <select
                className={inputCls}
                value={sys.region}
                onChange={(e) => {
                  store.set('system', { ...sys, region: e.target.value });
                  toast.success('Default region updated');
                }}
              >
                {[
                  'Mumbai (ap-south-1)',
                  'Hyderabad (ap-south-2)',
                  'Singapore (ap-southeast-1)',
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </Card>
        )}
      </main>
    </div>
  );
}
