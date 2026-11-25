import { NextResponse } from 'next/server';
import {
  buildPlivoAnswerXml,
  parsePlivoWebhook,
  upsertPlivoCallRecord,
  xmlResponse,
} from '@/lib/plivoWebhook';

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

  upsertPlivoCallRecord({
    callUuid,
    from,
    to,
    direction: 'Outbound',
    technicalResult: 'Initiated',
    agentHint,
  });

  const xml = buildPlivoAnswerXml({
    to,
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
