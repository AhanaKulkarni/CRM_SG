import { NextResponse } from 'next/server';
import * as plivo from 'plivo';
import { crmDb } from '@/db';
import { getPlivoEnv, validatePlivoWebhookSignature } from './plivo';

export async function parsePlivoWebhook(req: Request) {
  const params: Record<string, string> = {};
  const url = new URL(req.url);
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  if (req.method === 'POST') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await req.json().catch(() => ({}));
      Object.entries(json || {}).forEach(([k, v]) => {
        params[k] = String(v ?? '');
      });
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((v, k) => {
          params[k] = v.toString();
        });
      }
    }
  }

  const sigCheck = validatePlivoWebhookSignature(req.url, req.method, req.headers, params);
  return { params, sigCheck, baseUrl: `${url.protocol}//${url.host}` };
}

export function xmlResponse(xmlString: string, status = 200) {
  return new NextResponse(xmlString, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export function mapPlivoStatus(rawStatus = '', hangupCause = ''): string {
  const s = `${rawStatus} ${hangupCause}`.toLowerCase();
  if (s.includes('busy')) return 'Busy';
  if (s.includes('no_answer') || s.includes('no-answer') || s.includes('timeout')) return 'No Answer';
  if (s.includes('reject') || s.includes('cancel') || s.includes('decline')) return 'Rejected';
  if (s.includes('fail') || s.includes('error') || s.includes('unallocated')) return 'Failed';
  if (s.includes('answer') || s.includes('complete') || s.includes('normal_clearing') || s.includes('in-progress')) {
    return 'Answered/Connected';
  }
  return 'Unavailable';
}

export function normPhone(p: string) {
  return (p || '').replace(/\D/g, '').slice(-10);
}

export function upsertPlivoCallRecord(opts: {
  callUuid: string;
  from?: string;
  to?: string;
  direction?: 'Outbound' | 'Inbound';
  technicalResult?: string;
  duration?: number;
  recordingUrl?: string;
  recordingDuration?: number;
  agentHint?: string;
  eventNote?: string;
}) {
  const existingCalls = crmDb.get('callLogs') || [];
  const existing = existingCalls.find((c: any) => c.providerCallId === opts.callUuid);
  const todayIso = new Date().toISOString().slice(0, 10);

  const targetPhone = opts.direction === 'Inbound' ? opts.from || '' : opts.to || '';
  const digits = normPhone(targetPhone);
  const leads = crmDb.get('leads') || [];
  const matchedLead = leads.find((l: any) => digits && normPhone(l.phone) === digits);

  const employees = crmDb.get('employees') || [];
  const hint = (opts.agentHint || opts.from || '').replace(/^sip:/i, '').split('@')[0];
  const matchedAgent = employees.find(
    (e: any) =>
      e.name.toLowerCase() === hint.toLowerCase() ||
      (e.email && e.email.split('@')[0].toLowerCase() === hint.replace(/^aetherx_/, '').toLowerCase())
  );

  const agentName = matchedAgent ? matchedAgent.name : hint || 'Telecaller';
  const contactName = matchedLead ? matchedLead.name : targetPhone || 'External Contact';
  const companyName = matchedLead ? matchedLead.company : 'Plivo Call';

  if (existing) {
    return crmDb.update('callLogs', existing.id, {
      technicalResult: opts.technicalResult || existing.technicalResult,
      duration: opts.duration !== undefined && opts.duration > 0 ? opts.duration : existing.duration,
      recordingUrl: opts.recordingUrl || existing.recordingUrl,
      recordingDuration: opts.recordingDuration || existing.recordingDuration,
      updatedAt: new Date().toISOString(),
    });
  }

  const created = crmDb.insert('callLogs', {
    providerCallId: opts.callUuid,
    provider: 'plivo',
    contact: contactName,
    company: companyName,
    phone: targetPhone,
    agent: agentName,
    direction: opts.direction || 'Outbound',
    technicalResult: opts.technicalResult || 'Initiated',
    disposition: 'Pending Classification',
    duration: opts.duration || 0,
    recordingUrl: opts.recordingUrl || '',
    recordingDuration: opts.recordingDuration || 0,
    date: todayIso,
    followUp: '',
    notes: opts.eventNote || `Plivo Call UUID: ${opts.callUuid}`,
  });

  if (matchedLead) {
    crmDb.update('leads', matchedLead.id, {
      lastCalled: todayIso,
      status: matchedLead.status === 'New' || matchedLead.status === 'Assigned' ? 'Attempted' : matchedLead.status,
    });
  }

  return created;
}

export function buildPlivoAnswerXml(opts: {
  to: string;
  baseUrl: string;
  recordCall: boolean;
  isInbound?: boolean;
}) {
  const { phoneNumber } = getPlivoEnv();
  const PlivoResponse: any = (plivo as any).Response;
  const response = new PlivoResponse();

  if (opts.recordCall) {
    response.addSpeak('This call may be recorded for quality and training purposes.', {
      language: 'en-IN',
    });
    response.addRecord({
      action: `${opts.baseUrl}/api/plivo/webhooks/recording`,
      method: 'POST',
      redirect: false,
      recordSession: true,
      maxLength: 3600,
    });
  }

  const dial = response.addDial({
    callerId: phoneNumber || undefined,
    action: `${opts.baseUrl}/api/plivo/webhooks/hangup`,
    method: 'POST',
    callbackUrl: `${opts.baseUrl}/api/plivo/webhooks/ring`,
    callbackMethod: 'POST',
  });

  if (opts.isInbound) {
    dial.addUser(opts.to);
  } else {
    dial.addNumber(opts.to);
  }

  return response.toXML();
}
