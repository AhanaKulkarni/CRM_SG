import { NextResponse } from 'next/server';
import * as plivo from 'plivo';
import { crmDb } from '@/db';
import { AETHERX_PUBLIC_CALLER_ID_DISPLAY, getPlivoEnv, validatePlivoWebhookSignature } from './plivo';
import { getAuthorizedPlivoCallerId } from './rbac';

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
  if (s.includes('ring')) return 'Ringing';
  if (s.includes('answer') || s.includes('complete') || s.includes('normal_clearing') || s.includes('in-progress')) {
    return 'Answered/Connected';
  }
  return 'Unavailable';
}

export function normPhone(p: string) {
  return (p || '').replace(/\D/g, '').slice(-10);
}

export function resolveCallingUser(opts: {
  employeeId?: string;
  agentHint?: string;
  from?: string;
}) {
  const users = crmDb.get('authorisedUsers') || [];
  if (opts.employeeId) {
    const byId = users.find((u: any) => u.id === opts.employeeId);
    if (byId) return byId;
  }
  const hint = (opts.agentHint || opts.from || '').replace(/^sip:/i, '').split('@')[0];
  const cleanHint = hint.replace(/^aetherx_/, '').replace(/_[A-Z0-9]{10,}$/i, '').toLowerCase();
  return (
    users.find(
      (u: any) =>
        u.name.toLowerCase() === hint.toLowerCase() ||
        (u.email && u.email.split('@')[0].toLowerCase() === cleanHint)
    ) || null
  );
}

export function upsertPlivoCallRecord(opts: {
  callUuid: string;
  from?: string;
  to?: string;
  callerId?: string;
  direction?: 'Outbound' | 'Inbound';
  technicalResult?: string;
  duration?: number;
  startTime?: string;
  endTime?: string;
  providerRecordingUrl?: string;
  recordingDuration?: number;
  agentHint?: string;
  employeeIdHint?: string;
  leadIdHint?: string;
  customerIdHint?: string;
  eventNote?: string;
}) {
  const existingCalls = crmDb.get('callLogs') || [];
  const existing = existingCalls.find((c: any) => c.providerCallId === opts.callUuid);
  const nowIso = new Date().toISOString();
  const todayIso = nowIso.slice(0, 10);
  const { phoneNumber } = getPlivoEnv();
  const publicCallerId = opts.callerId || phoneNumber || AETHERX_PUBLIC_CALLER_ID_DISPLAY;

  const targetPhone = opts.direction === 'Inbound' ? opts.from || '' : opts.to || '';
  const digits = normPhone(targetPhone);

  const leads = crmDb.get('leads') || [];
  const customers = crmDb.get('customers') || [];

  const matchedLead =
    (opts.leadIdHint && leads.find((l: any) => l.id === opts.leadIdHint)) ||
    leads.find((l: any) => digits && normPhone(l.phone) === digits);

  const matchedCustomer =
    (opts.customerIdHint && customers.find((c: any) => c.id === opts.customerIdHint)) ||
    customers.find((c: any) => digits && normPhone(c.phone) === digits);

  const users = crmDb.get('authorisedUsers') || [];
  const employees = crmDb.get('employees') || [];
  const hint = (opts.agentHint || opts.from || '').replace(/^sip:/i, '').split('@')[0];
  const cleanHint = hint.replace(/^aetherx_/, '').toLowerCase();

  const matchedUser = users.find(
    (u: any) =>
      u.name.toLowerCase() === hint.toLowerCase() ||
      (u.email && u.email.split('@')[0].toLowerCase() === cleanHint)
  );
  const matchedEmp = employees.find(
    (e: any) =>
      e.name.toLowerCase() === hint.toLowerCase() ||
      (e.email && e.email.split('@')[0].toLowerCase() === cleanHint)
  );

  const employeeId = opts.employeeIdHint || matchedUser?.id || matchedEmp?.id || '';
  const agentName = matchedUser?.name || matchedEmp?.name || hint || 'Telecaller';
  const contactName = matchedCustomer?.name || matchedLead?.name || targetPhone || 'External Contact';
  const companyName = matchedCustomer?.company || matchedLead?.company || 'Plivo Voice';

  if (existing) {
    const updatedRecordingProxy = opts.providerRecordingUrl
      ? `/api/plivo/recordings/${existing.id}`
      : existing.recordingUrl;

    return crmDb.update('callLogs', existing.id, {
      technicalResult: opts.technicalResult || existing.technicalResult,
      duration: opts.duration !== undefined && opts.duration > 0 ? opts.duration : existing.duration,
      startTime: opts.startTime || existing.startTime,
      endTime: opts.endTime || existing.endTime,
      providerRecordingUrl: opts.providerRecordingUrl || existing.providerRecordingUrl || '',
      recordingUrl: updatedRecordingProxy || '',
      recordingDuration: opts.recordingDuration || existing.recordingDuration || 0,
      recordingStatus: opts.providerRecordingUrl ? 'available' : existing.recordingStatus || 'pending',
      updatedAt: nowIso,
    });
  }

  const created = crmDb.insert('callLogs', {
    providerCallId: opts.callUuid,
    provider: 'plivo',
    employeeId,
    leadId: matchedLead?.id || opts.leadIdHint || '',
    customerId: matchedCustomer?.id || opts.customerIdHint || '',
    callerId: publicCallerId,
    contact: contactName,
    company: companyName,
    phone: targetPhone,
    agent: agentName,
    direction: opts.direction || 'Outbound',
    technicalResult: opts.technicalResult || 'Initiated',
    disposition: 'Pending Classification',
    duration: opts.duration || 0,
    startTime: opts.startTime || nowIso,
    endTime: opts.endTime || '',
    timestamp: nowIso,
    providerRecordingUrl: opts.providerRecordingUrl || '',
    recordingUrl: '',
    recordingDuration: opts.recordingDuration || 0,
    recordingStatus: opts.providerRecordingUrl ? 'available' : 'pending',
    date: todayIso,
    followUp: '',
    notes: opts.eventNote || `Plivo Call UUID: ${opts.callUuid}`,
  });

  if (opts.providerRecordingUrl && created?.id) {
    crmDb.update('callLogs', created.id, {
      recordingUrl: `/api/plivo/recordings/${created.id}`,
    });
  }

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
  callerId?: string;
  baseUrl: string;
  recordCall: boolean;
  isInbound?: boolean;
}) {
  const { phoneNumber } = getPlivoEnv();
  const effectiveCallerId = opts.callerId || phoneNumber;
  const PlivoResponse: any = (plivo as any).Response;
  const response = new PlivoResponse();

  if (opts.recordCall) {
    response.addSpeak('This call may be recorded for quality and compliance purposes.', {
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
    callerId: effectiveCallerId,
    action: `${opts.baseUrl}/api/plivo/webhooks/hangup`,
    method: 'POST',
    callbackUrl: `${opts.baseUrl}/api/plivo/webhooks/status`,
    callbackMethod: 'POST',
  });

  if (opts.isInbound) {
    dial.addUser(opts.to);
  } else {
    dial.addNumber(opts.to);
  }

  return response.toXML();
}
