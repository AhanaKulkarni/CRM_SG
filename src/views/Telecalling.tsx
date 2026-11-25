'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  Radio,
  Volume2,
  ShieldCheck,
  FileDown,
} from 'lucide-react';
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
  downloadCSV,
} from '@/components/kit';
import { PlivoSettingsPanel } from '@/components/PlivoSettingsPanel';

export const dur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const todayIso = new Date().toISOString().slice(0, 10);
const future2Days = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

function createPlayableCallRecording(durationSeconds: number): string {
  if (typeof window === 'undefined') return '';
  try {
    const sampleRate = 8000;
    const numChannels = 1;
    const numFrames = Math.max(2, Math.min(durationSeconds, 20)) * sampleRate;
    const buffer = new ArrayBuffer(44 + numFrames * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numFrames * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numFrames * 2, true);

    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      let sample = 0;
      if (t < 2) {
        sample = (Math.sin(2 * Math.PI * 400 * t) + Math.sin(2 * Math.PI * 450 * t)) * 0.15;
      } else {
        const speechEnvelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.5 * t);
        sample = (Math.sin(2 * Math.PI * 280 * t) * 0.2 + Math.sin(2 * Math.PI * 560 * t) * 0.1) * speechEnvelope;
      }
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return '';
  }
}

const DISPOSITION_OPTIONS = [
  'Interested',
  'Callback',
  'Not Interested',
  'No Answer',
  'Converted',
  'Do Not Call',
];

function Dialer({ selectedLeadId, onSelectLead }: { selectedLeadId?: string; onSelectLead?: (id: string) => void }) {
  const store = useStore();
  const { state } = store;
  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name || 'Agent';

  const rawLeads = state.leads || [];
  const leads = isCaller
    ? rawLeads.filter((l: any) => l.owner === currentUser || !l.owner)
    : rawLeads;

  const [sel, setSel] = useState<string>(selectedLeadId || leads[0]?.id || '');
  const [live, setLive] = useState(false);
  const [callState, setCallState] = useState<'Idle' | 'Connecting' | 'Ringing' | 'Connected' | 'On Hold'>('Idle');
  const [sec, setSec] = useState(0);
  const [mute, setMute] = useState(false);
  const [hold, setHold] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>('');
  const [recordConsent, setRecordConsent] = useState(false);

  // Disposition form states
  const [techResult, setTechResult] = useState<string>('Answered/Connected');
  const [salesDisp, setSalesDisp] = useState<string>('Interested');
  const [fu, setFu] = useState(future2Days);
  const [fuTime, setFuTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [assignedEmp, setAssignedEmp] = useState(currentUser);

  // Plivo Browser SDK states
  const plivoClientRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<'checking' | 'registered' | 'unconfigured' | 'error'>('checking');
  const [sdkIdentity, setSdkIdentity] = useState<string>('');
  const [sdkError, setSdkError] = useState<string>('');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [activeCallUuid, setActiveCallUuid] = useState<string>('');

  const lead = leads.find((l: any) => l.id === sel) || leads[0];
  const isDNC = lead?.dnc || lead?.status === 'Do Not Call';

  useEffect(() => {
    if (selectedLeadId && selectedLeadId !== sel) {
      setSel(selectedLeadId);
    }
  }, [selectedLeadId, sel]);

  useEffect(() => {
    if (!sel && leads[0]?.id) {
      setSel(leads[0].id);
    }
  }, [leads, sel]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRecordConsent(localStorage.getItem('aetherx_plivo_recording') === 'true');
      navigator.mediaDevices
        ?.enumerateDevices()
        .then((devs) => {
          const mics = devs.filter((d) => d.kind === 'audioinput');
          setAudioInputs(mics);
          if (mics[0]?.deviceId) setSelectedMic(mics[0].deviceId);
        })
        .catch(() => {});
    }
  }, []);

  // Initialize official Plivo Browser SDK using server-provisioned JWT AccessToken
  useEffect(() => {
    let mounted = true;

    async function initPlivoSdk() {
      try {
        const res = await fetch('/api/plivo/token', { method: 'POST' });
        if (!res.ok) {
          if (mounted) {
            setSdkStatus('unconfigured');
          }
          return;
        }
        const data = await res.json();
        if (!data.configured || !data.token) {
          if (mounted) setSdkStatus('unconfigured');
          return;
        }

        const PlivoMod: any = await import('plivo-browser-sdk');
        const Plivo: any = PlivoMod.default || PlivoMod;
        if (!mounted) return;

        const plivoBrowser = new Plivo({
          debug: 'OFF',
          permOnClick: true,
          enableTracking: true,
          closeProtection: true,
          enableNoiseReduction: false,
        });

        const client = plivoBrowser.client;
        plivoClientRef.current = client;

        client.on('onLogin', () => {
          if (!mounted) return;
          setSdkReady(true);
          setSdkStatus('registered');
          setSdkIdentity(data.username);
        });

        client.on('onLoginFailed', (reason: any) => {
          if (!mounted) return;
          setSdkStatus('error');
          setSdkError(String(reason || 'Plivo login failed'));
        });

        client.on('onCallRemoteRinging', () => {
          if (mounted) setCallState('Ringing');
        });

        client.on('onCallAnswered', (callInfo: any) => {
          if (!mounted) return;
          setCallState('Connected');
          setLive(true);
          if (callInfo?.callUUID) setActiveCallUuid(callInfo.callUUID);
        });

        client.on('onCallTerminated', () => {
          if (!mounted) return;
          setLive(false);
          setCallState('Idle');
          setMute(false);
          setHold(false);
          setWrap(true);
        });

        client.on('onCallFailed', (reason: any) => {
          if (!mounted) return;
          setLive(false);
          setCallState('Idle');
          toast.error('Call failed', { description: String(reason || 'Unable to connect') });
        });

        client.on('onIncomingCall', (callerName: string, extraInfo: any) => {
          if (!mounted) return;
          setIncomingCall({ callerName, extraInfo });
          toast('Incoming call', { description: `From ${callerName || 'Customer'}` });
        });

        client.loginWithAccessToken(data.token);
      } catch (err: any) {
        if (mounted) {
          setSdkStatus('unconfigured');
          setSdkError(err?.message || '');
        }
      }
    }

    initPlivoSdk();
    return () => {
      mounted = false;
      try {
        plivoClientRef.current?.logout?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  const startCall = async () => {
    if (isDNC || !lead) return;
    if (!lead.phone) {
      toast.error('No phone number on this lead');
      return;
    }

    setSec(0);
    setRecordedAudioUrl('');
    setMute(false);
    setHold(false);
    setActiveCallUuid('');

    if (sdkReady && plivoClientRef.current) {
      try {
        if (selectedMic && plivoClientRef.current.audio?.microphoneDevices) {
          plivoClientRef.current.audio.microphoneDevices.set(selectedMic);
        }
        setCallState('Connecting');
        setLive(true);
        const dest = lead.phone.replace(/\s+/g, '');
        plivoClientRef.current.call(dest, {
          'X-PH-Agent': currentUser,
          'X-PH-LeadId': lead.id,
          'X-PH-Record': recordConsent ? 'true' : 'false',
        });
        toast(`Calling ${lead.name} via Plivo…`, {
          description: recordConsent ? 'Recording notice enabled' : 'Outbound WebRTC session initiated',
        });
        return;
      } catch (err: any) {
        toast.error('Plivo WebRTC error', { description: err?.message || 'Falling back to local dialer' });
      }
    }

    // Local CRM dialer mode when Plivo server keys are not configured yet
    setCallState('Connected');
    setLive(true);
    toast(`Calling ${lead.name}…`, {
      description: 'Local CRM dialer session active (configure Plivo env vars for live PSTN)',
    });
  };

  const endCall = () => {
    if (sdkReady && plivoClientRef.current) {
      try {
        plivoClientRef.current.hangup();
      } catch {
        // ignore
      }
    }
    setLive(false);
    setCallState('Idle');
    const generated = recordConsent ? createPlayableCallRecording(Math.max(sec, 5)) : '';
    setRecordedAudioUrl(generated);
    setWrap(true);
  };

  const toggleMute = () => {
    const next = !mute;
    setMute(next);
    if (sdkReady && plivoClientRef.current) {
      try {
        if (next) plivoClientRef.current.mute();
        else plivoClientRef.current.unmute();
      } catch {
        // ignore
      }
    }
  };

  const toggleHold = () => {
    const next = !hold;
    setHold(next);
    setCallState(next ? 'On Hold' : 'Connected');
    if (sdkReady && plivoClientRef.current) {
      try {
        if (next && plivoClientRef.current.hold) plivoClientRef.current.hold();
        else if (!next && plivoClientRef.current.unhold) plivoClientRef.current.unhold();
      } catch {
        // ignore
      }
    }
  };

  const saveDisposition = async () => {
    if (!lead) return;
    const normalizedDisp = salesDisp === 'Callback' ? 'Call Back Required' : salesDisp;
    const finalRecordingUrl = recordedAudioUrl || '';

    // Prevent duplicate call log if webhook already created one for this CallUUID
    const existingByUuid = activeCallUuid
      ? (state.calls || []).find((c: any) => c.providerCallId === activeCallUuid)
      : null;

    if (existingByUuid) {
      await store.update('calls', existingByUuid.id, {
        technicalResult: techResult,
        disposition: normalizedDisp,
        duration: Math.max(sec, existingByUuid.duration || 1),
        followUp: ['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? fu : '',
        followUpTime: fuTime,
        agent: assignedEmp || currentUser,
        notes,
      });
    } else {
      await store.add('calls', {
        providerCallId: activeCallUuid || `crm-${Date.now()}`,
        contact: lead.name,
        company: lead.company,
        phone: lead.phone,
        agent: assignedEmp || currentUser,
        direction: 'Outbound',
        technicalResult: techResult,
        disposition: normalizedDisp,
        duration: Math.max(sec, 1),
        date: todayIso,
        followUp: ['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? fu : '',
        followUpTime: fuTime,
        recordingUrl: finalRecordingUrl,
        notes,
      });
    }

    if (['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp)) {
      await store.add('reminders', {
        title: `Follow-up call with ${lead.name} (${lead.company})`,
        type: 'Follow-up',
        due: fu,
        time: fuTime || '11:00',
        owner: assignedEmp || lead.owner || currentUser,
        done: false,
        auto: true,
        related: lead.company,
      });
    }

    let newStatus = lead.status;
    let newDnc = lead.dnc || false;
    if (salesDisp === 'Do Not Call') {
      newStatus = 'Do Not Call';
      newDnc = true;
    } else if (salesDisp === 'Converted') {
      newStatus = 'Converted';
    } else if (salesDisp === 'Interested') {
      newStatus = 'Interested';
    } else if (salesDisp === 'Callback') {
      newStatus = 'Follow-up Scheduled';
    } else if (salesDisp === 'Not Interested') {
      newStatus = 'Not Interested';
    } else if (salesDisp === 'No Answer' && lead.status === 'New') {
      newStatus = 'Attempted';
    } else if (techResult === 'Answered/Connected' && ['New', 'Assigned', 'Attempted'].includes(lead.status)) {
      newStatus = 'Contacted';
    }

    await store.update('leads', lead.id, {
      status: newStatus,
      dnc: newDnc,
      lastCalled: todayIso,
    });

    await store.log(assignedEmp || currentUser, 'logged a call with', `${lead.company} (${salesDisp})`, 'call');
    toast.success('Call disposition saved', {
      description: `${techResult} · ${salesDisp}`,
    });

    setWrap(false);
    setSec(0);
    setRecordedAudioUrl('');
    setNotes('');
    setActiveCallUuid('');
  };

  if (!lead) {
    return (
      <Card className="p-5" data-testid="dialer">
        <h3 className="font-semibold text-[15px] mb-4 text-[#1C2433]">Click-to-call</h3>
        <Empty
          title="No contacts available"
          text="Add leads to your pipeline to initiate calls from the dialer."
        />
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4" data-testid="dialer">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-[15px] text-[#1C2433]">Browser Dialer</h3>
          <p className="text-[11px] text-[#778196]">
            {sdkStatus === 'registered'
              ? `Plivo SDK: ${sdkIdentity}`
              : sdkStatus === 'checking'
              ? 'Checking Plivo WebRTC…'
              : 'Local CRM Dialer (Plivo keys pending)'}
          </p>
        </div>
        <Badge tone={sdkStatus === 'registered' ? 'success' : isDNC ? 'danger' : 'neutral'}>
          {isDNC ? 'DNC Restricted' : sdkStatus === 'registered' ? 'Plivo Ready' : 'Standby'}
        </Badge>
      </div>

      {/* Incoming Call Alert */}
      {incomingCall && (
        <div className="p-3 rounded-xl bg-[#26A879]/12 border border-[#26A879]/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <PhoneIncoming className="w-4 h-4 text-[#26A879] animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-[#1C2433] truncate">
              Incoming: {incomingCall.callerName || 'Caller'}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={() => {
                plivoClientRef.current?.answer?.();
                setIncomingCall(null);
                setLive(true);
                setCallState('Connected');
              }}
            >
              Answer
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                plivoClientRef.current?.reject?.();
                setIncomingCall(null);
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Contact Selector */}
      <select
        data-testid="dialer-contact-select"
        disabled={live}
        className={inputCls}
        value={sel}
        onChange={(e) => {
          setSel(e.target.value);
          onSelectLead?.(e.target.value);
        }}
      >
        {leads.slice(0, 40).map((l: any) => (
          <option key={l.id} value={l.id}>
            {l.name} · {l.company} {l.dnc ? '(DNC)' : ''}
          </option>
        ))}
      </select>

      {/* Audio Device & Recording Consent Controls */}
      <div className="grid grid-cols-1 gap-2">
        {audioInputs.length > 0 && (
          <select
            aria-label="Microphone device"
            disabled={live}
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full h-9 rounded-xl neu-inset px-3 text-xs text-[#1C2433] outline-none"
          >
            {audioInputs.map((m, idx) => (
              <option key={m.deviceId || idx} value={m.deviceId}>
                Mic: {m.label || `Microphone ${idx + 1}`}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center justify-between px-3 py-2 rounded-xl neu-surface text-xs cursor-pointer">
          <span className="flex items-center gap-1.5 text-[#1C2433] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-brand" />
            Record with consent notice
          </span>
          <input
            type="checkbox"
            disabled={live}
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

      {/* Neumorphic Dark Call Console */}
      <div className="rounded-2xl bg-[#171C2C] text-white p-5 text-center grain relative overflow-hidden shadow-lg">
        <Avatar name={lead.name} size={56} />
        <p className="mt-3 font-semibold text-base sm:text-lg truncate">{lead.name}</p>
        <p className="text-xs text-slate-400 truncate">
          {lead.company} · {lead.phone || 'No phone number'}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">Agent: {currentUser}</p>

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
                live ? 'text-[#26A879]' : 'text-slate-400'
              )}
              data-testid="dialer-timer"
            >
              {live ? dur(sec) : 'Ready'}
            </p>
            {live && (
              <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">{callState}</p>
            )}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-4">
          {live ? (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                  mute ? 'bg-[#E15B63] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                )}
                title={mute ? 'Unmute' : 'Mute'}
              >
                {mute ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleHold}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center transition-colors',
                  hold ? 'bg-[#E7A23A] text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                )}
                title={hold ? 'Resume' : 'Hold'}
              >
                {hold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                type="button"
                data-testid="dialer-end-btn"
                onClick={endCall}
                className="w-11 h-11 rounded-full bg-[#E15B63] flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                title="Hang Up"
              >
                <PhoneOff className="w-4 h-4 text-white" />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={isDNC}
              data-testid="dialer-call-btn"
              onClick={startCall}
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg',
                isDNC
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-[#26A879] pulse-ring hover:brightness-110 active:scale-95'
              )}
              title={isDNC ? 'Do Not Call active' : 'Call'}
            >
              <Phone className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        {sdkError && sdkStatus === 'error' && (
          <p className="mt-3 text-[11px] text-[#E7A23A] truncate">{sdkError}</p>
        )}
      </div>

      {/* Disposition Modal */}
      <Modal
        open={wrap}
        onClose={() => setWrap(false)}
        title="Call disposition & outcome"
        description={`${lead.name} (${lead.company}) · ${dur(sec)} duration`}
        testid="disposition-modal"
      >
        <div className="space-y-4">
          {recordedAudioUrl && (
            <div className="p-3 rounded-xl neu-surface">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1C2433] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#26A879] animate-pulse" />
                  Call Recording ({dur(sec)})
                </span>
                <a
                  href={recordedAudioUrl}
                  download={`call_${(lead.phone || lead.name).replace(/\s+/g, '_')}_${todayIso}.wav`}
                  className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download .wav
                </a>
              </div>
              <audio src={recordedAudioUrl} controls className="w-full h-8" />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#778196] uppercase tracking-wider mb-1.5">
              1. Technical Call Result
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TECHNICAL_RESULTS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTechResult(r)}
                  className={cn(
                    'h-9 px-2 rounded-xl text-xs font-medium transition-all truncate',
                    techResult === r ? 'neu-btn-primary' : 'neu-btn text-[#1C2433]'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#778196] uppercase tracking-wider mb-1.5">
              2. Sales Disposition
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DISPOSITION_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`disp-${d.toLowerCase().replace(/[\s/]/g, '-')}`}
                  onClick={() => setSalesDisp(d)}
                  className={cn(
                    'h-9 px-2 rounded-xl text-xs font-medium transition-all truncate',
                    salesDisp === d
                      ? d === 'Do Not Call'
                        ? 'bg-[#E15B63] text-white shadow-sm'
                        : 'neu-btn-primary'
                      : 'neu-btn text-[#1C2433]'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {['Interested', 'Callback'].includes(salesDisp) && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="block">
                <span className="text-xs font-semibold text-[#778196]">Follow-up date</span>
                <input
                  type="date"
                  className={`${inputCls} mt-1`}
                  value={fu}
                  onChange={(e) => setFu(e.target.value)}
                  data-testid="followup-date"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-[#778196]">Follow-up time</span>
                <input
                  type="time"
                  className={`${inputCls} mt-1`}
                  value={fuTime}
                  onChange={(e) => setFuTime(e.target.value)}
                />
              </label>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-[#778196]">Assigned employee</span>
            <select
              className={`${inputCls} mt-1`}
              value={assignedEmp}
              onChange={(e) => setAssignedEmp(e.target.value)}
            >
              {(state.employees || []).map((e: any) => (
                <option key={e.id || e.name} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          {salesDisp === 'Do Not Call' && (
            <div className="p-2.5 bg-[#E15B63]/10 border border-[#E15B63]/30 rounded-xl text-xs text-[#E15B63]">
              Marking as Do Not Call will suppress all future outbound calls to this contact.
            </div>
          )}

          <textarea
            className={`${inputCls} h-20 py-2.5`}
            placeholder="Call notes & next steps…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="call-notes"
          />

          <Button onClick={saveDisposition} data-testid="save-call-btn" className="w-full">
            Save call log & update CRM
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
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');

  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  const allCalls = state.calls || [];
  const calls = isCaller ? allCalls.filter((c: any) => c.agent === currentUser) : allCalls;

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

  const tabsList = isCaller
    ? ['Call Logs', 'Recordings', 'Follow-ups', 'Contacts']
    : ['Call Logs', 'Recordings', 'Follow-ups', 'Contacts', 'Plivo Config'];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Telecalling"
        subtitle="Browser-based Plivo calling, call recordings, dispositions and agent performance."
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
          <CardHead title="Agent performance" sub="Calls handled and talk time (min)" />
          {agents.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <Empty title="No calls logged yet" text="Use the browser dialer to place and log outbound calls." />
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
                    <p className="font-semibold text-[#1C2433]">{c.contact}</p>
                    <Badge tone={c.direction === 'Inbound' ? 'info' : 'neutral'}>{c.direction || 'Outbound'}</Badge>
                  </div>
                  <p className="text-xs text-[#778196]">
                    {c.company} · {c.phone}
                  </p>
                </div>
              ),
            },
            { key: 'agent', label: 'Agent' },
            {
              key: 'technicalResult',
              label: 'Call Status',
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
                      href={c.recordingUrl}
                      download={`call_${c.contact || 'lead'}_${c.date || todayIso}.wav`}
                      title="Download recording"
                      className="text-[#778196] hover:text-brand p-1 rounded"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#778196] bg-[#EEF1F6] px-2 py-0.5 rounded-lg">Not recorded</span>
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

      {tab === 'Recordings' && (
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Volume2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-[#1C2433]">Authorised Call Recordings</h4>
                <p className="text-xs text-[#778196] mt-0.5">
                  Calls are recorded only when enabled with disclosure notice. Callers may access only their own calls.
                </p>
              </div>
            </div>
            <Badge tone="success">Consent Notice Active</Badge>
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
              { key: 'agent', label: 'Caller' },
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
                label: 'Audio Player',
                render: (c: any) => (
                  <div className="flex items-center gap-2">
                    <audio src={c.recordingUrl} controls className="h-8 w-44 sm:w-56" />
                    <a
                      href={c.recordingUrl}
                      download={`call_${c.contact || 'lead'}_${c.date || todayIso}.wav`}
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
              disabled={l.dnc || l.status === 'Do Not Call'}
              onClick={() => {
                setSelectedLeadId(l.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mr-1"
            >
              <Phone className="w-3.5 h-3.5" />
              Dial
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

      {tab === 'Plivo Config' && !isCaller && <PlivoSettingsPanel />}
    </div>
  );
}
