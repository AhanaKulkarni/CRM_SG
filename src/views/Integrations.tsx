'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  RefreshCw,
  Copy,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Globe,
  Webhook,
  Info,
  Facebook,
  Instagram,
  MessageCircle,
  Mail,
  Calendar,
  CreditCard,
  Slack,
  Zap,
  FileSpreadsheet,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { PlivoSettingsPanel } from '@/components/PlivoSettingsPanel';
import {
  Card,
  CardHead,
  PageHeader,
  Badge,
  Stat,
  Button,
  Tabs,
  Toggle,
  Avatar,
  CHART,
  inr,
  ago,
  inputCls,
  cn,
  Segmented,
  Empty,
} from '@/components/kit';

const APPS: [string, any, string][] = [
  ['Meta', Facebook, 'Facebook & Instagram lead ads'],
  ['Website', Globe, 'Forms, chat widget & webhooks'],
  ['WhatsApp', MessageCircle, 'Business messaging'],
  ['Gmail', Mail, 'Two-way email sync'],
  ['Google Calendar', Calendar, 'Meeting sync'],
  ['Razorpay', CreditCard, 'Payment links on invoices'],
  ['Slack', Slack, 'Team notifications'],
  ['Zapier', Zap, '5,000+ app automations'],
  ['Tally', FileSpreadsheet, 'Accounting export'],
];

function DemoBanner() {
  return (
    <div
      className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 mb-4"
      data-testid="simulated-banner"
    >
      <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
      <span>Demo mode: integration data below is simulated. No live connection to third-party APIs is made.</span>
    </div>
  );
}

function MetaTab() {
  const store = useStore();
  const { state } = store;
  const [busy, setBusy] = useState(false);

  const metaLeads = (state.leads || []).filter((l: any) =>
    ['Facebook', 'Instagram', 'Meta'].includes(l.source)
  );
  const camps = (state.campaigns || []).filter((c: any) =>
    ['Facebook', 'Instagram', 'Meta'].includes(c.channel)
  );

  const sync = () => {
    setBusy(true);
    setTimeout(() => {
      const candidates = [
        { name: 'Deepak Sinha', city: 'Mumbai', source: 'Facebook' },
        { name: 'Ishita Ghosh', city: 'Kolkata', source: 'Instagram' },
        { name: 'Kavita Iyer', city: 'Bengaluru', source: 'Instagram' },
      ];
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      store.add('leads', {
        name: pick.name,
        company: 'Meta lead form',
        email: `${pick.name.split(' ')[0].toLowerCase()}@gmail.com`,
        phone: '+91 98200 11223',
        source: pick.source,
        status: 'New',
        priority: 'Medium',
        owner: 'Priya Nair',
        value: 60000,
        city: pick.city,
        created: new Date().toISOString().slice(0, 10),
      });
      setBusy(false);
      toast.success('Sync complete', { description: `1 new lead imported from ${pick.source}` });
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <DemoBanner />
      <div className="grid md:grid-cols-2 gap-4">
        {[
          ['Facebook Page', 'AetherX Business · 12.4k followers', Facebook, '#1877F2'],
          ['Instagram Business', '@aetherx.crm · 8.9k followers', Instagram, '#E1306C'],
        ].map(([t, s, IconComponent, c]: any) => (
          <Card key={t} className="p-5 flex items-center gap-4">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ background: c }}
            >
              <IconComponent className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t}</p>
              <p className="text-xs text-[#778196] truncate">{s}</p>
            </div>
            <Badge tone="success">Connected</Badge>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Imported leads" value={metaLeads.length} delta={metaLeads.length > 0 ? '+16%' : undefined} />
        <Stat label="Lead forms" value="6" />
        <Stat label="Avg. CPL" value="₹142" delta="-18%" />
        <Stat label="Last sync" value="Just now" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card data-testid="meta-imported-leads">
          <CardHead
            title="Recently imported leads"
            right={
              <Button
                size="sm"
                variant="secondary"
                onClick={sync}
                loading={busy}
                data-testid="meta-sync-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync now
              </Button>
            }
          />
          <div className="px-5 pb-5 space-y-3">
            {metaLeads.length === 0 ? (
              <Empty
                title="No Meta leads yet"
                text="Click 'Sync now' to simulate pulling real leads from Facebook/Instagram ad forms."
                action={
                  <Button size="sm" onClick={sync} loading={busy}>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Import Sample Lead
                  </Button>
                }
              />
            ) : (
              metaLeads.slice(0, 6).map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <Avatar name={l.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{l.name}</p>
                    <p className="text-xs text-[#778196] truncate">
                      {l.source} lead form · {l.city || 'India'}
                    </p>
                  </div>
                  <Badge>{l.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHead title="Meta campaign performance" />
          <div className="px-5 pb-5 space-y-4">
            {camps.length === 0 ? (
              <p className="text-sm text-[#778196] py-6 text-center">
                No Meta campaigns running currently.
              </p>
            ) : (
              camps.map((c: any) => (
                <div key={c.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#1C2433]">{c.name}</span>
                    <span className="text-[#778196] text-xs">{c.channel}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                    {[
                      ['Leads', c.leads || 0],
                      ['Spend', inr(c.spend || 0)],
                      ['CPL', c.leads > 0 ? inr(Math.round(c.spend / c.leads)) : inr(0)],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-slate-50 py-2">
                        <p className="text-sm font-semibold text-[#1C2433]">{v}</p>
                        <p className="text-[11px] text-[#778196]">{k}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WebsiteTab() {
  const store = useStore();
  const { state } = store;
  const [key, setKey] = useState('nx_live_8f3k2m9q7w4t1z6b');
  const [vals, setVals] = useState<Record<string, string>>({});

  const fields = state.formFields || [
    { id: 'f0', label: 'Full name', type: 'text', required: true },
    { id: 'f1', label: 'Work email', type: 'email', required: true },
    { id: 'f2', label: 'Phone number', type: 'tel', required: false },
    { id: 'f3', label: 'Company size', type: 'select', required: false },
    { id: 'f4', label: 'Project details', type: 'textarea', required: false },
  ];

  const setFields = (f: any) => store.set('formFields', f);

  const move = (i: number, d: number) => {
    const f = [...fields];
    [f[i], f[i + d]] = [f[i + d], f[i]];
    setFields(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = vals.f0 || vals.name || 'Website visitor';
    const email = vals.f1 || vals.email || '';
    const phone = vals.f2 || vals.phone || '';
    const msg = vals.f4 || vals.message || 'Form submission preview';

    store.add('enquiries', {
      name,
      email,
      phone,
      page: '/contact',
      message: msg,
      time: new Date().toISOString(),
      utm: 'direct',
    });

    store.add('leads', {
      name,
      company: 'Website enquiry',
      email,
      phone,
      source: 'Website',
      status: 'New',
      priority: 'Medium',
      owner: 'Rohan Mehta',
      value: 50000,
      city: '',
      created: new Date().toISOString().slice(0, 10),
    });

    store.notify('New website enquiry', `${name} submitted the contact form`, 'lead');
    setVals({});
    toast.success('Submission captured', { description: 'Lead created and auto-assigned to sales' });
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = `${origin}/api/webhooks/leads`;

  return (
    <div className="space-y-4">
      <DemoBanner />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card data-testid="form-builder">
          <CardHead
            title="Enquiry form builder"
            sub="Drag-free ordering with arrows"
            right={
              <Button
                size="sm"
                variant="secondary"
                data-testid="form-add-field-btn"
                onClick={() =>
                  setFields([
                    ...fields,
                    {
                      id: `f_${Date.now()}`,
                      label: 'New field',
                      type: 'text',
                      required: false,
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5" />
                Add Field
              </Button>
            }
          />
          <div className="px-5 pb-5 space-y-2">
            {fields.map((f: any, i: number) => (
              <div
                key={f.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 rounded-lg border border-[#E1E5ED] bg-white"
              >
                <input
                  className={cn(inputCls, 'flex-1 min-w-[120px]')}
                  value={f.label}
                  onChange={(e) =>
                    setFields(
                      fields.map((x: any) =>
                        x.id === f.id ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                />
                <select
                  className={cn(inputCls, 'w-28')}
                  value={f.type}
                  onChange={(e) =>
                    setFields(
                      fields.map((x: any) =>
                        x.id === f.id ? { ...x, type: e.target.value } : x
                      )
                    )
                  }
                >
                  {['text', 'email', 'tel', 'select', 'textarea'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-xs text-[#778196] whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) =>
                      setFields(
                        fields.map((x: any) =>
                          x.id === f.id ? { ...x, required: e.target.checked } : x
                        )
                      )
                    }
                  />
                  Req.
                </label>
                <button
                  disabled={!i}
                  onClick={() => move(i, -1)}
                  className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={i === fields.length - 1}
                  onClick={() => move(i, 1)}
                  className="p-1 text-slate-400 disabled:opacity-30 hover:text-slate-700"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFields(fields.filter((x: any) => x.id !== f.id))}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-testid="form-preview">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Live preview
          </p>
          <form
            onSubmit={submit}
            className="rounded-xl border border-[#E1E5ED] p-5 space-y-3 bg-slate-50/50"
          >
            <p className="font-semibold text-sm text-[#1C2433]">Talk to our team</p>
            {fields.map((f: any) => (
              <label key={f.id} className="block">
                <span className="text-xs text-slate-600 font-medium">
                  {f.label}
                  {f.required && ' *'}
                </span>
                {f.type === 'textarea' ? (
                  <textarea
                    className={cn(inputCls, 'h-20 py-2 mt-1')}
                    value={vals[f.id] || ''}
                    onChange={(e) => setVals({ ...vals, [f.id]: e.target.value })}
                  />
                ) : f.type === 'select' ? (
                  <select
                    className={cn(inputCls, 'mt-1')}
                    value={vals[f.id] || ''}
                    onChange={(e) => setVals({ ...vals, [f.id]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    <option>1–10</option>
                    <option>11–50</option>
                    <option>51–200</option>
                    <option>200+</option>
                  </select>
                ) : (
                  <input
                    data-testid={`preview-field-${f.id}`}
                    required={f.required}
                    type={f.type}
                    className={cn(inputCls, 'mt-1')}
                    value={vals[f.id] || ''}
                    onChange={(e) => setVals({ ...vals, [f.id]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <Button className="w-full mt-2" data-testid="form-preview-submit">
              Submit enquiry
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 space-y-4" data-testid="webhook-config">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-sm">API & webhook configuration</h3>
          </div>
          {[
            ['Webhook endpoint', url],
            ['API key', key],
          ].map(([l, v]) => (
            <label key={l} className="block">
              <span className="text-xs text-[#778196]">{l}</span>
              <div className="flex gap-2 mt-1">
                <input readOnly className={cn(inputCls, 'font-mono text-xs')} value={v} />
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(v);
                    toast.success('Copied to clipboard');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </label>
          ))}
          <pre className="text-[11px] bg-[#1C2433] text-slate-300 rounded-lg p-3 overflow-x-auto leading-relaxed">
            {`curl -X POST ${url} \\\n  -H "Authorization: Bearer ${key.slice(0, 12)}…" \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Ravi Kumar","email":"ravi@acme.in","company":"Acme Corp"}'`}
          </pre>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              data-testid="regenerate-key-btn"
              onClick={() => {
                setKey(`nx_live_${Math.random().toString(36).slice(2, 18)}`);
                toast.success('API key regenerated');
              }}
            >
              Regenerate key
            </Button>
            <Button
              data-testid="test-webhook-btn"
              onClick={() =>
                toast.success('Test webhook delivered', {
                  description: '200 OK · 142 ms (simulated payload received)',
                })
              }
            >
              Send test event
            </Button>
          </div>
        </Card>

        <Card data-testid="website-enquiries">
          <CardHead
            title="Incoming website enquiries"
            sub={`${(state.enquiries || []).length} total`}
          />
          <div className="px-5 pb-5 space-y-3 max-h-[360px] overflow-y-auto">
            {(state.enquiries || []).length === 0 ? (
              <Empty
                title="No enquiries yet"
                text="Submit the form in the live preview to test incoming lead capture."
              />
            ) : (
              (state.enquiries || []).map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg border border-[#E1E5ED]">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-medium text-[#1C2433]">{e.name}</p>
                    <span className="text-xs text-slate-400">{ago(e.time)}</span>
                  </div>
                  <p className="text-xs text-[#778196]">
                    {e.email || 'No email'} · {e.page || '/contact'} · {e.utm || 'direct'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{e.message}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DevicesTab() {
  const [dev, setDev] = useState('Mobile');
  const [sync, setSync] = useState<Record<string, boolean>>({
    push: true,
    email: true,
    sms: false,
    offline: true,
  });

  const w: Record<string, any> = { Desktop: '100%', Tablet: 768, Mobile: 390 };
  const sdata = Array.from({ length: 12 }, (_, i) => ({
    h: `${i * 2}:00`,
    events: Math.round(120 + Math.sin(i / 2) * 60 + i * 8),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Sync status" value="Healthy" hint="all devices" />
        <Stat label="Mobile users" value="31" hint="of 42 employees" />
        <Stat label="Last sync" value="12s ago" />
        <Stat label="Push delivered" value="98.6%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5" data-testid="device-preview">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-sm">Device preview</h3>
            <Segmented
              testid="device-switcher"
              options={[
                {
                  value: 'Desktop',
                  label: (
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </span>
                  ),
                },
                {
                  value: 'Tablet',
                  label: (
                    <span className="flex items-center gap-1">
                      <Tablet className="w-3.5 h-3.5" />
                      Tablet
                    </span>
                  ),
                },
                {
                  value: 'Mobile',
                  label: (
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </span>
                  ),
                },
              ]}
              value={dev}
              onChange={setDev}
            />
          </div>
          <div className="bg-slate-100 rounded-xl p-4 flex justify-center overflow-hidden">
            <div
              className={cn(
                'bg-white overflow-hidden shadow-xl transition-[width] duration-500 max-w-full',
                dev === 'Mobile'
                  ? 'rounded-[32px] border-[8px] border-[#1C2433]'
                  : 'rounded-lg border border-[#E1E5ED]'
              )}
              style={{ width: w[dev] }}
            >
              <iframe
                title="preview"
                src="/app/overview"
                className="w-full h-[620px] border-0"
                data-testid="device-iframe"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-sm mb-3">Notification synchronisation</h3>
            {[
              ['push', 'Mobile push notifications'],
              ['email', 'Email digests'],
              ['sms', 'SMS alerts'],
              ['offline', 'Offline mode & background sync'],
            ].map(([k, l]) => (
              <div
                key={k}
                className="flex items-center justify-between py-2.5 border-t border-slate-100 first:border-0"
              >
                <span className="text-sm text-[#1C2433]">{l}</span>
                <Toggle
                  testid={`sync-${k}`}
                  checked={sync[k]}
                  onChange={(v) => {
                    setSync({ ...sync, [k]: v });
                    toast.success(`${l} ${v ? 'enabled' : 'disabled'}`);
                  }}
                />
              </div>
            ))}
          </Card>

          <Card>
            <CardHead title="Sync events today" />
            <div className="h-40 px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sdata}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="h" tick={CHART.axis} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip {...CHART.tooltip} />
                  <Area
                    dataKey="events"
                    stroke="var(--brand)"
                    fill="var(--brand)"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5 text-sm space-y-2">
            <h3 className="font-semibold mb-1">Connected devices</h3>
            {[
              ['iPhone 15 · Aisha Khan', 'iOS 19'],
              ['Pixel 9 · Rohan Mehta', 'Android 16'],
              ['Galaxy Tab · Front desk', 'Android 15'],
            ].map(([d, o]) => (
              <div key={d} className="flex justify-between py-1 border-t border-slate-100 first:border-0">
                <span className="text-slate-700">{d}</span>
                <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {o}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsView() {
  const store = useStore();
  const { state } = store;
  const [tab, setTab] = useState('All Integrations');

  const integrationsMap = state.integrations || {
    Meta: true,
    Website: true,
    WhatsApp: false,
    Gmail: true,
    'Google Calendar': true,
    Razorpay: true,
    Slack: false,
    Zapier: false,
    Tally: false,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Connect lead sources, messaging, payment gateways and external devices."
      />

      <Tabs
        testid="integration-tabs"
        tabs={['All Integrations', 'Plivo Telephony', 'Meta', 'Website', 'Mobile & Web']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'All Integrations' && (
        <div className="space-y-4">
          <DemoBanner />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {APPS.map(([n, IconComponent, d]) => {
              const on = !!integrationsMap[n];
              return (
                <Card
                  key={n}
                  className="p-5 hover:border-slate-300 transition-colors"
                  data-testid={`integration-${n.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-slate-700" />
                    </span>
                    <Toggle
                      testid={`integration-toggle-${n.toLowerCase().replace(/\s/g, '-')}`}
                      checked={on}
                      onChange={(v) => {
                        store.set('integrations', { ...integrationsMap, [n]: v });
                        toast.success(`${n} ${v ? 'connected' : 'disconnected'}`);
                      }}
                    />
                  </div>
                  <p className="font-semibold text-base mt-4 text-[#1C2433]">{n}</p>
                  <p className="text-sm text-[#778196] mt-1">{d}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Badge tone={on ? 'success' : 'neutral'}>
                      {on ? 'Connected' : 'Not connected'}
                    </Badge>
                    {['Meta', 'Website'].includes(n) && (
                      <button
                        className="text-xs text-brand font-medium hover:underline"
                        onClick={() => setTab(n)}
                      >
                        Configure →
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'Plivo Telephony' && <PlivoSettingsPanel />}
      {tab === 'Meta' && <MetaTab />}
      {tab === 'Website' && <WebsiteTab />}
      {tab === 'Mobile & Web' && <DevicesTab />}
    </div>
  );
}
