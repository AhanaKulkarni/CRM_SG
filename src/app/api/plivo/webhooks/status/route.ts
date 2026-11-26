import { NextResponse } from 'next/server';
import { mapPlivoStatus, parsePlivoWebhook, upsertPlivoCallRecord } from '@/lib/plivoWebhook';

export async function POST(req: Request) {
  const { params, sigCheck } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || params.DialBLegUUID || `plivo-${Date.now()}`;
  const mapped = mapPlivoStatus(
    params.CallStatus || params.Event || params.DialBLegStatus || '',
    params.HangupCause || ''
  );

  const call = upsertPlivoCallRecord({
    callUuid,
    from: params.From,
    to: params.To,
    technicalResult: mapped,
    startTime: params.StartTime,
    endTime: params.EndTime,
  });

  return NextResponse.json({ success: true, callId: call?.id, status: mapped });
}
