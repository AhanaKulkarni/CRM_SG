'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Mail, Phone, MapPin, Plus, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Avatar,
  Button,
  inr,
  fmtDate,
  invTotal,
  Empty,
  Stat,
  CHART,
  inputCls,
  Tabs,
  FormModal,
} from '@/components/kit';

const SEG = ['Enterprise', 'SMB', 'Startup'];
const SEG_C = ['#8B83F6', '#0EA5E9', '#6965ED'];
const todayIso = new Date().toISOString().slice(0, 10);

export function CustomersView() {
  const store = useStore();
  const { state } = store;
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const customers = state.customers || [];
  const activeCount = customers.filter((c: any) => c.status === 'Active').length;
  const avgLtv =
    customers.length > 0
      ? customers.reduce((a: number, c: any) => a + Number(c.ltv || 0), 0) / customers.length
      : 0;

  const seg = SEG.map((s) => ({
    name: s,
    value: customers.filter((c: any) => c.segment === s).length,
  }));

  const defaults = {
    status: 'Active',
    segment: 'SMB',
    since: todayIso,
    lastContact: todayIso,
    ltv: 0,
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Your customer database, segments and relationship history."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="w-4 h-4" />
            Add customer
          </Button>
        }
      />

      <div className="grid lg:grid-cols-4 gap-4 mb-4">
        <div className="grid grid-cols-2 lg:col-span-3 lg:grid-cols-3 gap-3 sm:gap-4 stagger">
          <Stat label="Active customers" value={activeCount.toString()} />
          <Stat label="Avg. lifetime value" value={inr(avgLtv)} />
          <Stat label="Retention rate" value={customers.length > 0 ? '94.2%' : '100%'} />
        </div>

        <Card className="p-4 flex items-center gap-3" data-testid="customer-segments">
          {customers.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 text-center w-full">No segments to show</p>
          ) : (
            <>
              <div className="w-24 h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={seg} dataKey="value" innerRadius={26} outerRadius={44}>
                      {seg.map((s, i) => (
                        <Cell key={s.name} fill={SEG_C[i % SEG_C.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs space-y-1.5 min-w-0">
                {seg.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SEG_C[i % SEG_C.length] }}
                    />
                    <span className="text-slate-600 truncate">{s.name}</span>
                    <span className="font-semibold text-[#1C2433] ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <CrudTable
          testid="customers"
          collection="customers"
          entity="Customer"
          addLabel="Add customer"
          fields={FIELDS.customers(state)}
          defaults={defaults}
          searchKeys={['name', 'company', 'email', 'city']}
          onRowClick={(c: any) => router.push(`/app/customers/${c.id}`)}
          filters={[
            { key: 'segment', label: 'segments', options: SEG },
            { key: 'status', label: 'statuses', options: ['Active', 'Inactive'] },
          ]}
          columns={[
            {
              key: 'company',
              label: 'Customer',
              render: (c: any) => (
                <div className="flex items-center gap-3">
                  <Avatar name={c.company} size={30} />
                  <div>
                    <p className="font-medium text-[#1C2433]">{c.company}</p>
                    <p className="text-xs text-[#778196]">{c.name}</p>
                  </div>
                </div>
              ),
            },
            {
              key: 'email',
              label: 'Contact',
              render: (c: any) => (
                <div>
                  <p className="text-slate-700">{c.email || '—'}</p>
                  <p className="text-xs text-[#778196]">{c.phone || '—'}</p>
                </div>
              ),
            },
            { key: 'segment', label: 'Segment', render: (c: any) => <Badge>{c.segment}</Badge> },
            { key: 'status', label: 'Status', render: (c: any) => <Badge>{c.status}</Badge> },
            { key: 'ltv', label: 'Lifetime value', render: (c: any) => inr(c.ltv) },
            { key: 'owner', label: 'Owner', render: (c: any) => c.owner || '—' },
            { key: 'lastContact', label: 'Last contact', render: (c: any) => fmtDate(c.lastContact) },
          ]}
        />
      </div>

      {/* Mobile Customer Cards View */}
      <div className="sm:hidden space-y-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">All Customers ({customers.length})</span>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </Button>
        </div>
        {customers.length === 0 ? (
          <Card>
            <Empty
              title="No customers yet"
              text="Add your first customer to start tracking relationship history."
              action={
                <Button onClick={() => setAdding(true)}>
                  <Plus className="w-4 h-4" />
                  Add Customer
                </Button>
              }
            />
          </Card>
        ) : (
          customers.map((c: any) => (
            <Card
              key={c.id}
              className="p-4 hover-lift cursor-pointer"
              onClick={() => router.push(`/app/customers/${c.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={c.company} size={36} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-[#1C2433]">{c.company}</p>
                    <p className="text-xs text-[#778196] truncate">{c.name}</p>
                  </div>
                </div>
                <Badge>{c.status}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">LTV: </span>
                  <span className="font-semibold text-[#1C2433]">{inr(c.ltv)}</span>
                </div>
                <Badge tone="violet">{c.segment}</Badge>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
                <span>{c.email || c.phone || 'No contact'}</span>
                <span>Owner: {c.owner || 'Unassigned'}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <FormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="New customer"
        fields={FIELDS.customers(state)}
        initial={defaults}
        onSubmit={(v: any) => {
          store.add('customers', { ...defaults, ...v });
          toast.success('Customer created');
        }}
      />
    </div>
  );
}

export function CustomerDetailView({ customerId }: { customerId?: string }) {
  const store = useStore();
  const { state } = store;
  const router = useRouter();
  const params = useParams();
  const id = customerId || (params?.id as string);

  const [tab, setTab] = useState('Timeline');
  const [txt, setTxt] = useState('');
  const [kind, setKind] = useState('Call');

  const c = (state.customers || []).find((x: any) => x.id === id);

  if (!c) {
    return (
      <Card className="p-8">
        <Empty
          title="Customer not found"
          text="This customer may have been removed."
          action={
            <Link href="/app/customers">
              <Button>Back to customers</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const invs = (state.invoices || []).filter((i: any) => i.customer === c.company);
  const tickets = (state.tickets || []).filter((t: any) => t.customer === c.company);
  const notes = (state.notes || []).filter((n: any) => n.related === c.company);
  const interactions = c.interactions || [];

  const timeline = [
    ...interactions.map((i: any) => ({ t: i.date, text: i.text, k: i.kind })),
    ...invs.map((i: any) => ({
      t: i.issue,
      text: `Invoice ${i.number} issued for ${inr(invTotal(i))} — ${i.status}`,
      k: 'Invoice',
    })),
    ...tickets.map((t: any) => ({
      t: t.created,
      text: `Support ticket ${t.number}: ${t.subject}`,
      k: 'Support',
    })),
    ...notes.map((n: any) => ({
      t: n.date,
      text: `${n.author}: ${n.title}`,
      k: 'Note',
    })),
    {
      t: c.since || todayIso,
      text: `Became an active customer · owner: ${c.owner || 'Unassigned'}`,
      k: 'Milestone',
    },
  ].sort((a, b) => String(b.t).localeCompare(String(a.t)));

  const logInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txt.trim()) return;

    const newInteractions = [{ date: todayIso, text: `${kind}: ${txt}`, kind }, ...interactions];
    store.update('customers', c.id, { interactions: newInteractions, lastContact: todayIso });
    setTxt('');
    toast.success('Interaction logged');
  };

  return (
    <div>
      <button
        onClick={() => router.push('/app/customers')}
        className="flex items-center gap-1.5 text-sm text-[#778196] hover:text-slate-800 mb-4 transition-colors"
        data-testid="customer-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        All customers
      </button>

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 fade-up">
        <Avatar name={c.company} size={56} />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C2433]" data-testid="customer-detail-name">
            {c.company}
          </h1>
          <p className="text-sm text-[#778196]">
            {c.name} · Customer since {fmtDate(c.since)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="violet">{c.segment}</Badge>
          <Badge>{c.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat label="Lifetime value" value={inr(c.ltv)} />
        <Stat
          label="Invoices"
          value={invs.length.toString()}
          hint={`${invs.filter((i: any) => i.status !== 'Paid').length} unpaid`}
        />
        <Stat
          label="Open tickets"
          value={tickets.filter((t: any) => !['Resolved', 'Closed'].includes(t.status)).length.toString()}
          hint="support tickets"
        />
        <Stat label="Last contact" value={fmtDate(c.lastContact)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 space-y-3 h-fit">
          <h3 className="font-semibold text-[#1C2433]">Contact information</h3>
          {[
            [Mail, c.email || '—'],
            [Phone, c.phone || '—'],
            [MapPin, c.city || '—'],
          ].map(([Icon, v]: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{v}</span>
            </div>
          ))}

          <div className="pt-3 border-t border-[#E1E5ED] text-sm">
            <p className="text-xs text-[#778196]">Account owner</p>
            <div className="flex items-center gap-2 mt-1">
              <Avatar name={c.owner || '?'} size={24} />
              <span className="font-medium text-[#1C2433]">{c.owner || 'Unassigned'}</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <Tabs
            testid="customer-tabs"
            tabs={['Timeline', 'Invoices', 'Support history']}
            value={tab}
            onChange={setTab}
          />

          {tab === 'Timeline' && (
            <>
              <form onSubmit={logInteraction} className="flex flex-col sm:flex-row gap-2 mb-5">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                  className={`${inputCls} sm:w-32`}
                  data-testid="interaction-kind"
                >
                  {['Call', 'Email', 'Meeting', 'WhatsApp'].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
                <input
                  data-testid="interaction-input"
                  value={txt}
                  onChange={(e) => setTxt(e.target.value)}
                  placeholder="Log an interaction…"
                  className={inputCls}
                />
                <Button data-testid="interaction-submit">
                  <Plus className="w-4 h-4" />
                  Log
                </Button>
              </form>

              <ol className="relative border-l border-[#E1E5ED] ml-2 space-y-5" data-testid="customer-timeline">
                {timeline.map((t: any, i: number) => (
                  <li key={i} className="ml-5">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-brand mt-1.5" />
                    <p className="text-sm text-slate-700">{t.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.k} · {fmtDate(t.t)}
                    </p>
                  </li>
                ))}
              </ol>
            </>
          )}

          {tab === 'Invoices' && (
            <div className="space-y-3">
              {invs.length === 0 ? (
                <Empty title="No invoices for this customer" text="Create an invoice from the Invoices section." />
              ) : (
                invs.map((iv: any) => (
                  <div
                    key={iv.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="font-medium text-sm text-[#1C2433]">{iv.number}</p>
                      <p className="text-xs text-[#778196]">Issued {fmtDate(iv.issue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm tabular-nums text-[#1C2433]">{inr(invTotal(iv))}</p>
                      <Badge>{iv.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'Support history' && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <Empty title="No tickets filed" text="Support inquiries will be listed here." />
              ) : (
                tickets.map((tk: any) => (
                  <div
                    key={tk.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100"
                  >
                    <div>
                      <p className="font-medium text-sm text-[#1C2433]">{tk.subject}</p>
                      <p className="text-xs text-[#778196]">
                        {tk.number} · {tk.category}
                      </p>
                    </div>
                    <Badge>{tk.status}</Badge>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
