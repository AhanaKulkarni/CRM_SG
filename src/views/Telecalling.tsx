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
import { Phone, PhoneOff, PhoneCall, Clock, Mic, MicOff, Pause, Users, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
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
const DISP = ['Interested', 'Callback', 'Not Interested', 'No Answer', 'Converted'];
const todayIso = new Date().toISOString().slice(0, 10);
const future2Days = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

function Dialer() {
  const store = useStore();
  const { state } = store;
  const leads = state.leads || [];

  const [sel, setSel] = useState<string>(leads[0]?.id || '');
  const [live, setLive] = useState(false);
  const [sec, setSec] = useState(0);
  const [mute, setMute] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [disp, setDisp] = useState('Interested');
  const [fu, setFu] = useState(future2Days);
  const [notes, setNotes] = useState('');

  const lead = leads.find((l: any) => l.id === sel) || leads[0];

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
      agent: state.session?.name || 'Aisha Khan',
      direction: 'Outbound',
      disposition: disp,
      duration: Math.max(sec, 1),
      date: todayIso,
      followUp: ['Interested', 'Callback'].includes(disp) ? fu : '',
      notes,
    });

    if (['Interested', 'Callback'].includes(disp)) {
      store.add('reminders', {
        title: `Follow-up call with ${lead.name}`,
        type: 'Follow-up',
        due: fu,
        time: '11:00',
        owner: lead.owner || state.session?.name,
        done: false,
        auto: true,
      });
    }

    store.update('leads', lead.id, {
      status: disp === 'Converted' ? 'Won' : lead.status === 'New' ? 'Contacted' : lead.status,
    });

    store.log(state.session?.name || 'You', 'logged a call with', lead.company, 'call');
    toast.success('Call logged', {
      description: `${disp}${['Interested', 'Callback'].includes(disp) ? ' · follow-up scheduled' : ''}`,
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
      <h3 className="font-semibold text-[15px] mb-4 text-[#111827]">Click-to-call</h3>
      <select
        data-testid="dialer-contact-select"
        disabled={live}
        className={inputCls}
        value={sel}
        onChange={(e) => setSel(e.target.value)}
      >
        {leads.slice(0, 25).map((l: any) => (
          <option key={l.id} value={l.id}>
            {l.name} · {l.company}
          </option>
        ))}
      </select>

      <div className="mt-5 rounded-xl bg-[#111827] text-white p-5 text-center grain relative overflow-hidden">
        <Avatar name={lead.name} size={56} />
        <p className="mt-3 font-semibold text-lg">{lead.name}</p>
        <p className="text-xs text-slate-400">
          {lead.company} · {lead.phone || 'No number'}
        </p>
        <p
          className={cn(
            'mt-3 text-2xl font-mono tabular-nums font-bold tracking-wider',
            live ? 'text-emerald-400' : 'text-slate-500'
          )}
          data-testid="dialer-timer"
        >
          {live ? dur(sec) : 'Ready'}
        </p>
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
              data-testid="dialer-call-btn"
              onClick={() => {
                setSec(0);
                setLive(true);
                toast(`Calling ${lead.name}…`, { description: 'Simulated call session' });
              }}
              className="w-14 h-14 rounded-full bg-[#10B981] flex items-center justify-center pulse-ring hover:bg-emerald-600 transition-colors shadow-lg"
              title="Call"
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      <Modal
        open={wrap}
        onClose={() => setWrap(false)}
        title="Call disposition"
        description={`Call with ${lead.name} · ${dur(sec)}`}
        testid="disposition-modal"
      >
        <div className="grid grid-cols-2 gap-2">
          {DISP.map((d) => (
            <button
              key={d}
              data-testid={`disp-${d.toLowerCase().replace(/\s/g, '-')}`}
              onClick={() => setDisp(d)}
              className={cn(
                'h-10 rounded-lg border text-sm font-medium transition-colors',
                disp === d ? 'border-brand bg-brand-soft text-[#111827]' : 'border-[#E5E7EB] hover:bg-slate-50'
              )}
            >
              {d}
            </button>
          ))}
        </div>

        {['Interested', 'Callback'].includes(disp) && (
          <label className="block pt-2">
            <span className="text-xs font-medium text-slate-600">Schedule follow-up date</span>
            <input
              type="date"
              className={`${inputCls} mt-1`}
              value={fu}
              onChange={(e) => setFu(e.target.value)}
              data-testid="followup-date"
            />
          </label>
        )}

        <textarea
          className={`${inputCls} h-20 py-2 mt-2`}
          placeholder="Call notes & key takeaways…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          data-testid="call-notes"
        />

        <Button onClick={save} data-testid="save-call-btn" className="w-full mt-2">
          Save call log
        </Button>
      </Modal>
    </Card>
  );
}

export function TelecallingView() {
  const { state } = useStore();
  const [tab, setTab] = useState('Call Logs');

  const calls = state.calls || [];
  const callsToday = calls.filter((c: any) => c.date === todayIso).length;
  const avgDurationSec =
    calls.length > 0 ? Math.round(calls.reduce((a: number, c: any) => a + Number(c.duration || 0), 0) / calls.length) : 0;
  const connectedCalls = calls.filter((c: any) => c.disposition !== 'No Answer').length;
  const connectRate = calls.length > 0 ? `${Math.round((connectedCalls / calls.length) * 100)}%` : '0%';
  const positiveOutcomes = calls.filter((c: any) => ['Converted', 'Interested'].includes(c.disposition)).length;

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
          addLabel="Log call"
          fields={FIELDS.calls(state)}
          defaults={{ direction: 'Outbound', date: todayIso, duration: 60, disposition: 'Interested' }}
          searchKeys={['contact', 'company', 'agent', 'phone']}
          filters={[
            { key: 'disposition', label: 'dispositions', options: DISP },
            { key: 'agent', label: 'agents', options: [...new Set(calls.map((c: any) => c.agent).filter(Boolean))] },
          ]}
          columns={[
            {
              key: 'contact',
              label: 'Contact',
              render: (c: any) => (
                <div>
                  <p className="font-medium text-[#111827]">{c.contact}</p>
                  <p className="text-xs text-slate-500">
                    {c.company} · {c.phone}
                  </p>
                </div>
              ),
            },
            { key: 'direction', label: 'Direction' },
            { key: 'agent', label: 'Agent' },
            {
              key: 'disposition',
              label: 'Disposition',
              render: (c: any) => <Badge>{c.disposition}</Badge>,
            },
            {
              key: 'duration',
              label: 'Duration',
              render: (c: any) => dur(c.duration),
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
        <CrudTable
          testid="followups"
          rows={calls.filter((c: any) => Boolean(c.followUp))}
          searchKeys={['contact', 'agent']}
          columns={[
            { key: 'contact', label: 'Contact' },
            { key: 'company', label: 'Company' },
            { key: 'agent', label: 'Agent' },
            { key: 'followUp', label: 'Follow-up date', render: (c: any) => fmtDate(c.followUp) },
            { key: 'notes', label: 'Context', render: (c: any) => c.notes || '—' },
          ]}
        />
      )}

      {tab === 'Contacts' && (
        <CrudTable
          testid="tele-contacts"
          rows={state.leads || []}
          searchKeys={['name', 'company', 'phone']}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (l: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={l.name} size={24} />
                  {l.name}
                </span>
              ),
            },
            { key: 'company', label: 'Company' },
            { key: 'phone', label: 'Phone', render: (l: any) => l.phone || '—' },
            { key: 'email', label: 'Email', render: (l: any) => l.email || '—' },
            { key: 'status', label: 'Stage', render: (l: any) => <Badge>{l.status}</Badge> },
          ]}
        />
      )}
    </div>
  );
}
