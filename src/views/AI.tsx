'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  PhoneOutgoing,
  Play,
  Plus,
  Trash2,
  Zap,
  ArrowDown,
  CheckCircle2,
  Loader2,
  Bot,
  Save,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { Card, CardHead, PageHeader, Badge, Stat, Button, Toggle, inputCls, cn, Field, Tabs, Empty } from '@/components/kit';
import { ChatPanel } from '@/components/ChatWidget';
import { dur } from './Telecalling';

const todayIso = new Date().toISOString().slice(0, 10);
const future2Days = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

export function AIAssistantView() {
  const { state } = useStore();
  const invoices = state.invoices || [];
  const leads = state.leads || [];
  const overdueCount = invoices.filter((i: any) => i.status === 'Overdue').length;
  const highValueLeads = leads.filter((l: any) => Number(l.value || 0) >= 100000 && !['Won', 'Lost'].includes(l.status));

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Ask questions about your business and let AI take action on real CRM records."
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[calc(100vh-240px)] min-h-[520px] flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E1E5ED]">
            <span className="w-9 h-9 rounded-lg bg-brand text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="font-semibold text-sm text-[#1C2433]">{state.bot?.name || 'Nexa'} Copilot</p>
              <p className="text-xs text-[#778196]">Live access to leads, customers, invoices and calls</p>
            </div>
          </div>
          <ChatPanel
            mode="team"
            testid="assistant"
            className="flex-1"
            greeting="Good day! I have access to your live CRM database. I can summarise customers, report on leads, calculate revenue, book meetings and create follow-up tasks. What would you like to know?"
            chips={[
              'How many open leads do we have?',
              'Which invoices are overdue?',
              'What tasks are pending?',
              'Book a demo',
            ]}
          />
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-sm mb-3 text-[#1C2433]">AI insights today</h3>
            <div className="divide-y divide-slate-100">
              <div className="flex gap-3 py-2.5 first:pt-0">
                <Zap className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1C2433]">
                    {highValueLeads.length} high-value lead(s) active
                  </p>
                  <p className="text-xs text-[#778196]">Assign priority follow-ups in Leads</p>
                </div>
              </div>
              <div className="flex gap-3 py-2.5">
                <Zap className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1C2433]">Overdue invoice tracking</p>
                  <p className="text-xs text-[#778196]">
                    {overdueCount} invoice(s) currently overdue
                  </p>
                </div>
              </div>
              <div className="flex gap-3 py-2.5 last:pb-0">
                <Zap className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#1C2433]">Pipeline SLA</p>
                  <p className="text-xs text-[#778196]">Auto-assignment active for incoming leads</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-sm mb-3 text-[#1C2433]">What it can do</h3>
            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
              <li>Query real database records directly</li>
              <li>Report open leads and deal pipelines</li>
              <li>Calculate revenue and track overdue invoices</li>
              <li>Schedule meetings on the team calendar</li>
              <li>Create follow-up tasks for employees</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AIChatbotView() {
  const store = useStore();
  const { state } = store;
  const [cfg, setCfg] = useState(
    state.bot || {
      name: 'Nexa',
      greeting: 'Namaste! I am Nexa, your AI assistant. How can I help you today?',
      qualify: true,
      booking: true,
      handoff: true,
    }
  );
  const [k, setK] = useState(0);

  const transcripts = [
    ['Website visitor', 'Asked about pricing → qualified → demo booked', 'Qualified'],
    ['Product inquiry', 'WhatsApp integration question → answered', 'Answered'],
    ['Demo request', 'Requested callback → task created for team', 'Task created'],
  ];

  return (
    <div>
      <PageHeader
        title="AI Chatbot"
        subtitle="A customer-facing assistant for your website and WhatsApp."
      />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 space-y-4 h-fit">
          <h3 className="font-semibold text-sm text-[#1C2433]">Bot configuration</h3>
          <Field
            f={{ key: 'botname', label: 'Bot name' }}
            value={cfg.name}
            onChange={(v: string) => setCfg({ ...cfg, name: v })}
          />
          <Field
            f={{ key: 'greeting', label: 'Greeting message', type: 'textarea' }}
            value={cfg.greeting}
            onChange={(v: string) => setCfg({ ...cfg, greeting: v })}
          />
          {[
            ['qualify', 'Lead qualification', 'Capture name, email and phone'],
            ['booking', 'Appointment booking', 'Book demos on the team calendar'],
            ['handoff', 'Human handoff', 'Escalate to an agent on request'],
          ].map(([key, t, d]: any) => (
            <div key={key} className="flex items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-sm font-medium text-[#1C2433]">{t}</p>
                <p className="text-xs text-[#778196]">{d}</p>
              </div>
              <Toggle
                testid={`bot-${key}`}
                checked={cfg[key]}
                onChange={(v: boolean) => setCfg({ ...cfg, [key]: v })}
              />
            </div>
          ))}
          <Button
            className="w-full mt-2"
            data-testid="bot-save-btn"
            onClick={() => {
              store.set('bot', cfg);
              setK((x) => x + 1);
              toast.success('Chatbot settings saved');
            }}
          >
            <Save className="w-4 h-4" />
            Save & publish
          </Button>
        </Card>

        <Card className="h-[560px] flex flex-col overflow-hidden" data-testid="chatbot-preview">
          <div
            className="flex items-center gap-3 px-4 py-3.5 text-white"
            style={{ background: 'var(--brand)' }}
          >
            <Bot className="w-5 h-5" />
            <div>
              <p className="text-sm font-semibold">{cfg.name}</p>
              <p className="text-[11px] opacity-80">Website visitor preview</p>
            </div>
          </div>
          <ChatPanel
            key={k}
            mode="customer"
            testid="customer-bot"
            className="flex-1"
            greeting={cfg.greeting}
            chips={['What are your plans?', 'Book a demo', 'Do you integrate with WhatsApp?']}
          />
        </Card>

        <Card>
          <CardHead title="Recent conversations" sub="Simulated visitor preview" />
          <div className="px-5 pb-5 space-y-4">
            {transcripts.map(([n, s, r]) => (
              <div key={n} className="flex gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                  {n[0]}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1C2433]">{n}</p>
                  <p className="text-xs text-[#778196]">{s}</p>
                  <Badge tone="brand" className="mt-1">
                    {r}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const SCRIPT = (l: any) => [
  ['AI', `Namaste ${l.name.split(' ')[0]}, this is Nexa from the sales team. Is this a good time?`],
  ['Contact', 'Yes, go ahead.'],
  ['AI', `You enquired about a CRM for ${l.company}. How many people are on your team?`],
  ['Contact', 'We have about 15 users.'],
  ['AI', `Great. Our Pro plan includes AI telecalling and workflows at ₹1,299 per user. Would a demo this Thursday help?`],
  ['Contact', 'Yes, Thursday afternoon works well.'],
  ['AI', 'Perfect — I have booked Thursday 3 PM on the calendar. Thank you!'],
];

export function AICallingView() {
  const store = useStore();
  const { state } = store;
  const queue = (state.leads || []).filter((l: any) => ['New', 'Contacted'].includes(l.status)).slice(0, 8);

  const [active, setActive] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [sec, setSec] = useState(0);
  const [log, setLog] = useState<any[]>([]);
  const tRef = useRef<any[]>([]);

  useEffect(() => () => tRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const start = (l: any) => {
    setActive(l);
    setLines([]);
    setSec(0);
    const sc = SCRIPT(l);

    sc.forEach((line, i) => {
      tRef.current.push(
        setTimeout(() => {
          setLines((x) => [...x, line]);
        }, 800 * (i + 1))
      );
    });

    tRef.current.push(
      setTimeout(() => {
        setActive(null);
        setLog((x) => [{ n: l.name, c: l.company, r: 'Demo booked', d: 85 }, ...x]);
        store.add('events', {
          title: `AI-booked demo · ${l.company}`,
          date: future2Days,
          time: '15:00',
          duration: 45,
          type: 'Demo',
          withPerson: l.owner || state.session?.name || 'Aisha Khan',
        });
        store.update('leads', l.id, { status: 'Qualified' });
        store.add('calls', {
          contact: l.name,
          company: l.company,
          phone: l.phone,
          agent: 'AI Voice Agent (Nexa)',
          direction: 'Outbound',
          disposition: 'Interested',
          duration: 85,
          date: todayIso,
          followUp: future2Days,
          notes: 'Autonomous AI call: qualified lead and scheduled product demo.',
        });
        toast.success('AI call completed', { description: `${l.name} qualified · demo booked` });
      }, 800 * (sc.length + 1.5))
    );
  };

  return (
    <div>
      <PageHeader
        title="AI Calling"
        subtitle="Autonomous voice agents that qualify leads and book meetings."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat label="AI calls today" value={log.length.toString()} icon={PhoneOutgoing} />
        <Stat label="Connect rate" value={log.length ? '100%' : '0%'} />
        <Stat label="Meetings booked" value={log.filter((l) => l.r === 'Demo booked').length.toString()} />
        <Stat label="Avg. call length" value={log.length ? '1:25' : '0:00'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card data-testid="ai-call-queue">
          <CardHead title="Call queue" sub="Leads awaiting initial qualification" />
          <div className="px-3 pb-3">
            {queue.length === 0 ? (
              <div className="p-6">
                <Empty title="Queue empty" text="Add new leads to populate the AI call queue." />
              </div>
            ) : (
              queue.map((l: any) => (
                <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                  <span className="w-8 h-8 rounded-full bg-brand-soft text-brand font-semibold text-xs flex items-center justify-center shrink-0">
                    {l.name[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-[#1C2433]">{l.name}</p>
                    <p className="text-xs text-[#778196] truncate">{l.company}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={!!active}
                    onClick={() => start(l)}
                    data-testid={`ai-call-${l.id}`}
                  >
                    <Play className="w-3 h-3" />
                    Call
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-[420px]" data-testid="ai-call-live">
          <CardHead
            title={active ? `Live: ${active.name}` : 'Live call monitor'}
            sub={
              active
                ? `${active.company} · ${active.phone || 'Simulated call'}`
                : 'Trigger a call from the queue to monitor live speech interaction'
            }
            right={
              active && (
                <span className="flex items-center gap-2 text-sm text-emerald-600 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-ring" />
                  {dur(sec)}
                </span>
              )
            }
          />
          <div className="flex-1 px-5 pb-5 space-y-3 overflow-y-auto max-h-[300px]">
            {!active && !lines.length && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
                <PhoneOutgoing className="w-8 h-8 mb-3" />
                <p className="text-sm">No active call in progress</p>
              </div>
            )}
            {lines.map(([who, t]: any, i: number) => (
              <div key={i} className={cn('flex fade-up', who === 'Contact' && 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                    who === 'AI' ? 'bg-brand-soft text-[#1C2433]' : 'bg-slate-100 text-slate-800'
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
                    {who === 'AI' ? 'AI Voice Agent' : 'Contact'}
                  </p>
                  {t}
                </div>
              </div>
            ))}
            {active && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Transcribing audio stream…
              </p>
            )}
          </div>
          <div className="border-t border-[#E1E5ED] px-5 py-3">
            <p className="text-xs font-semibold text-[#778196] uppercase tracking-wider mb-2">
              Recent AI calls
            </p>
            {log.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No completed calls this session.</p>
            ) : (
              log.slice(0, 4).map((x, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5">
                  <span className="font-medium text-[#1C2433]">
                    {x.n} · <span className="text-[#778196] font-normal">{x.c}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{dur(x.d)}</span>
                    <Badge tone="success">{x.r}</Badge>
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

const TRIGGERS = [
  'New lead received',
  'Lead stage changed',
  'Lead score changed',
  'Invoice overdue',
  'Ticket created',
  'Meeting booked',
];

const ACTIONS = [
  'Assign employee (round-robin)',
  'Send notification',
  'Schedule follow-up (+1 day)',
  'AI calling simulation',
  'Send email reminder',
  'Send WhatsApp message',
  'Create task for finance',
  'Notify sales manager',
  'Change priority to High',
  'Create reminder',
];

export function AutomationView() {
  const store = useStore();
  const { state } = store;
  const workflows = state.workflows || [];
  const [selId, setSelId] = useState(workflows[0]?.id || 'w0');
  const wf = workflows.find((w: any) => w.id === selId) || workflows[0];
  const [draft, setDraft] = useState<any>(wf);
  const [running, setRunning] = useState(-1);
  const [tab, setTab] = useState('Builder');

  useEffect(() => {
    const found = workflows.find((w: any) => w.id === selId);
    if (found) setDraft(found);
  }, [selId, workflows]);

  const save = () => {
    store.update('workflows', draft.id, draft);
    toast.success('Workflow saved');
  };

  const create = () => {
    const w = store.add('workflows', {
      name: 'Untitled workflow',
      trigger: TRIGGERS[0],
      conditions: [{ field: 'Source', op: 'is', value: 'Website' }],
      actions: ['Send notification'],
      active: false,
      runs: 0,
      lastRun: new Date().toISOString(),
    });
    setSelId(w.id);
    setDraft(w);
  };

  const test = () => {
    const steps = (draft?.actions || []).length + 1;
    setRunning(0);
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => setRunning(i), 800 * i);
    }

    setTimeout(() => {
      setRunning(-1);
      const lead = (state.leads || [])[0] || { name: 'Demo Lead' };
      store.add('runs', {
        workflow: draft.name,
        status: 'Success',
        time: new Date().toISOString(),
        detail: `Workflow evaluated: ${draft.actions.length} actions executed`,
      });
      store.update('workflows', draft.id, {
        runs: (draft.runs || 0) + 1,
        lastRun: new Date().toISOString(),
      });
      if (draft.actions.some((a: string) => a.includes('notification'))) {
        store.notify('Workflow executed', `${draft.name} processed successfully`, 'automation');
      }
      toast.success('Workflow executed successfully');
    }, 800 * (steps + 1));
  };

  if (!draft) return null;

  return (
    <div>
      <PageHeader
        title="Automation"
        subtitle="Build automated workflows with triggers, conditions and actions."
        actions={
          <Button onClick={create} data-testid="workflow-create-btn">
            <Plus className="w-4 h-4" />
            New workflow
          </Button>
        }
      />

      <Tabs
        testid="automation-tabs"
        tabs={['Builder', 'Execution History']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Builder' ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="h-fit" data-testid="workflow-list">
            <CardHead
              title="Workflows"
              sub={`${workflows.filter((w: any) => w.active).length} active`}
            />
            <div className="p-3 space-y-1">
              {workflows.map((w: any) => (
                <button
                  key={w.id}
                  onClick={() => setSelId(w.id)}
                  data-testid={`wf-${w.id}`}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors',
                    selId === w.id ? 'bg-brand-soft text-[#1C2433] font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{w.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{w.trigger}</p>
                  </div>
                  <Badge tone={w.active ? 'success' : 'neutral'}>{w.active ? 'Active' : 'Draft'}</Badge>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2 p-6 space-y-6" data-testid="workflow-builder">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E1E5ED]">
              <div className="flex-1 min-w-[200px]">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="text-lg font-semibold outline-none w-full border-b border-transparent focus:border-brand text-[#1C2433]"
                  data-testid="workflow-name-input"
                />
                <p className="text-xs text-slate-400 mt-1">Runs: {draft.runs || 0}</p>
              </div>
              <div className="flex items-center gap-3">
                <Toggle
                  testid="workflow-active-toggle"
                  checked={draft.active}
                  onChange={(v: boolean) => setDraft({ ...draft, active: v })}
                />
                <Button size="sm" variant="secondary" onClick={test} data-testid="workflow-test-btn">
                  Test run
                </Button>
                <Button size="sm" onClick={save} data-testid="workflow-save-btn">
                  Save
                </Button>
              </div>
            </div>

            {/* Trigger */}
            <div className="rounded-xl border border-[#E1E5ED] p-4 bg-white shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
                1. Trigger
              </span>
              <select
                className={inputCls}
                value={draft.trigger}
                onChange={(e) => setDraft({ ...draft, trigger: e.target.value })}
              >
                {TRIGGERS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center text-slate-300">
              <ArrowDown className="w-5 h-5" />
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-[#E1E5ED] p-4 bg-white shadow-sm space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  2. Actions ({draft.actions.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, actions: [...draft.actions, ACTIONS[0]] })}
                  className="text-xs text-brand font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add action
                </button>
              </div>

              {draft.actions.map((act: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className={inputCls}
                    value={act}
                    onChange={(e) => {
                      const updated = [...draft.actions];
                      updated[i] = e.target.value;
                      setDraft({ ...draft, actions: updated });
                    }}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a}>{a}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, actions: draft.actions.filter((_: any, j: number) => j !== i) })
                    }
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card data-testid="workflow-history">
          <CardHead title="Workflow execution history" sub="Recent automated triggers" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#778196] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Workflow</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {(state.runs || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No automated runs recorded yet. Use "Test run" above to execute.
                    </td>
                  </tr>
                ) : (
                  (state.runs || []).map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 font-semibold text-[#1C2433]">{r.workflow}</td>
                      <td className="px-5 py-3">
                        <Badge tone={r.status === 'Success' ? 'success' : 'danger'}>{r.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-[#778196]">{new Date(r.time).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3 text-slate-600">{r.detail}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
