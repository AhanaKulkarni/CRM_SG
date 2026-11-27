'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Pause,
  Play,
  Minimize2,
  Maximize2,
  X,
  ShieldCheck,
  AlertCircle,
  User,
  Building2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { TECHNICAL_RESULTS } from '@/lib/fields';
import { Avatar, Badge, Button, Modal, cn, inputCls } from './kit';

export interface CallTarget {
  phone: string;
  contactName?: string;
  company?: string;
  leadId?: string;
  customerId?: string;
}

export interface ActiveCallSession {
  callUuid: string;
  direction: 'Outbound' | 'Inbound';
  status: 'Idle' | 'Connecting' | 'Ringing' | 'Connected' | 'On Hold';
  phone: string;
  contactName: string;
  company: string;
  leadId: string;
  customerId: string;
  employeeId: string;
  employeeName: string;
  callerId: string;
  startTime: string;
  endTime: string;
  durationSec: number;
  mute: boolean;
  hold: boolean;
  recordConsent: boolean;
  isLivePlivo: boolean;
}

interface CallContextValue {
  sdkReady: boolean;
  sdkStatus: 'checking' | 'registered' | 'unconfigured' | 'unauthorized' | 'error';
  sdkIdentity: string;
  sdkError: string;
  callerId: string;
  allowedCallerIds: string[];
  setSelectedCallerId: (id: string) => void;
  micPermission: 'granted' | 'denied' | 'prompt';
  audioInputs: MediaDeviceInfo[];
  selectedMic: string;
  setSelectedMic: (id: string) => void;
  requestMicPermission: () => Promise<boolean>;
  activeCall: ActiveCallSession | null;
  incomingCall: { callerName: string; from: string; callUuid?: string } | null;
  dialerOpen: boolean;
  dialerMinimized: boolean;
  openDialer: (target?: Partial<CallTarget>) => void;
  closeDialer: () => void;
  minimizeDialer: () => void;
  restoreDialer: () => void;
  startCall: (target: CallTarget) => Promise<void>;
  answerIncoming: () => void;
  rejectIncoming: () => void;
  hangupCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
}

const CallCtx = createContext<CallContextValue | null>(null);

export const fmtCallDuration = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const DISPOSITION_OPTIONS = [
  'Interested',
  'Callback',
  'Not Interested',
  'No Answer',
  'Converted',
  'Do Not Call',
];

export function CallProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const { state } = store;
  const sessionUser = state.session;

  const plivoClientRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<'checking' | 'registered' | 'unconfigured' | 'unauthorized' | 'error'>('checking');
  const [sdkIdentity, setSdkIdentity] = useState('');
  const [sdkError, setSdkError] = useState('');
  const [callerId, setCallerId] = useState('+912269857438');
  const [allowedCallerIds, setAllowedCallerIds] = useState<string[]>([]);

  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');

  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerMinimized, setDialerMinimized] = useState(false);
  const [manualNumber, setManualNumber] = useState('');
  const [manualTarget, setManualTarget] = useState<Partial<CallTarget>>({});
  const [recordConsent, setRecordConsent] = useState(false);

  const [activeCall, setActiveCall] = useState<ActiveCallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ callerName: string; from: string; callUuid?: string } | null>(null);

  // Post-call disposition modal state
  const [wrapCall, setWrapCall] = useState<ActiveCallSession | null>(null);
  const [techResult, setTechResult] = useState('Answered/Connected');
  const [salesDisp, setSalesDisp] = useState('Interested');
  const [fuDate, setFuDate] = useState(new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10));
  const [fuTime, setFuTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  const activeCallRef = useRef<ActiveCallSession | null>(null);
  activeCallRef.current = activeCall;

  // Check & enumerate microphone devices
  const refreshAudioDevices = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const mics = devs.filter((d) => d.kind === 'audioinput');
      setAudioInputs(mics);
      if (mics[0]?.deviceId && !selectedMic) {
        setSelectedMic(mics[0].deviceId);
      }
      if (mics.some((m) => Boolean(m.label))) {
        setMicPermission('granted');
      }
    } catch {
      // ignore
    }
  };

  const requestMicPermission = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission('granted');
      await refreshAudioDevices();
      toast.success('Microphone access granted');
      return true;
    } catch {
      setMicPermission('denied');
      toast.error('Microphone permission denied', {
        description: 'Please allow microphone access in your browser site settings.',
      });
      return false;
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRecordConsent(localStorage.getItem('aetherx_plivo_recording') === 'true');
      refreshAudioDevices();
    }
  }, []);

  // Initialize employee-specific Plivo Browser SDK session
  useEffect(() => {
    if (!sessionUser?.id) return;
    let mounted = true;

    async function initSdk() {
      setSdkStatus('checking');
      setSdkError('');
      try {
        const res = await fetch('/api/plivo/token', { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 || data?.authorized === false) {
          if (mounted) {
            setSdkReady(false);
            setSdkStatus('unauthorized');
            setCallerId('Not Assigned');
            setSdkError(data?.error || 'No Plivo number assigned to your account.');
          }
          return;
        }
        if (!res.ok || !data.configured || !data.token) {
          if (mounted) {
            setSdkStatus(data?.configured === false ? 'unconfigured' : 'error');
            setSdkError(data?.error || `Token request failed (${res.status})`);
          }
          return;
        }

        if (Array.isArray(data.allowedCallerIds)) {
          setAllowedCallerIds(data.allowedCallerIds);
        }
        if (data.callerId) {
          setCallerId(data.callerId);
        }

        const PlivoMod: any = await import('plivo-browser-sdk');
        const Plivo: any =
          (typeof PlivoMod === 'function' && PlivoMod) ||
          (typeof PlivoMod?.default === 'function' && PlivoMod.default) ||
          (typeof PlivoMod?.default?.default === 'function' && PlivoMod.default.default) ||
          (typeof window !== 'undefined' && (window as any).Plivo);

        if (typeof Plivo !== 'function') {
          throw new Error('Plivo Browser SDK constructor could not be resolved.');
        }
        if (!mounted) return;

        const plivoBrowser = new Plivo({
          debug: 'ERROR',
          permOnClick: true,
          enableTracking: true,
          closeProtection: true,
          enableNoiseReduction: false,
        });

        const client = plivoBrowser.client;
        plivoClientRef.current = client;

        // Remove stale listeners if window._PlivoInstance was reused
        client.removeAllListeners?.('onLogin');
        client.removeAllListeners?.('onLoginFailed');
        client.removeAllListeners?.('onWebrtcNotSupported');
        client.removeAllListeners?.('onPermissionDenied');
        client.removeAllListeners?.('onCallRemoteRinging');
        client.removeAllListeners?.('onCallAnswered');
        client.removeAllListeners?.('onCallTerminated');
        client.removeAllListeners?.('onCallFailed');
        client.removeAllListeners?.('onIncomingCall');

        client.on('onLogin', () => {
          if (!mounted) return;
          setSdkReady(true);
          setSdkStatus('registered');
          setSdkIdentity(data.username);
          setSdkError('');
        });

        client.on('onLoginFailed', (reason: any) => {
          if (!mounted) return;
          setSdkReady(false);
          setSdkStatus('error');
          setSdkError(String(reason || 'Plivo endpoint registration failed'));
        });

        client.on('onWebrtcNotSupported', () => {
          if (!mounted) return;
          setSdkReady(false);
          setSdkStatus('error');
          setSdkError('WebRTC is not supported in this browser.');
        });

        client.on('onPermissionDenied', (reason: any) => {
          if (!mounted) return;
          const msg = String(reason || 'Permission denied');
          setSdkError(msg);
          toast.error('Plivo permission denied', { description: msg });
        });

        client.on('onCallRemoteRinging', () => {
          if (!mounted) return;
          setActiveCall((c) => (c ? { ...c, status: 'Ringing' } : c));
        });

        client.on('onCallAnswered', (callInfo: any) => {
          if (!mounted) return;
          setActiveCall((c) =>
            c
              ? {
                  ...c,
                  status: 'Connected',
                  callUuid: callInfo?.callUUID || c.callUuid,
                }
              : c
          );
        });

        client.on('onCallTerminated', () => {
          if (!mounted) return;
          const finished = activeCallRef.current;
          setActiveCall(null);
          if (finished) {
            setWrapCall({
              ...finished,
              endTime: new Date().toISOString(),
            });
          }
        });

        client.on('onCallFailed', (reason: any) => {
          if (!mounted) return;
          const failed = activeCallRef.current;
          setActiveCall(null);
          toast.error('Call failed', { description: String(reason || 'Could not connect call') });
          if (failed) {
            setTechResult('Failed');
            setSalesDisp('No Answer');
            setWrapCall({
              ...failed,
              endTime: new Date().toISOString(),
            });
          }
        });

        client.on('onIncomingCall', (callerName: string, extraInfo: any) => {
          if (!mounted) return;
          setIncomingCall({
            callerName: callerName || 'Incoming Caller',
            from: extraInfo?.from || callerName || '',
            callUuid: extraInfo?.callUUID,
          });
          setDialerOpen(true);
          setDialerMinimized(false);
          toast('Incoming Plivo call', { description: `From ${callerName || 'Customer'}` });
        });

        if (client.isRegistered?.()) {
          setSdkReady(true);
          setSdkStatus('registered');
          setSdkIdentity(data.username);
          setSdkError('');
        } else {
          const initiated = client.loginWithAccessToken(data.token);
          if (initiated === false && mounted) {
            setSdkReady(false);
            setSdkStatus('error');
            setSdkError('Plivo SDK rejected AccessToken format.');
          }
        }
      } catch (err: any) {
        if (mounted) {
          setSdkReady(false);
          setSdkStatus('error');
          setSdkError(err?.message || 'Plivo Browser SDK initialization failed');
        }
      }
    }

    initSdk();

    return () => {
      mounted = false;
      try {
        plivoClientRef.current?.logout?.();
      } catch {
        // ignore
      }
    };
  }, [sessionUser?.id]);

  // Live call timer
  useEffect(() => {
    if (!activeCall || activeCall.status === 'Idle') return undefined;
    const t = setInterval(() => {
      setActiveCall((c) => (c ? { ...c, durationSec: c.durationSec + 1 } : c));
    }, 1000);
    return () => clearInterval(t);
  }, [Boolean(activeCall)]);

  const openDialer = (target?: Partial<CallTarget>) => {
    if (target?.phone) setManualNumber(target.phone);
    if (target) setManualTarget(target);
    setDialerOpen(true);
    setDialerMinimized(false);
  };

  const closeDialer = () => {
    if (activeCall) {
      setDialerMinimized(true);
    } else {
      setDialerOpen(false);
    }
  };

  const minimizeDialer = () => setDialerMinimized(true);
  const restoreDialer = () => {
    setDialerOpen(true);
    setDialerMinimized(false);
  };

  const startCall = async (target: CallTarget) => {
    const cleanPhone = (target.phone || '').trim();
    if (!cleanPhone) {
      toast.error('Please enter a valid phone number');
      return;
    }

    if (activeCall) {
      toast.error('You already have an active call in progress');
      return;
    }

    // Check microphone before placing call
    if (micPermission === 'denied') {
      const ok = await requestMicPermission();
      if (!ok) return;
    }

    if (!sdkReady || !plivoClientRef.current) {
      setDialerOpen(true);
      setDialerMinimized(false);
      setManualNumber(cleanPhone);
      setManualTarget(target);
      const description =
        sdkStatus === 'checking'
          ? 'Plivo WebRTC is still registering. Please wait a moment and try again.'
          : sdkStatus === 'unauthorized'
          ? sdkError || 'No Plivo calling number is authorized for your account.'
          : sdkStatus === 'error'
          ? sdkError || 'Plivo Browser SDK registration failed.'
          : sdkError || 'Configure PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, and PLIVO_APPLICATION_ID on the server to place live calls.';
      toast.error('Plivo Browser SDK is not connected', { description });
      return;
    }

    try {
      if (selectedMic && plivoClientRef.current.audio?.microphoneDevices) {
        plivoClientRef.current.audio.microphoneDevices.set(selectedMic);
      }

      const session: ActiveCallSession = {
        callUuid: `plivo-${Date.now()}`,
        direction: 'Outbound',
        status: 'Connecting',
        phone: cleanPhone,
        contactName: target.contactName || cleanPhone,
        company: target.company || 'Direct Dial',
        leadId: target.leadId || '',
        customerId: target.customerId || '',
        employeeId: sessionUser?.id || '',
        employeeName: sessionUser?.name || 'Agent',
        callerId,
        startTime: new Date().toISOString(),
        endTime: '',
        durationSec: 0,
        mute: false,
        hold: false,
        recordConsent,
        isLivePlivo: true,
      };

      setActiveCall(session);
      setDialerOpen(true);
      setDialerMinimized(false);

      plivoClientRef.current.call(cleanPhone.replace(/\s+/g, ''), {
        'X-PH-Agent': sessionUser?.name || 'Agent',
        'X-PH-EmployeeId': sessionUser?.id || '',
        'X-PH-CallerId': callerId,
        'X-PH-LeadId': target.leadId || '',
        'X-PH-CustomerId': target.customerId || '',
        'X-PH-Record': recordConsent ? 'true' : 'false',
      });

      toast(`Calling ${session.contactName} via Plivo…`, {
        description: `Caller ID: ${callerId}${recordConsent ? ' · Recording consent active' : ''}`,
      });
    } catch (err: any) {
      setActiveCall(null);
      toast.error('Failed to initiate Plivo call', { description: err?.message || 'Unknown error' });
    }
  };

  const answerIncoming = () => {
    if (!incomingCall || !plivoClientRef.current) return;
    try {
      plivoClientRef.current.answer();
      setActiveCall({
        callUuid: incomingCall.callUuid || `plivo-in-${Date.now()}`,
        direction: 'Inbound',
        status: 'Connected',
        phone: incomingCall.from,
        contactName: incomingCall.callerName,
        company: 'Inbound Call',
        leadId: '',
        customerId: '',
        employeeId: sessionUser?.id || '',
        employeeName: sessionUser?.name || 'Agent',
        callerId,
        startTime: new Date().toISOString(),
        endTime: '',
        durationSec: 0,
        mute: false,
        hold: false,
        recordConsent,
        isLivePlivo: true,
      });
      setIncomingCall(null);
    } catch {
      toast.error('Unable to answer incoming call');
    }
  };

  const rejectIncoming = () => {
    try {
      plivoClientRef.current?.reject?.();
    } catch {
      // ignore
    }
    setIncomingCall(null);
  };

  const hangupCall = () => {
    const current = activeCallRef.current;
    try {
      plivoClientRef.current?.hangup?.();
    } catch {
      // ignore
    }
    setActiveCall(null);
    if (current) {
      setWrapCall({
        ...current,
        endTime: new Date().toISOString(),
      });
    }
  };

  const toggleMute = () => {
    setActiveCall((c) => {
      if (!c) return c;
      const next = !c.mute;
      try {
        if (next) plivoClientRef.current?.mute?.();
        else plivoClientRef.current?.unmute?.();
      } catch {
        // ignore
      }
      return { ...c, mute: next };
    });
  };

  const toggleHold = () => {
    setActiveCall((c) => {
      if (!c) return c;
      const next = !c.hold;
      try {
        if (next && plivoClientRef.current?.hold) plivoClientRef.current.hold();
        else if (!next && plivoClientRef.current?.unhold) plivoClientRef.current.unhold();
      } catch {
        // ignore
      }
      return { ...c, hold: next, status: next ? 'On Hold' : 'Connected' };
    });
  };

  const saveDisposition = async () => {
    if (!wrapCall) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const normalizedDisp = salesDisp === 'Callback' ? 'Call Back Required' : salesDisp;

    // Check if Plivo webhook already created the call record by providerCallId
    const existing = (state.calls || []).find((c: any) => c.providerCallId === wrapCall.callUuid);
    if (existing) {
      await store.update('calls', existing.id, {
        technicalResult: techResult,
        disposition: normalizedDisp,
        duration: Math.max(wrapCall.durationSec, existing.duration || 1),
        endTime: wrapCall.endTime || new Date().toISOString(),
        followUp: ['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? fuDate : '',
        followUpTime: fuTime,
        notes,
      });
    } else {
      await store.add('calls', {
        providerCallId: wrapCall.callUuid,
        provider: 'plivo',
        employeeId: wrapCall.employeeId,
        leadId: wrapCall.leadId,
        customerId: wrapCall.customerId,
        callerId: wrapCall.callerId,
        contact: wrapCall.contactName,
        company: wrapCall.company,
        phone: wrapCall.phone,
        agent: wrapCall.employeeName,
        direction: wrapCall.direction,
        technicalResult: techResult,
        disposition: normalizedDisp,
        duration: Math.max(wrapCall.durationSec, 1),
        startTime: wrapCall.startTime,
        endTime: wrapCall.endTime || new Date().toISOString(),
        date: todayIso,
        followUp: ['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp) ? fuDate : '',
        followUpTime: fuTime,
        recordingUrl: '',
        notes,
      });
    }

    if (['Interested', 'Callback', 'Call Back Required', 'Follow-up Scheduled'].includes(salesDisp)) {
      await store.add('reminders', {
        title: `Follow-up call with ${wrapCall.contactName} (${wrapCall.company})`,
        type: 'Follow-up',
        due: fuDate,
        time: fuTime || '11:00',
        owner: wrapCall.employeeName,
        done: false,
        auto: true,
        related: wrapCall.company,
      });
    }

    if (wrapCall.leadId) {
      const lead = (state.leads || []).find((l: any) => l.id === wrapCall.leadId);
      if (lead) {
        let newStatus = lead.status;
        if (salesDisp === 'Do Not Call') newStatus = 'Do Not Call';
        else if (salesDisp === 'Converted') newStatus = 'Converted';
        else if (salesDisp === 'Interested') newStatus = 'Interested';
        else if (salesDisp === 'Callback') newStatus = 'Follow-up Scheduled';
        else if (salesDisp === 'Not Interested') newStatus = 'Not Interested';
        await store.update('leads', lead.id, {
          status: newStatus,
          dnc: salesDisp === 'Do Not Call' ? true : lead.dnc,
          lastCalled: todayIso,
        });
      }
    }

    if (wrapCall.customerId) {
      await store.update('customers', wrapCall.customerId, {
        lastContact: todayIso,
      });
    }

    await store.log(wrapCall.employeeName, 'completed call with', `${wrapCall.contactName} (${salesDisp})`, 'call');
    toast.success('Call disposition saved');
    setWrapCall(null);
    setNotes('');
  };

  const value: CallContextValue = {
    sdkReady,
    sdkStatus,
    sdkIdentity,
    sdkError,
    callerId,
    allowedCallerIds,
    setSelectedCallerId: (id: string) => setCallerId(id),
    micPermission,
    audioInputs,
    selectedMic,
    setSelectedMic,
    requestMicPermission,
    activeCall,
    incomingCall,
    dialerOpen,
    dialerMinimized,
    openDialer,
    closeDialer,
    minimizeDialer,
    restoreDialer,
    startCall,
    answerIncoming,
    rejectIncoming,
    hangupCall,
    toggleMute,
    toggleHold,
  };

  return (
    <CallCtx.Provider value={value}>
      {children}

      {/* Minimised Floating Call Bar (persists while navigating CRM) */}
      <AnimatePresence>
        {(dialerMinimized && (activeCall || dialerOpen)) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-20 lg:bottom-6 left-4 lg:left-[284px] z-40 bg-[#171C2C] text-white rounded-2xl shadow-2xl border border-white/10 px-4 py-2.5 flex items-center gap-3 max-w-[calc(100vw-32px)]"
          >
            <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', activeCall ? 'bg-[#26A879] animate-pulse' : 'bg-slate-400')} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{activeCall ? activeCall.contactName : 'Plivo Dialer'}</p>
              <p className="text-[11px] text-slate-400 tabular-nums">
                {activeCall ? `${activeCall.status} · ${fmtCallDuration(activeCall.durationSec)}` : callerId}
              </p>
            </div>
            {activeCall && (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={cn('p-1.5 rounded-lg', activeCall.mute ? 'bg-[#E15B63]' : 'bg-white/10 hover:bg-white/20')}
                  title="Mute"
                >
                  {activeCall.mute ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={hangupCall}
                  className="p-1.5 rounded-lg bg-[#E15B63] hover:bg-red-600"
                  title="Hang Up"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={restoreDialer}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20"
              title="Expand dialer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Persistent Floating Dialer */}
      <AnimatePresence>
        {dialerOpen && !dialerMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 lg:bottom-6 left-4 lg:left-[284px] z-40 w-[calc(100vw-32px)] sm:w-[360px] rounded-2xl bg-[#F5F6FA] border border-white/80 shadow-2xl overflow-hidden"
          >
            <div className="h-12 px-4 bg-[#171C2C] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Phone className="w-4 h-4 text-[#8B83F6] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">AetherX Voice · {callerId}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {sdkReady ? `Registered: ${sdkIdentity}` : 'Plivo credentials required'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={minimizeDialer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  title="Minimise"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={closeDialer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {incomingCall && (
                <div className="p-3 rounded-xl bg-[#26A879]/12 border border-[#26A879]/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <PhoneIncoming className="w-4 h-4 text-[#26A879] animate-pulse shrink-0" />
                    <span className="text-xs font-semibold text-[#1C2433] truncate">{incomingCall.callerName}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={answerIncoming}>Answer</Button>
                    <Button size="sm" variant="danger" onClick={rejectIncoming}>Reject</Button>
                  </div>
                </div>
              )}

              {activeCall ? (
                <div className="rounded-2xl bg-[#171C2C] text-white p-4 text-center space-y-2">
                  <Avatar name={activeCall.contactName} size={48} />
                  <p className="font-semibold text-base truncate">{activeCall.contactName}</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="truncate">{activeCall.company} · {activeCall.phone}</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-[#26A879] tabular-nums">
                    {fmtCallDuration(activeCall.durationSec)}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">{activeCall.status}</p>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className={cn('w-10 h-10 rounded-full flex items-center justify-center', activeCall.mute ? 'bg-[#E15B63]' : 'bg-white/10 hover:bg-white/20')}
                      title={activeCall.mute ? 'Unmute' : 'Mute'}
                    >
                      {activeCall.mute ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleHold}
                      className={cn('w-10 h-10 rounded-full flex items-center justify-center', activeCall.hold ? 'bg-[#E7A23A]' : 'bg-white/10 hover:bg-white/20')}
                      title={activeCall.hold ? 'Resume' : 'Hold'}
                    >
                      {activeCall.hold ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={hangupCall}
                      className="w-10 h-10 rounded-full bg-[#E15B63] hover:bg-red-600 flex items-center justify-center"
                      title="Hang Up"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {manualTarget.contactName && (
                    <div className="p-2.5 rounded-xl neu-surface flex items-center gap-2.5">
                      <User className="w-4 h-4 text-brand shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#1C2433] truncate">{manualTarget.contactName}</p>
                        <p className="text-[11px] text-[#778196] truncate">{manualTarget.company || 'CRM Contact'}</p>
                      </div>
                    </div>
                  )}

                  <input
                    type="tel"
                    value={manualNumber}
                    onChange={(e) => setManualNumber(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className={inputCls}
                  />

                  {allowedCallerIds.length > 1 && (
                    <select
                      aria-label="Outbound Caller ID"
                      value={callerId}
                      onChange={(e) => setCallerId(e.target.value)}
                      className="w-full h-9 rounded-xl neu-inset px-3 text-xs text-[#1C2433] outline-none"
                    >
                      {allowedCallerIds.map((num) => (
                        <option key={num} value={num}>
                          Caller ID: {num}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setManualNumber((p) => p + d)}
                        className="h-9 rounded-xl neu-btn text-sm font-semibold text-[#1C2433]"
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <label className="flex items-center gap-1.5 text-[#1C2433] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recordConsent}
                        onChange={(e) => {
                          setRecordConsent(e.target.checked);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('aetherx_plivo_recording', String(e.target.checked));
                          }
                        }}
                        className="accent-[#6965ED]"
                      />
                      <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                      Record with consent
                    </label>
                    {micPermission !== 'granted' && (
                      <button type="button" onClick={requestMicPermission} className="text-brand font-semibold hover:underline">
                        Allow Mic
                      </button>
                    )}
                  </div>

                  {!sdkReady && (
                    <div className="p-2.5 rounded-xl bg-[#E7A23A]/12 border border-[#E7A23A]/30 text-[11px] text-[#8a5d14] flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        {sdkStatus === 'checking'
                          ? 'Connecting to Plivo WebRTC gateway…'
                          : sdkStatus === 'unauthorized'
                          ? sdkError || 'No Plivo calling number authorized for this account.'
                          : sdkStatus === 'error'
                          ? `Plivo SDK Error: ${sdkError || 'Registration failed'}`
                          : sdkError || 'Live calling requires Plivo server env vars. Configure in Telecalling → Plivo Config.'}
                      </span>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={!manualNumber.trim()}
                    onClick={() =>
                      startCall({
                        phone: manualNumber,
                        contactName: manualTarget.contactName || manualNumber,
                        company: manualTarget.company || 'Manual Dial',
                        leadId: manualTarget.leadId,
                        customerId: manualTarget.customerId,
                      })
                    }
                  >
                    <Phone className="w-4 h-4" />
                    Call via Plivo ({callerId})
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-Call Disposition Modal */}
      <Modal
        open={Boolean(wrapCall)}
        onClose={() => setWrapCall(null)}
        title="Call disposition & outcome"
        description={
          wrapCall
            ? `${wrapCall.contactName} (${wrapCall.company}) · ${fmtCallDuration(wrapCall.durationSec)}`
            : ''
        }
        testid="global-disposition-modal"
      >
        <div className="space-y-4">
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
                    'h-9 px-2 rounded-xl text-xs font-medium truncate',
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
                  onClick={() => setSalesDisp(d)}
                  className={cn(
                    'h-9 px-2 rounded-xl text-xs font-medium truncate',
                    salesDisp === d
                      ? d === 'Do Not Call'
                        ? 'bg-[#E15B63] text-white'
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
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-semibold text-[#778196]">Follow-up date</span>
                <input
                  type="date"
                  className={`${inputCls} mt-1`}
                  value={fuDate}
                  onChange={(e) => setFuDate(e.target.value)}
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

          <textarea
            className={`${inputCls} h-20 py-2.5`}
            placeholder="Call notes & next steps…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button onClick={saveDisposition} className="w-full">
            Save call log & update CRM
          </Button>
        </div>
      </Modal>
    </CallCtx.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallCtx);
  if (!ctx) throw new Error('useCall must be used inside CallProvider');
  return ctx;
}
