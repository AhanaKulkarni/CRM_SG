import { NextResponse } from 'next/server';
import { crmDb } from '@/db';
import {
  buildPlivoAnswerXml,
  normPhone,
  parsePlivoWebhook,
  upsertPlivoCallRecord,
  xmlResponse,
} from '@/lib/plivoWebhook';
import { getAuthorizedPlivoCallerId } from '@/lib/rbac';

async function handleInbound(req: Request) {
  const { params, sigCheck, baseUrl } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || `plivo-in-${Date.now()}`;
  const from = params.From || '';
  const to = params.To || '';
  const toDigits = normPhone(to);
  const recordCall = params.Record === 'true';

  const users = crmDb.get('authorisedUsers') || [];
  // Route inbound call to the specific Caller whose assigned Plivo number was dialed
  let targetUser = users.find((u: any) => {
    if (u.role !== 'Caller' || u.status !== 'Active') return false;
    const auth = getAuthorizedPlivoCallerId(u);
    return auth.authorized && toDigits && normPhone(auth.callerId) === toDigits;
  });

  if (!targetUser) {
    targetUser = users.find((u: any) => u.role === 'Caller' && u.status === 'Active') || users[0];
  }

  const cleanId = (targetUser?.email || 'caller1@startappguru')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const endpointUser = `aetherx_${cleanId}`;

  upsertPlivoCallRecord({
    callUuid,
    from,
    to,
    callerId: to,
    direction: 'Inbound',
    technicalResult: 'Ringing',
    agentHint: targetUser?.name || endpointUser,
    employeeIdHint: targetUser?.id || '',
  });

  const xml = buildPlivoAnswerXml({
    to: endpointUser,
    callerId: to || undefined,
    baseUrl,
    recordCall,
    isInbound: true,
  });

  return xmlResponse(xml);
}

export async function POST(req: Request) {
  return handleInbound(req);
}

export async function GET(req: Request) {
  return handleInbound(req);
}
