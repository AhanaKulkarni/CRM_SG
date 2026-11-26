'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  Clock,
  Mic,
  MicOff,
  Pause,
  Play,
  Users,
  CheckCircle2,
  Download,
  AlertCircle,
  Volume2,
  ShieldCheck,
  FileDown,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCall, fmtCallDuration } from '@/components/CallContext';
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
  CHART,
  inputCls,
  cn,
  Tabs,
  Empty,
  fmtDate,
  downloadCSV,
} from '@/components/kit';
import { PlivoSettingsPanel } from '@/components/PlivoSettingsPanel';

export const dur = fmtCallDuration;

const todayIso = new Date().toISOString().slice(0, 10);

function Dialer({ selectedLeadId, onSelectLead }: { selectedLeadId?: string; onSelectLead?: (id: string) => void }) {
  const { state } = useStore();
  const call = useCall();
  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name || 'Agent';

  const rawLeads = state.leads || [];
  const leads = isCaller ? rawLeads.filter((l: any) => l.owner === currentUser || !l.owner) : rawLeads;
  const customers = state.customers || [];

  const contacts = [
    ...leads.map((l: any) => ({ ...l, _kind: 'lead' })),
    ...customers.map((c: any) => ({ ...c, _kind: 'customer' })),
  ];

  const [mode, setMode] = useState<'contact' | 'manual'>('contact');
  const [sel, setSel] = useState<string>(selectedLeadId || contacts[0]?.id || '');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [recordConsent, setRecordConsent] = useState<boolean>(false);

  useEffect(() => {
    if (selectedLeadId && selectedLeadId !== sel) {
      setSel(selectedLeadId);
      setMode('contact');
    }
  }, [selectedLeadId, sel]);

  useEffect(() => {
    if (!sel && contacts[0]?.id) {
      setSel(contacts[0].id);
    }
  }, [contacts.length, sel]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRecordConsent(localStorage.getItem('aetherx_plivo_recording') === 'true');
    }
  }, []);

  const selectedContact = contacts.find((c: any) => c.id === sel) || contacts[0];
  const isDNC = mode === 'contact' && (selectedContact?.dnc || selectedContact?.status === 'Do Not Call');
  const active = call.activeCall;
  const isLive = Boolean(active);

  const handleCall = () => {
    if (mode === 'manual') {
      call.startCall({
        phone: manualPhone,
        contactName: manualPhone,
        company: 'Manual Dial',
      });
      return;
    }
    if (!selectedContact || isDNC) return;
    call.startCall({
      phone: selectedContact.phone || '',
      contactName: selectedContact.name,
      company: selectedContact.company,
      leadId: selectedContact._kind === 'lead' ? selectedContact.id : '',
      customerId: selectedContact._kind === 'customer' ? selectedContact.id : '',
    });
  };

  return (
    <Card className="p-5 space-y-4" data-testid="dialer">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[15px] text-[#1C2433]">Plivo Browser Dialer</h3>
          <p className="text-[11px] text-[#778196]">
            {call.sdkStatus === 'registered'
              ? `Endpoint: ${call.sdkIdentity}`
              : call.sdkStatus === 'checking'
              ? 'Connecting Plivo WebRTC…'
              : call.sdkStatus === 'unauthorized'
              ? 'No Plivo number assigned to this account'
              : call.sdkStatus === 'error'
              ? call.sdkError || 'Plivo SDK error'
              : 'Plivo credentials required'}
          </p>
        </div>
        <Badge tone={call.sdkReady ? 'success' : isDNC || call.sdkStatus === 'unauthorized' ? 'danger' : 'warning'}>
          {isDNC ? 'DNC Restricted' : call.sdkReady ? 'Plivo Live' : call.sdkStatus === 'unauthorized' ? 'Not Authorised' : 'Standby'}
        </Badge>
      </div>

      {call.incomingCall && (
        <div className="p-3 rounded-xl bg-[#26A879]/12 border border-[#26A879]/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PhoneIncoming className="w-4 h-4 text-[#26A879] animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-[#1C2433] truncate">
              Incoming: {call.incomingCall.callerName}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button size="sm" onClick={call.answerIncoming}>Answer</Button>
            <Button size="sm" variant="danger" onClick={call.rejectIncoming}>Reject</Button>
          </div>
        </div>
      )}

      {/* Mode Switch: CRM Contact vs Manual Number */}
      <div className="flex p-1 rounded-xl neu-inset">
        <button
          type="button"
          disabled={isLive}
          onClick={() => setMode('contact')}
          className={cn(
            'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
            mode === 'contact' ? 'bg-white text-[#1C2433] shadow-sm' : 'text-[#778196]'
          )}
        >
          CRM Contact
        </button>
        <button
          type="button"
          disabled={isLive}
          onClick={() => setMode('manual')}
          className={cn(
            'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all',
            mode === 'manual' ? 'bg-white text-[#1C2433] shadow-sm' : 'text-[#778196]'
          )}
        >
          Manual Number
        </button>
      </div>

      {mode === 'contact' ? (
        contacts.length > 0 ? (
          <select
            data-testid="dialer-contact-select"
            disabled={isLive}
            className={inputCls}
            value={sel}
            onChange={(e) => {
              setSel(e.target.value);
              onSelectLead?.(e.target.value);
            }}
          >
            {contacts.slice(0, 50).map((c: any) => (
              <option key={`${c._kind}-${c.id}`} value={c.id}>
                {c.name} · {c.company} ({c._kind === 'customer' ? 'Customer' : 'Lead'}) {c.dnc ? '[DNC]' : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-[#778196] p-3 rounded-xl neu-surface">
            No CRM contacts yet. Switch to Manual Number or add a Lead.
          </p>
        )
      ) : (
        <input
          type="tel"
          disabled={isLive}
          value={manualPhone}
          onChange={(e) => setManualPhone(e.target.value)}
          placeholder="+91 98XXXXXXXX"
          className={inputCls}
          data-testid="dialer-manual-input"
        />
      )}

      {/* Mic & Recording Consent */}
      <div className="grid grid-cols-1 gap-2">
        {call.audioInputs.length > 0 ? (
          <select
            aria-label="Microphone device"
            disabled={isLive}
            value={call.selectedMic}
            onChange={(e) => call.setSelectedMic(e.target.value)}
            className="w-full h-9 rounded-xl neu-inset px-3 text-xs text-[#1C2433] outline-none"
          >
            {call.audioInputs.map((m, idx) => (
              <option key={m.deviceId || idx} value={m.deviceId}>
                Mic: {m.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        ) : (
          <Button size="sm" variant="secondary" onClick={call.requestMicPermission}>
            <Mic className="w-3.5 h-3.5" />
            Grant Microphone Permission
          </Button>
        )}

        <label className="flex items-center justify-between px-3 py-2 rounded-xl neu-surface text-xs cursor-pointer">
          <span className="flex items-center gap-1.5 text-[#1C2433] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Server-side recording (with consent)
          </span>
          <input
            type="checkbox"
            disabled={isLive}
            checked={recordConsent}
            onChange={(e) => {
              setRecordConsent(e.target.checked);
              if (typeof window !== 'undefined') {
                localStorage.setItem('aetherx_plivo_recording', String(e.target.checked));
              }
            }}
            className="rounded accent-[#6965ED]"
          />
        </label>
      </div>

      {/* Call Console */}
      <div className="rounded-2xl bg-[#171C2C] text-white p-5 text-center grain relative overflow-hidden shadow-lg">
        <Avatar name={active ? active.contactName : mode === 'manual' ? manualPhone || '?' : selectedContact?.name || '?'} size={56} />
        <p className="mt-3 font-semibold text-base sm:text-lg truncate">
          {active ? active.contactName : mode === 'manual' ? manualPhone || 'Enter number' : selectedContact?.name || 'No Contact'}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {active
            ? `${active.company} · ${active.phone}`
            : mode === 'manual'
            ? `Caller ID: ${call.callerId}`
            : `${selectedContact?.company || 'CRM'} · ${selectedContact?.phone || 'No phone number'}`}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Agent: {currentUser} · Public ID: {call.callerId}
        </p>

        {isDNC ? (
          <div className="mt-4 p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-xs text-red-300 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>DO NOT CALL: Opted out of outbound calls.</span>
          </div>
        ) : (
          <div className="mt-3">
            <p
              className={cn(
                'text-2xl font-mono tabular-nums font-bold tracking-wider',
                isLive ? 'text-[#26A879]' : 'text-slate-400'
              )}
              data-testid="dialer-timer"
            >
              {active ? dur(active.durationSec) : 'Ready'}
            </p>
            {active && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{active.status}</p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-4">
          {active ? (
            <>
              <button
                type="button"
                onClick={call.toggleMute}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                  active.mute ? 'bg-[#E15B63] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                )}
                title={active.mute ? 'Unmute' : 'Mute'}
              >
                {active.mute ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={call.toggleHold}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                  active.hold ? 'bg-[#E7A23A] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                )}
                title={active.hold ? 'Resume' : 'Hold'}
              >
                {active.hold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                type="button"
                data-testid="dialer-end-btn"
                onClick={call.hangupCall}
                className="w-11 h-11 rounded-full bg-[#E15B63] flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                title="Hang Up"
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isDNC || (mode === 'manual' ? !manualPhone.trim() : !selectedContact?.phone)}
              data-testid="dialer-call-btn"
              onClick={handleCall}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg',
                isDNC || (mode === 'manual' ? !manualPhone.trim() : !selectedContact?.phone)
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-[#26A879] pulse-ring hover:brightness-110 active:scale-95'
              )}
              title={isDNC ? 'Do Not Call active' : 'Call via Plivo'}
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        {!call.sdkReady && (
          <p className="mt-3 text-[11px] text-[#E7A23A]">
            {call.sdkStatus === 'checking'
              ? 'Registering Plivo Browser SDK…'
              : call.sdkStatus === 'unauthorized'
              ? call.sdkError || 'No Plivo number assigned to this caller.'
              : call.sdkStatus === 'error'
              ? call.sdkError || 'Plivo Browser SDK connection failed.'
              : 'Configure Plivo server env vars to enable live PSTN calling.'}
          </p>
        )}
      </div>
    </Card>
  );
}

export function TelecallingView() {
  const { state } = useStore();
  const call = useCall();
  const [tab, setTab] = useState('Call Logs');
  const [fuFilter, setFuFilter] = useState<'All' | 'Overdue' | 'Today' | 'Upcoming'>('All');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  const allCalls = state.calls || [];
  const calls = isCaller
    ? allCalls.filter((c: any) => c.employeeId === state.session?.id || c.agent === currentUser)
    : allCalls;

  const rawLeads = state.leads || [];
  const leads = isCaller ? rawLeads.filter((l: any) => l.owner === currentUser || !l.owner) : rawLeads;

  const callsToday = calls.filter((c: any) => c.date === todayIso).length;
  const avgDurationSec =
    calls.length > 0 ? Math.round(calls.reduce((a: number, c: any) => a + Number(c.duration || 0), 0) / calls.length) : 0;
  const connectedCalls = calls.filter(
    (c: any) => c.technicalResult === 'Answered/Connected' || (!c.technicalResult && c.disposition !== 'No Answer')
  ).length;
  const connectRate = calls.length > 0 ? `${Math.round((connectedCalls / calls.length) * 100)}%` : '0%';
  const positiveOutcomes = calls.filter((c: any) =>
    ['Converted', 'Interested', 'Call Back Required', 'Callback', 'Follow-up Scheduled'].includes(c.disposition)
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

  const allFollowUps = calls.filter((c: any) => Boolean(c.followUp));
  const followUps = allFollowUps.filter((c: any) => {
    if (fuFilter === 'Overdue') return c.followUp < todayIso;
    if (fuFilter === 'Today') return c.followUp === todayIso;
    if (fuFilter === 'Upcoming') return c.followUp > todayIso;
    return true;
  });

  const isDeveloper = state.session?.role === 'Developer';
  const tabsList = isDeveloper
    ? ['Call Logs', 'Recordings', 'Follow-ups', 'Contacts', 'Plivo Config']
    : ['Call Logs', 'Recordings', 'Follow-ups', 'Contacts'];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Telecalling"
        subtitle="Plivo browser-based calling (+91 22 6985 7438), server-side recordings, dispositions & analytics."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadCSV('aetherx-call-logs', calls)}
            data-testid="export-calls-csv"
          >
            <FileDown className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        <Stat label="Calls Today" value={callsToday.toString()} icon={PhoneCall} />
        <Stat label="Average Duration" value={dur(avgDurationSec)} icon={Clock} />
        <Stat label="Connect Rate" value={connectRate} icon={Users} />
        <Stat
          label="Positive Outcomes"
          value={positiveOutcomes.toString()}
          icon={CheckCircle2}
          hint="interested + converted"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Dialer selectedLeadId={selectedLeadId} onSelectLead={setSelectedLeadId} />

        <Card variant="clean" className="lg:col-span-2" data-testid="agent-performance">
          <CardHead title="Agent performance" sub="Concurrent employee calls and talk time (min)" />
          {agents.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Empty title="No calls logged yet" text="Place calls using the Plivo dialer to populate agent analytics." />
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
                    <Bar dataKey="calls" fill="var(--brand)" radius={[6, 6, 0, 0]} name="Calls" />
                    <Bar dataKey="talk" fill="var(--brand2)" radius={[6, 6, 0, 0]} name="Talk time (min)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 pt-2 border-t border-[#E1E5ED]">
                {agents.slice(0, 4).map((a) => (
                  <div key={a.full} className="flex items-center gap-2">
                    <Avatar name={a.full} size={28} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-[#1C2433]">{a.full}</p>
                      <p className="text-[11px] text-[#778196]">{a.conv} positive</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Tabs testid="tele-tabs" tabs={tabsList} value={tab} onChange={setTab} />

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
            callerId: call.callerId,
            date: todayIso,
            duration: 60,
            technicalResult: 'Answered/Connected',
            disposition: 'Interested',
          }}
          searchKeys={['contact', 'company', 'agent', 'phone', 'notes', 'callerId']}
          filters={[
            { key: 'technicalResult', label: 'statuses', options: TECHNICAL_RESULTS },
            { key: 'disposition', label: 'dispositions', options: SALES_DISPOSITIONS },
            { key: 'agent', label: 'employees', options: [...new Set(calls.map((c: any) => c.agent).filter(Boolean))] },
          ]}
          columns={[
            {
              key: 'contact',
              label: 'Customer / Lead',
              render: (c: any) => (
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-[#1C2433]">{c.contact}</p>
                    <Badge tone={c.direction === 'Inbound' ? 'info' : 'neutral'}>{c.direction || 'Outbound'}</Badge>
                  </div>
                  <p className="text-xs text-[#778196]">
                    {c.company} · {c.phone}
                  </p>
                </div>
              ),
            },
            {
              key: 'agent',
              label: 'Employee',
              render: (c: any) => (
                <div>
                  <p className="text-sm font-medium text-[#1C2433]">{c.agent}</p>
                  <p className="text-[11px] text-[#778196]">CID: {c.callerId || call.callerId}</p>
                </div>
              ),
            },
            {
              key: 'technicalResult',
              label: 'Status',
              render: (c: any) => <Badge>{c.technicalResult || 'Connected'}</Badge>,
            },
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
            {
              key: 'recording',
              label: 'Recording',
              render: (c: any) =>
                c.recordingUrl ? (
                  <div className="flex items-center gap-1.5">
                    <audio src={c.recordingUrl} controls className="h-7 w-32" />
                    <a
                      href={`${c.recordingUrl}?download=1`}
                      title="Download private recording"
                      className="text-[#778196] hover:text-brand p-1 rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#778196] bg-[#EEF1F6] px-2 py-0.5 rounded-lg">Unavailable</span>
                ),
            },
            {
              key: 'date',
              label: 'Time',
              render: (c: any) => (
                <div className="text-xs">
                  <p className="text-[#1C2433]">{fmtDate(c.date)}</p>
                  {c.startTime && (
                    <p className="text-[11px] text-[#778196]">
                      {new Date(c.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: 'followUp',
              label: 'Follow-up',
              render: (c: any) => (c.followUp ? fmtDate(c.followUp) : '—'),
            },
          ]}
        />
      )}

      {tab === 'Recordings' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[#1C2433]">Private Call Recordings</h4>
                <p className="text-xs text-[#778196] mt-0.5">
                  Server-side Plivo recordings streamed through authenticated role-restricted endpoints. Never publicly exposed.
                </p>
              </div>
            </div>
            <Badge tone="success">Role-Restricted Access</Badge>
          </Card>

          <CrudTable
            testid="recordings"
            canAdd={false}
            entity="Recording"
            rows={calls.filter((c: any) => Boolean(c.recordingUrl))}
            searchKeys={['contact', 'company', 'agent', 'phone', 'notes']}
            columns={[
              {
                key: 'contact',
                label: 'Customer / Lead',
                render: (c: any) => (
                  <div>
                    <p className="font-semibold text-[#1C2433]">{c.contact}</p>
                    <p className="text-xs text-[#778196]">
                      {c.company} · {c.phone}
                    </p>
                  </div>
                ),
              },
              { key: 'agent', label: 'Employee' },
              {
                key: 'disposition',
                label: 'Outcome',
                render: (c: any) => <Badge>{c.disposition || 'Completed'}</Badge>,
              },
              {
                key: 'duration',
                label: 'Duration',
                render: (c: any) => dur(c.duration),
              },
              {
                key: 'audio',
                label: 'Private Playback',
                render: (c: any) => (
                  <div className="flex items-center gap-2">
                    <audio src={c.recordingUrl} controls className="h-8 w-44 sm:w-56" />
                    <a
                      href={`${c.recordingUrl}?download=1`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#1C2433] neu-btn rounded-xl"
                      title="Download recording"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ),
              },
              { key: 'date', label: 'Date', render: (c: any) => fmtDate(c.date) },
            ]}
          />
        </div>
      )}

      {tab === 'Follow-ups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['All', 'Overdue', 'Today', 'Upcoming'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFuFilter(filter)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  fuFilter === filter ? 'neu-btn-primary' : 'neu-btn text-[#778196]'
                )}
              >
                {filter} {filter === 'Overdue' && `(${allFollowUps.filter((c: any) => c.followUp < todayIso).length})`}
              </button>
            ))}
          </div>

          <CrudTable
            testid="followups"
            canAdd={false}
            entity="Follow-up"
            rows={followUps}
            searchKeys={['contact', 'company', 'agent', 'notes']}
            columns={[
              { key: 'contact', label: 'Contact' },
              { key: 'company', label: 'Company' },
              { key: 'agent', label: 'Employee' },
              {
                key: 'followUp',
                label: 'Follow-up date',
                render: (c: any) => {
                  const isOver = c.followUp < todayIso;
                  const isTod = c.followUp === todayIso;
                  return (
                    <span
                      className={cn(
                        'font-semibold text-xs',
                        isOver && 'text-[#E15B63]',
                        isTod && 'text-[#E7A23A]'
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
          canAdd={false}
          entity="Contact"
          rows={leads}
          searchKeys={['name', 'company', 'phone', 'owner']}
          rowActions={(l: any) => (
            <Button
              size="sm"
              variant="secondary"
              disabled={!l.phone || l.dnc || l.status === 'Do Not Call'}
              onClick={() => {
                setSelectedLeadId(l.id);
                call.startCall({
                  phone: l.phone,
                  contactName: l.name,
                  company: l.company,
                  leadId: l.id,
                });
              }}
              className="mr-1"
            >
              <Phone className="w-3.5 h-3.5 text-[#26A879]" />
              Call
            </Button>
          )}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (l: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={l.name} size={24} />
                  <span className="font-semibold text-[#1C2433]">{l.name}</span>
                  {(l.dnc || l.status === 'Do Not Call') && <Badge tone="danger">DNC</Badge>}
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

      {tab === 'Plivo Config' && isDeveloper && <PlivoSettingsPanel />}
    </div>
  );
}
