import { NextResponse } from 'next/server';
import { mapPlivoStatus, parsePlivoWebhook, upsertPlivoCallRecord } from '@/lib/plivoWebhook';

export async function POST(req: Request) {
  const { params, sigCheck } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || params.DialBLegUUID || `plivo-${Date.now()}`;
  const status = params.CallStatus || params.Event || 'ringing';
  const mapped = status.toLowerCase().includes('answer')
    ? 'Answered/Connected'
    : mapPlivoStatus(status);

  const call = upsertPlivoCallRecord({
    callUuid,
    from: params.From,
    to: params.To,
    technicalResult: mapped,
  });

  return NextResponse.json({ success: true, callId: call?.id, status: mapped });
}
