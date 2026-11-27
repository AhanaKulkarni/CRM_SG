import { NextResponse } from 'next/server';
import * as plivo from 'plivo';
import {
  buildPlivoAnswerXml,
  parsePlivoWebhook,
  resolveCallingUser,
  upsertPlivoCallRecord,
  xmlResponse,
} from '@/lib/plivoWebhook';
import { getAuthorizedPlivoCallerId } from '@/lib/rbac';

async function handleAnswer(req: Request) {
  const { params, sigCheck, baseUrl } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || `plivo-${Date.now()}`;
  const from = params.From || '';
  const to = params.To || '';
  const recordCall = params['X-PH-Record'] === 'true' || params.Record === 'true';
  const agentHint = params['X-PH-Agent'] || from;
  const employeeIdHint = params['X-PH-EmployeeId'] || '';
  const requestedCallerId = params['X-PH-CallerId'] || '';
  const leadIdHint = params['X-PH-LeadId'] || '';
  const customerIdHint = params['X-PH-CustomerId'] || '';

  const callingUser = resolveCallingUser({
    employeeId: employeeIdHint,
    agentHint,
    from,
  });

  // Enforce server-side caller ID assignment if user identity is resolved
  let effectiveCallerId = '';
  if (callingUser) {
    const auth = getAuthorizedPlivoCallerId(callingUser, requestedCallerId || undefined);
    if (!auth.authorized) {
      const PlivoResponse: any = (plivo as any).Response;
      const errResp = new PlivoResponse();
      errResp.addSpeak('This account is not authorised to place outbound calls on this number.', {
        language: 'en-IN',
      });
      errResp.addHangup();
      return xmlResponse(errResp.toXML());
    }
    effectiveCallerId = auth.callerId;
  }

  upsertPlivoCallRecord({
    callUuid,
    from,
    to,
    callerId: effectiveCallerId,
    direction: 'Outbound',
    technicalResult: 'Initiated',
    startTime: new Date().toISOString(),
    agentHint: callingUser?.name || agentHint,
    employeeIdHint: callingUser?.id || employeeIdHint,
    leadIdHint,
    customerIdHint,
  });

  const xml = buildPlivoAnswerXml({
    to,
    callerId: effectiveCallerId || undefined,
    baseUrl,
    recordCall,
    isInbound: false,
  });

  return xmlResponse(xml);
}

export async function POST(req: Request) {
  return handleAnswer(req);
}

export async function GET(req: Request) {
  return handleAnswer(req);
}
