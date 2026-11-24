'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Phone, PhoneOff, PhoneCall, Clock, Mic, MicOff, Pause, Users, CheckCircle2, Play, Volume2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS, TECHNICAL_RESULTS, SALES_DISPOSITIONS } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Stat,
  Avatar,
  Button,
  Modal,
  CHART,
  inputCls,
  cn,
  Tabs,
  Empty,
  fmtDate,
} from '@/components/kit';

export const dur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const todayIso = new Date().toISOString().slice(0, 10);
const future2Days = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

function Dialer() {
  const store = useStore();
  const { state } = store;
  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  // Callers can only dial their own assigned leads; Admins can dial all
  const rawLeads = state.leads || [];
  const leads = isCaller
    ? rawLeads.filter((l: any) => l.owner === currentUser || !l.owner)
    : rawLeads;

  const [sel, setSel] = useState<string>(leads[0]?.id || '');
  const [live, setLive] = useState(false);
  const [sec, setSec] = useState(0);
  const [mute, setMute] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [techResult, setTechResult] = useState<string>('Answered/Connected');
  const [salesDisp, setSalesDisp] = useState<string>('Interested');
  const [fu, setFu] = useState(future2Days);
  const [notes, setNotes] = useState('');

  const lead = leads.find((l: any) => l.id === sel) || leads[0];
  const isDNC = lead?.dnc || lead?.status === 'Do Not Call';

  useEffect(() => {
    if (!sel && leads[0]?.id) {
      setSel(leads[0].id);
    }
  }, [leads, sel]);

  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  const save = () => {
    if (!lead) return;
    store.add('calls', {
      contact: lead.name,
      company: lead.company,
      phone: lead.phone,
      agent: currentUser || 'Agent',
      direction: 'Outbound',
      technicalResult: techResult,
      disposition: salesDisp,
      duration: Math.max(sec, 1),
      date: todayIso,
      followUp: ['Interested', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? fu : '',
      recordingUrl: '',
      notes,
    });

    if (['Interested', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp)) {
      store.add('reminders', {
        title: `Follow-up call with ${lead.name} (${lead.company})`,
        type: 'Follow-up',
        due: fu,
        time: '11:00',
        owner: lead.owner || currentUser,
        done: false,
        auto: true,
      });
    }

    // Lead stage update per Rulebook Section 2.5
    let newStatus = lead.status;
    let newDnc = lead.dnc || false;
    if (salesDisp === 'Do Not Call') {
      newStatus = 'Do Not Call';
      newDnc = true;
    } else if (salesDisp === 'Converted') {
      newStatus = 'Converted';
    } else if (['Interested', 'Follow-up Scheduled'].includes(salesDisp)) {
      newStatus = salesDisp;
    } else if (salesDisp === 'Call Back Required') {
      newStatus = 'Follow-up Scheduled';
    } else if (salesDisp === 'Not Interested') {
      newStatus = 'Not Interested';
    } else if (['No Answer', 'Busy'].includes(techResult) && lead.status === 'New') {
      newStatus = 'Attempted';
    } else if (techResult === 'Answered/Connected' && ['New', 'Assigned', 'Attempted'].includes(lead.status)) {
      newStatus = 'Contacted';
    }

    store.update('leads', lead.id, {
      status: newStatus,
      dnc: newDnc,
      lastCalled: todayIso,
    });

    store.log(currentUser || 'You', 'logged a call with', `${lead.company} (${salesDisp})`, 'call');
    toast.success('Call logged', {
      description: `${techResult} · ${salesDisp}${['Interested', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? ' · follow-up scheduled' : ''}`,
    });

    setWrap(false);
    setSec(0);
    setNotes('');
  };

  if (!lead) {
    return (
      <Card className="p-5" data-testid="dialer">
        <h3 className="font-semibold text-[15px] mb-4 text-[#111827]">Click-to-call</h3>
        <Empty
          title="No contacts available"
          text="Add leads to your pipeline to initiate calls from the dialer."
        />
      </Card>
    );
  }

  return (
    <Card className="p-5" data-testid="dialer">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[15px] text-[#111827]">Click-to-call</h3>
        {isDNC && (
          <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
            DNC Restricted
          </span>
        )}
      </div>

      <select
        data-testid="dialer-contact-select"
        disabled={live}
        className={inputCls}
        value={sel}
        onChange={(e) => setSel(e.target.value)}
      >
        {leads.slice(0, 30).map((l: any) => (
          <option key={l.id} value={l.id}>
            {l.name} · {l.company} {l.dnc ? '(DNC)' : ''}
          </option>
        ))}
      </select>

      <div className="mt-5 rounded-xl bg-[#111827] text-white p-5 text-center grain relative overflow-hidden">
        <Avatar name={lead.name} size={56} />
        <p className="mt-3 font-semibold text-lg">{lead.name}</p>
        <p className="text-xs text-slate-400">
          {lead.company} · {lead.phone || 'No phone number'}
        </p>

        {isDNC ? (
          <div className="mt-4 p-2.5 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
            ⚠️ DO NOT CALL: This lead has opted out of outbound communications.
          </div>
        ) : (
          <p
            className={cn(
              'mt-3 text-2xl font-mono tabular-nums font-bold tracking-wider',
              live ? 'text-emerald-400' : 'text-slate-500'
            )}
            data-testid="dialer-timer"
          >
            {live ? dur(sec) : 'Ready'}
          </p>
        )}

        <div className="flex justify-center gap-3 mt-4">
          {live ? (
            <>
              <button
                type="button"
                onClick={() => setMute(!mute)}
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title={mute ? 'Unmute' : 'Mute'}
              >
                {mute ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                title="Hold"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid="dialer-end-btn"
                onClick={() => {
                  setLive(false);
                  setWrap(true);
                }}
                className="w-11 h-11 rounded-full bg-[#EF4444] flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                title="End Call"
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isDNC}
              data-testid="dialer-call-btn"
              onClick={() => {
                if (isDNC) return;
                setSec(0);
                setLive(true);
                toast(`Calling ${lead.name}…`, { description: 'Outbound session initiated' });
              }}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg',
                isDNC
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-[#10B981] pulse-ring hover:bg-emerald-600'
              )}
              title={isDNC ? 'Do Not Call active' : 'Call'}
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <Modal
        open={wrap}
        onClose={() => setWrap(false)}
        title="Call disposition & outcome"
        description={`Call with ${lead.name} · ${dur(sec)} duration`}
        testid="disposition-modal"
      >
        <div className="space-y-4">
          {/* Section 1: Technical Call Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Technical Call Result (Provider)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TECHNICAL_RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTechResult(r)}
                  className={cn(
                    'h-9 px-2 rounded-lg border text-xs font-medium transition-colors truncate',
                    techResult === r
                      ? 'border-brand bg-brand-soft text-[#111827] ring-1 ring-brand font-semibold'
                      : 'border-[#E5E7EB] hover:bg-slate-50 text-slate-700'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Sales Disposition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Sales Disposition (Caller Outcome)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {SALES_DISPOSITIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`disp-${d.toLowerCase().replace(/[\s/]/g, '-')}`}
                  onClick={() => setSalesDisp(d)}
                  className={cn(
                    'h-9 px-2 rounded-lg border text-xs font-medium transition-colors truncate',
                    salesDisp === d
                      ? 'border-brand bg-brand-soft text-[#111827] ring-1 ring-brand font-semibold'
                      : 'border-[#E5E7EB] hover:bg-slate-50 text-slate-700',
                    d === 'Do Not Call' && salesDisp === d && 'border-red-500 bg-red-50 text-red-900 ring-red-500'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {['Interested', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) && (
            <label className="block pt-1">
              <span className="text-xs font-medium text-slate-700">Schedule follow-up date</span>
              <input
                type="date"
                className={`${inputCls} mt-1`}
                value={fu}
                onChange={(e) => setFu(e.target.value)}
                data-testid="followup-date"
              />
            </label>
          )}

          {salesDisp === 'Do Not Call' && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              Note: Marking as Do Not Call will suppress all future outbound calls and mark this lead as DNC in the database.
            </div>
          )}

          <textarea
            className={`${inputCls} h-20 py-2`}
            placeholder="Call notes & key conversation takeaways…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="call-notes"
          />

          <Button onClick={save} data-testid="save-call-btn" className="w-full">
            Save call log
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

export function TelecallingView() {
  const { state } = useStore();
  const [tab, setTab] = useState('Call Logs');
  const [fuFilter, setFuFilter] = useState<'All' | 'Overdue' | 'Today' | 'Upcoming'>('All');

  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  // Caller rule: view only own call history
  const allCalls = state.calls || [];
  const calls = isCaller
    ? allCalls.filter((c: any) => c.agent === currentUser)
    : allCalls;

  const rawLeads = state.leads || [];
  const leads = isCaller
    ? rawLeads.filter((l: any) => l.owner === currentUser || !l.owner)
    : rawLeads;

  const callsToday = calls.filter((c: any) => c.date === todayIso).length;
  const avgDurationSec =
    calls.length > 0 ? Math.round(calls.reduce((a: number, c: any) => a + Number(c.duration || 0), 0) / calls.length) : 0;
  const connectedCalls = calls.filter((c: any) =>
    c.technicalResult === 'Answered/Connected' || (!c.technicalResult && c.disposition !== 'No Answer')
  ).length;
  const connectRate = calls.length > 0 ? `${Math.round((connectedCalls / calls.length) * 100)}%` : '0%';
  const positiveOutcomes = calls.filter((c: any) =>
    ['Converted', 'Interested', 'Call Back Required', 'Follow-up Scheduled'].includes(c.disposition)
  ).length;

  const agents = [...new Set(calls.map((c: any) => c.agent).filter(Boolean))].map((a: any) => {
    const cs = calls.filter((c: any) => c.agent === a);
    return {
      name: String(a).split(' ')[0],
      full: a,
      calls: cs.length,
      talk: Math.round(cs.reduce((x: number, c: any) => x + Number(c.duration || 0), 0) / 60),
      conv: cs.filter((c: any) => ['Converted', 'Interested'].includes(c.disposition)).length,
    };
  });

  // Filtered follow-up calls
  const allFollowUps = calls.filter((c: any) => Boolean(c.followUp));
  const followUps = allFollowUps.filter((c: any) => {
    if (fuFilter === 'Overdue') return c.followUp < todayIso;
    if (fuFilter === 'Today') return c.followUp === todayIso;
    if (fuFilter === 'Upcoming') return c.followUp > todayIso;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Telecalling"
        subtitle="Manage outbound campaigns, call logs and agent performance."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat label="Calls today" value={callsToday.toString()} icon={PhoneCall} />
        <Stat label="Avg. duration" value={dur(avgDurationSec)} icon={Clock} />
        <Stat label="Connect rate" value={connectRate} icon={Users} />
        <Stat
          label="Positive outcomes"
          value={positiveOutcomes.toString()}
          icon={CheckCircle2}
          hint="interested + converted"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Dialer />

        <Card className="lg:col-span-2" data-testid="agent-performance">
          <CardHead title="Agent performance" sub="Calls handled and talk time (min)" />
          {agents.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Empty
                title="No calls logged yet"
                text="Use the click-to-call dialer to log outbound calls."
              />
            </div>
          ) : (
            <>
              <div className="h-64 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agents}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="name" tick={CHART.axis} axisLine={false} tickLine={false} />
                    <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART.tooltip} />
                    <Bar dataKey="calls" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Calls" />
                    <Bar dataKey="talk" fill="var(--brand2)" radius={[4, 4, 0, 0]} name="Talk time (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 pt-2 border-t border-slate-100">
                {agents.slice(0, 4).map((a) => (
                  <div key={a.full} className="flex items-center gap-2">
                    <Avatar name={a.full} size={28} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-[#111827]">{a.full}</p>
                      <p className="text-[11px] text-slate-500">{a.conv} positive</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Tabs
        testid="tele-tabs"
        tabs={['Call Logs', 'Follow-ups', 'Contacts']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Call Logs' && (
        <CrudTable
          testid="calls"
          collection="calls"
          entity="Call log"
          rows={calls}
          addLabel="Log call"
          fields={FIELDS.calls(state)}
          defaults={{
            direction: 'Outbound',
            date: todayIso,
            duration: 60,
            technicalResult: 'Answered/Connected',
            disposition: 'Interested',
          }}
          searchKeys={['contact', 'company', 'agent', 'phone', 'notes']}
          filters={[
            { key: 'technicalResult', label: 'technical results', options: TECHNICAL_RESULTS },
            { key: 'disposition', label: 'dispositions', options: SALES_DISPOSITIONS },
            { key: 'agent', label: 'agents', options: [...new Set(calls.map((c: any) => c.agent).filter(Boolean))] },
          ]}
          columns={[
            {
              key: 'contact',
              label: 'Contact',
              render: (c: any) => (
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-[#111827]">{c.contact}</p>
                    {c.disposition === 'Do Not Call' && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">DNC</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.company} · {c.phone}
                  </p>
                </div>
              ),
            },
            { key: 'agent', label: 'Agent' },
            {
              key: 'technicalResult',
              label: 'Technical Result',
              render: (c: any) => (
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    c.technicalResult === 'Answered/Connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : ['Busy', 'No Answer'].includes(c.technicalResult)
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {c.technicalResult || 'Connected'}
                </span>
              ),
            },
            {
              key: 'disposition',
              label: 'Sales Disposition',
              render: (c: any) => (
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                    c.disposition === 'Converted' && 'bg-emerald-100 text-emerald-800',
                    c.disposition === 'Interested' && 'bg-indigo-50 text-indigo-700 border border-indigo-200',
                    ['Call Back Required', 'Follow-up Scheduled'].includes(c.disposition) &&
                      'bg-purple-50 text-purple-700 border border-purple-200',
                    c.disposition === 'Do Not Call' && 'bg-red-100 text-red-800 font-bold',
                    c.disposition === 'Not Interested' && 'bg-slate-100 text-slate-600'
                  )}
                >
                  {c.disposition}
                </span>
              ),
            },
            {
              key: 'duration',
              label: 'Duration',
              render: (c: any) => dur(c.duration),
            },
            {
              key: 'recording',
              label: 'Recording',
              render: (c: any) =>
                c.recordingUrl ? (
                  <audio src={c.recordingUrl} controls className="h-7 w-32" />
                ) : (
                  <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded" title="Audio processing or recording not captured">
                    Unavailable
                  </span>
                ),
            },
            { key: 'date', label: 'Date', render: (c: any) => fmtDate(c.date) },
            {
              key: 'followUp',
              label: 'Follow-up',
              render: (c: any) => (c.followUp ? fmtDate(c.followUp) : '—'),
            },
          ]}
        />
      )}

      {tab === 'Follow-ups' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['All', 'Overdue', 'Today', 'Upcoming'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFuFilter(filter)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  fuFilter === filter
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                {filter} {filter === 'Overdue' && `(${allFollowUps.filter((c: any) => c.followUp < todayIso).length})`}
              </button>
            ))}
          </div>

          <CrudTable
            testid="followups"
            rows={followUps}
            searchKeys={['contact', 'company', 'agent', 'notes']}
            columns={[
              { key: 'contact', label: 'Contact' },
              { key: 'company', label: 'Company' },
              { key: 'agent', label: 'Agent' },
              {
                key: 'followUp',
                label: 'Follow-up date',
                render: (c: any) => {
                  const isOver = c.followUp < todayIso;
                  const isTod = c.followUp === todayIso;
                  return (
                    <span
                      className={cn(
                        'font-medium text-xs',
                        isOver && 'text-red-600 font-semibold',
                        isTod && 'text-amber-600 font-semibold'
                      )}
                    >
                      {fmtDate(c.followUp)} {isOver && '(Overdue)'} {isTod && '(Due today)'}
                    </span>
                  );
                },
              },
              { key: 'notes', label: 'Context & Notes', render: (c: any) => c.notes || '—' },
            ]}
          />
        </div>
      )}

      {tab === 'Contacts' && (
        <CrudTable
          testid="tele-contacts"
          rows={leads}
          searchKeys={['name', 'company', 'phone', 'owner']}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (l: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={l.name} size={24} />
                  <span className="font-medium text-[#111827]">{l.name}</span>
                  {(l.dnc || l.status === 'Do Not Call') && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">DNC</span>
                  )}
                </span>
              ),
            },
            { key: 'company', label: 'Company' },
            { key: 'phone', label: 'Phone', render: (l: any) => l.phone || '—' },
            { key: 'owner', label: 'Assigned to' },
            { key: 'status', label: 'Stage', render: (l: any) => <Badge>{l.status}</Badge> },
          ]}
        />
      )}
    </div>
  );
}
