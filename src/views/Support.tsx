'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  LifeBuoy,
  Clock,
  Smile,
  CheckCircle2,
  BookOpen,
  Eye,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import {
  Card,
  PageHeader,
  CrudTable,
  Badge,
  Stat,
  Avatar,
  Button,
  Modal,
  Tabs,
  SearchInput,
  fmtDate,
  inputCls,
  Empty,
} from '@/components/kit';

const DEFAULT_KB = [
  {
    id: 'kb-1',
    title: 'Connecting Meta Lead Ads to AetherX',
    category: 'Integrations',
    views: 1420,
    updated: new Date(Date.now() - 864e5 * 3).toISOString().slice(0, 10),
  },
  {
    id: 'kb-2',
    title: 'Configuring GST on Invoices & Payment Gateway',
    category: 'Billing',
    views: 980,
    updated: new Date(Date.now() - 864e5 * 7).toISOString().slice(0, 10),
  },
  {
    id: 'kb-3',
    title: 'Setting up Automated Lead Assignment Rules',
    category: 'Automation',
    views: 2150,
    updated: new Date(Date.now() - 864e5 * 12).toISOString().slice(0, 10),
  },
  {
    id: 'kb-4',
    title: 'White-Label Branding & Custom Domain Guide',
    category: 'Administration',
    views: 890,
    updated: new Date(Date.now() - 864e5 * 20).toISOString().slice(0, 10),
  },
];

export default function SupportView() {
  const store = useStore();
  const { state } = store;
  const [tab, setTab] = useState('Tickets');
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [kq, setKq] = useState('');
  const [art, setArt] = useState<any | null>(null);

  const customersList = state.customers || [];
  const [cust, setCust] = useState(customersList[0]?.company || 'Acme Corp');

  const tickets = state.tickets || [];
  const openCount = tickets.filter((x: any) => ['Open', 'In Progress'].includes(x.status)).length;
  const resolvedCount = tickets.filter((x: any) => x.status === 'Resolved').length;

  const activeTicket = open ? tickets.find((x: any) => x.id === open) : null;
  const kbArticles = state.kb || DEFAULT_KB;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Services"
        subtitle="Resolve customer issues fast with tickets, knowledge base and service histories."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat label="Open tickets" value={openCount} icon={LifeBuoy} />
        <Stat label="Avg. first response" value="18 min" icon={Clock} delta="-12%" />
        <Stat label="CSAT Rating" value="4.7 / 5" icon={Smile} />
        <Stat label="Resolved this month" value={resolvedCount} icon={CheckCircle2} />
      </div>

      <Tabs
        testid="support-tabs"
        tabs={['Tickets', 'Knowledge Base', 'Customer History']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Tickets' && (
        <CrudTable
          testid="tickets"
          collection="tickets"
          entity="Ticket"
          addLabel="New ticket"
          fields={FIELDS.tickets ? FIELDS.tickets(state) : []}
          defaults={{
            status: 'Open',
            priority: 'Medium',
            category: 'Technical',
            created: new Date().toISOString().slice(0, 10),
            number: `TK-${1050 + tickets.length}`,
          }}
          searchKeys={['subject', 'number', 'customer', 'agent']}
          onRowClick={(x: any) => setOpen(x.id)}
          filters={[
            {
              key: 'status',
              label: 'statuses',
              options: ['Open', 'In Progress', 'Resolved', 'Closed'],
            },
            {
              key: 'priority',
              label: 'priorities',
              options: ['Urgent', 'High', 'Medium', 'Low'],
            },
          ]}
          columns={[
            {
              key: 'number',
              label: 'Ticket',
              render: (x: any) => (
                <div>
                  <p className="font-medium text-[#111827]">{x.subject}</p>
                  <p className="text-xs text-slate-500">
                    {x.number} · {x.category || 'General'}
                  </p>
                </div>
              ),
            },
            { key: 'customer', label: 'Customer' },
            {
              key: 'priority',
              label: 'Priority',
              render: (x: any) => <Badge>{x.priority}</Badge>,
            },
            {
              key: 'status',
              label: 'Status',
              render: (x: any) => <Badge>{x.status}</Badge>,
            },
            {
              key: 'agent',
              label: 'Agent',
              render: (x: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={x.agent || 'Support'} size={24} />
                  <span>{x.agent || 'Unassigned'}</span>
                </span>
              ),
            },
            {
              key: 'created',
              label: 'Created',
              render: (x: any) => fmtDate(x.created),
            },
          ]}
        />
      )}

      {tab === 'Knowledge Base' && (
        <div className="space-y-4">
          <SearchInput
            value={kq}
            onChange={setKq}
            placeholder="Search help articles…"
            testid="kb-search"
            className="max-w-md"
          />
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kbArticles
              .filter((k: any) => (k.title || '').toLowerCase().includes(kq.toLowerCase()))
              .map((k: any) => (
                <Card
                  key={k.id}
                  className="p-5 hover:border-slate-300 transition-colors cursor-pointer"
                  onClick={() => setArt(k)}
                  data-testid={`kb-${k.id}`}
                >
                  <BookOpen className="w-5 h-5 text-brand mb-3" />
                  <p className="font-medium text-sm text-[#111827]">{k.title}</p>
                  <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
                    <Badge tone="neutral">{k.category}</Badge>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {(k.views || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {tab === 'Customer History' && (
        <Card className="p-5" data-testid="support-history">
          <label className="block max-w-xs mb-4">
            <span className="text-xs text-slate-500 block mb-1">Select Customer Account</span>
            <select
              data-testid="support-history-customer"
              className={inputCls}
              value={cust}
              onChange={(e) => setCust(e.target.value)}
            >
              {customersList.length === 0 ? (
                <option value="">No customers registered</option>
              ) : (
                customersList.map((c: any) => (
                  <option key={c.id} value={c.company}>
                    {c.company} ({c.name})
                  </option>
                ))
              )}
            </select>
          </label>

          {tickets.filter((x: any) => x.customer === cust).length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium text-slate-700">No open issues for {cust || 'this customer'}</p>
              <p className="text-xs text-slate-400 mt-1">This account has zero pending support tickets.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets
                .filter((x: any) => x.customer === cust)
                .map((x: any) => (
                  <div
                    key={x.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm cursor-pointer hover:bg-slate-50/50 px-2 rounded-lg"
                    onClick={() => setOpen(x.id)}
                  >
                    <div>
                      <p className="font-medium text-[#111827]">
                        {x.number} · {x.subject}
                      </p>
                      <p className="text-xs text-slate-500">
                        {fmtDate(x.created)} · Agent: {x.agent || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge>{x.priority}</Badge>
                      <Badge>{x.status}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Ticket Conversation Modal */}
      <Modal
        open={!!activeTicket}
        onClose={() => setOpen(null)}
        title={activeTicket ? `${activeTicket.number} · ${activeTicket.subject}` : ''}
        description={activeTicket ? `${activeTicket.customer} · Category: ${activeTicket.category || 'Support'}` : ''}
        wide
        testid="ticket-modal"
      >
        {activeTicket && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs text-slate-500 font-medium">
                Status
                <select
                  data-testid="ticket-status-select"
                  className={`${inputCls} mt-1`}
                  value={activeTicket.status}
                  onChange={(e) => {
                    store.update('tickets', activeTicket.id, { status: e.target.value });
                    toast.success(`Ticket status: ${e.target.value}`);
                  }}
                >
                  {['Open', 'In Progress', 'Resolved', 'Closed'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-500 font-medium">
                Priority
                <select
                  className={`${inputCls} mt-1`}
                  value={activeTicket.priority}
                  onChange={(e) => {
                    store.update('tickets', activeTicket.id, { priority: e.target.value });
                    toast.success(`Priority set to ${e.target.value}`);
                  }}
                >
                  {['Urgent', 'High', 'Medium', 'Low'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-slate-500 font-medium col-span-2 sm:col-span-1">
                Assigned Agent
                <select
                  className={`${inputCls} mt-1`}
                  value={activeTicket.agent}
                  onChange={(e) => {
                    store.update('tickets', activeTicket.id, { agent: e.target.value });
                    toast.success(`Assigned to ${e.target.value}`);
                  }}
                >
                  <option value="">Unassigned</option>
                  {(state.employees || []).map((e: any) => (
                    <option key={e.id} value={e.name}>
                      {e.name} ({e.dept || 'Support'})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {[
                {
                  a: activeTicket.customer,
                  m: `Hi support team, enquiry regarding "${activeTicket.subject}". Please assist as soon as possible.`,
                  t: activeTicket.created,
                },
                {
                  a: activeTicket.agent || 'Support Desk',
                  m: 'Thanks for reaching out! We are reviewing the logs and will follow up with an update.',
                  t: activeTicket.created,
                },
                ...(activeTicket.replies || []),
              ].map((r: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <Avatar name={r.a || 'User'} size={32} />
                  <div className="flex-1 rounded-xl bg-slate-50 p-3 text-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs font-semibold text-[#111827]">{r.a}</p>
                      {r.t && <span className="text-[11px] text-slate-400">{fmtDate(r.t)}</span>}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{r.m}</p>
                  </div>
                </div>
              ))}
            </div>

            <form
              className="flex gap-2 pt-2 border-t border-slate-100"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                store.update('tickets', activeTicket.id, {
                  replies: [
                    ...(activeTicket.replies || []),
                    {
                      a: activeTicket.agent || 'Aisha Khan',
                      m: reply,
                      t: new Date().toISOString().slice(0, 10),
                    },
                  ],
                  status: activeTicket.status === 'Open' ? 'In Progress' : activeTicket.status,
                });
                setReply('');
                toast.success('Reply added to ticket');
              }}
            >
              <input
                data-testid="ticket-reply-input"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write an internal or customer reply…"
                className={inputCls}
              />
              <Button data-testid="ticket-reply-btn">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        )}
      </Modal>

      {/* KB Article Modal */}
      <Modal
        open={!!art}
        onClose={() => setArt(null)}
        title={art?.title}
        description={art ? `${art.category} · Updated ${fmtDate(art.updated)}` : ''}
        testid="kb-article-modal"
      >
        <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
          <p>
            This setup guide walks you through configuring the feature in under five minutes.
            Open the relevant module from the left sidebar navigation, then follow the verified steps below:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 font-medium text-slate-700">
            <li>Open the module and click the primary action button (+ Add / Connect).</li>
            <li>Fill in the required fields and choose the appropriate team member assignment.</li>
            <li>Save — changes are synchronized immediately across your organization’s database.</li>
          </ol>
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
            Need further help? Open a support ticket above and our team will respond within 15 minutes.
          </p>
        </div>
      </Modal>
    </div>
  );
}
