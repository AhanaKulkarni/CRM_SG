import { NextResponse } from 'next/server';
import { crmDb } from '@/db';
import {
  buildPlivoAnswerXml,
  parsePlivoWebhook,
  upsertPlivoCallRecord,
  xmlResponse,
} from '@/lib/plivoWebhook';

async function handleInbound(req: Request) {
  const { params, sigCheck, baseUrl } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || `plivo-in-${Date.now()}`;
  const from = params.From || '';
  const recordCall = params.Record === 'true';

  // Route inbound call to the first active caller or admin endpoint
  const users = crmDb.get('authorisedUsers') || [];
  const targetUser = users.find((u: any) => u.role === 'Caller' && u.status === 'Active') || users[0];
  const cleanId = (targetUser?.email || 'caller1@aetherx.app')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const endpointUser = `aetherx_${cleanId}`;

  upsertPlivoCallRecord({
    callUuid,
    from,
    to: params.To || '',
    direction: 'Inbound',
    technicalResult: 'Ringing',
    agentHint: targetUser?.name || endpointUser,
  });

  const xml = buildPlivoAnswerXml({
    to: endpointUser,
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
