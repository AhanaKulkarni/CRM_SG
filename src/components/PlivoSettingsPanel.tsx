'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Copy,
  Globe,
  Server,
  Mic,
  Webhook,
  Lock,
} from 'lucide-react';
import { Card, CardHead, Badge, Button, Toggle, cn } from './kit';

interface PlivoStatusResponse {
  connected?: boolean;
  error?: string | null;
  envStatus?: {
    configured: boolean;
    hasAuthId: boolean;
    hasAuthToken: boolean;
    hasAppId: boolean;
    hasPhoneNumber: boolean;
    hasWebhookSecret: boolean;
    authIdMasked: string;
    applicationId: string;
    phoneNumber: string;
  };
  account?: {
    name: string;
    accountType: string;
    cashCredits: string;
    timezone: string;
  } | null;
  application?: {
    appId: string;
    appName: string;
    answerUrl: string;
    hangupUrl: string;
    enabled: boolean;
  } | null;
  appError?: string | null;
  number?: {
    number: string;
    type: string;
    voiceEnabled: boolean;
    country: string;
    region: string;
  } | null;
  numberError?: string | null;
  endpoints?: Array<{ username: string; alias: string; endpointId: string }>;
  compliance?: {
    indiaRegion: boolean;
    kycVerified: boolean;
    numberVerified: boolean;
    appVerified: boolean;
    webhookVerified: boolean;
  };
}

export function PlivoSettingsPanel() {
  const [status, setStatus] = useState<PlivoStatusResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setRecordingEnabled(localStorage.getItem('aetherx_plivo_recording') === 'true');
    }
    fetch('/api/plivo/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStatus(d);
      })
      .catch(() => {});
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/plivo/status', { method: 'POST' });
      const data: PlivoStatusResponse = await res.json();
      setStatus(data);
      if (data.connected) {
        toast.success('Plivo connection verified', {
          description: `Connected to ${data.account?.name || 'Plivo Account'}`,
        });
      } else {
        toast.error('Plivo verification failed', {
          description: data.error || 'Please check server environment variables.',
        });
      }
    } catch {
      toast.error('Network error while testing Plivo connection');
    } finally {
      setTesting(false);
    }
  };

  const toggleRecording = (val: boolean) => {
    setRecordingEnabled(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aetherx_plivo_recording', String(val));
    }
    toast.success(val ? 'Call recording enabled with consent notice' : 'Call recording disabled');
  };

  const copyUrl = (path: string) => {
    const full = `${origin}${path}`;
    navigator.clipboard?.writeText(full);
    toast.success('Copied webhook URL', { description: full });
  };

  const env = status?.envStatus;
  const isConnected = Boolean(status?.connected);
  const comp = status?.compliance;

  const statusRows = [
    {
      label: 'Account Connection',
      ok: isConnected,
      detail: isConnected
        ? `${status?.account?.name} (${env?.authIdMasked})`
        : status?.error || 'Not verified — click Test Connection',
      icon: Server,
    },
    {
      label: 'India Data Region',
      ok: Boolean(comp?.indiaRegion),
      detail: comp?.indiaRegion ? 'India route / IST timezone active' : 'Confirm India region & media anchoring with Plivo',
      icon: Globe,
    },
    {
      label: 'KYC & Account Status',
      ok: Boolean(comp?.kycVerified),
      detail: comp?.kycVerified ? 'Standard verified account' : 'Complete Plivo India KYC before production calling',
      icon: ShieldCheck,
    },
    {
      label: 'Approved Number Status',
      ok: Boolean(comp?.numberVerified),
      detail: status?.number
        ? `${status.number.number} (${status.number.type}, Voice ${status.number.voiceEnabled ? 'Enabled' : 'Disabled'})`
        : status?.numberError || env?.phoneNumber || 'Not configured',
      icon: PhoneCall,
    },
    {
      label: 'Voice Application',
      ok: Boolean(comp?.appVerified),
      detail: status?.application
        ? `${status.application.appName} (${status.application.appId})`
        : status?.appError || env?.applicationId || 'Not configured',
      icon: Mic,
    },
    {
      label: 'Browser SDK Endpoints',
      ok: Boolean(isConnected && env?.hasAuthId),
      detail: isConnected
        ? `${status?.endpoints?.length || 0} SIP endpoints + JWT AccessToken ready for 4 AetherX users`
        : 'Requires verified Plivo connection',
      icon: Lock,
    },
    {
      label: 'Webhook Signing Secret',
      ok: Boolean(env?.hasWebhookSecret || env?.hasAuthToken),
      detail: env?.hasWebhookSecret
        ? 'PLIVO_PUBLIC_WEBHOOK_SECRET configured on server'
        : env?.hasAuthToken
        ? 'Using PLIVO_AUTH_TOKEN signature fallback'
        : 'Missing PLIVO_PUBLIC_WEBHOOK_SECRET',
      icon: Webhook,
    },
  ];

  const webhooks = [
    ['Answer XML', '/api/plivo/webhooks/answer'],
    ['Ring Callback', '/api/plivo/webhooks/ring'],
    ['Hangup Callback', '/api/plivo/webhooks/hangup'],
    ['Recording Callback', '/api/plivo/webhooks/recording'],
    ['Inbound Route XML', '/api/plivo/webhooks/inbound'],
  ];

  return (
    <div className="space-y-4" data-testid="plivo-settings-panel">
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-2xl neu-btn-primary flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-[#1C2433]">Plivo India Telephony</h3>
                <Badge tone={isConnected ? 'success' : 'warning'}>
                  {isConnected ? 'Connected' : 'Verification Required'}
                </Badge>
              </div>
              <p className="text-xs text-[#778196] mt-1">
                Server-authenticated Browser SDK calling, India compliance verification & signed webhooks.
              </p>
            </div>
          </div>
          <Button onClick={testConnection} loading={testing} data-testid="plivo-test-btn">
            <RefreshCw className={cn('w-4 h-4', testing && 'animate-spin')} />
            Test Connection
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {statusRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="p-3.5 rounded-xl neu-surface flex items-start gap-3">
                <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', row.ok ? 'text-[#26A879]' : 'text-[#E7A23A]')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#1C2433]">{row.label}</span>
                    {row.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#26A879] shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#E7A23A] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#778196] mt-1 break-words">{row.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* India Calling Compliance */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E7A23A] shrink-0" />
            <h4 className="text-sm font-semibold text-[#1C2433]">India-Specific Calling Compliance</h4>
          </div>
          <p className="text-xs text-[#778196] leading-relaxed">
            Indian outbound calling is regulated by TRAI / DoT. Before enabling live customer calls, verify the following with Plivo Support:
          </p>
          <ul className="space-y-2 text-xs text-[#1C2433]">
            <li className="p-2.5 rounded-xl neu-surface flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <span>
                <strong>Calling Purpose & DLT/KYC:</strong> Separate Promotional vs Service/Transactional routes; register entity KYC & approved templates.
              </span>
            </li>
            <li className="p-2.5 rounded-xl neu-surface flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <span>
                <strong>Number Series & Caller ID:</strong> Confirm approved Indian DID/toll-free series supports outbound PSTN Caller ID & Browser SDK media anchoring.
              </span>
            </li>
          </ul>

          <div className="pt-3 border-t border-[#E1E5ED] flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1C2433]">Optional Call Recording (with Notice)</p>
              <p className="text-xs text-[#778196]">
                Plays an automated en-IN recording disclosure before bridging. Calls are never recorded silently.
              </p>
            </div>
            <Toggle checked={recordingEnabled} onChange={toggleRecording} testid="plivo-recording-toggle" />
          </div>
        </Card>

        {/* Webhook Endpoints & Server Env Vars */}
        <Card className="p-5 space-y-4">
          <CardHead title="Plivo Webhook Endpoints" sub="Configure these in your Plivo Voice Application" />
          <div className="space-y-2 px-1">
            {webhooks.map(([label, path]) => (
              <div key={path} className="flex items-center justify-between gap-2 p-2.5 rounded-xl neu-surface text-xs">
                <div className="min-w-0">
                  <span className="font-semibold text-[#1C2433] block">{label}</span>
                  <code className="text-[11px] text-[#778196] truncate block">{path}</code>
                </div>
                <Button size="sm" variant="secondary" onClick={() => copyUrl(path)}>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </Button>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl neu-inset text-[11px] text-[#778196]">
            Server Environment Variables (read strictly on server):{' '}
            <code className="text-[#1C2433] font-medium">
              PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, PLIVO_APPLICATION_ID, PLIVO_PHONE_NUMBER, PLIVO_PUBLIC_WEBHOOK_SECRET
            </code>
          </div>
        </Card>
      </div>
    </div>
  );
}
