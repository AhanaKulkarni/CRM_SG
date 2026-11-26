import { NextResponse } from 'next/server';
import { crmDb } from '@/db';
import { mapPlivoStatus, parsePlivoWebhook, upsertPlivoCallRecord } from '@/lib/plivoWebhook';

export async function POST(req: Request) {
  const { params, sigCheck } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || params.DialBLegUUID || `plivo-${Date.now()}`;
  const duration = Number(params.DialBLegDuration || params.Duration || params.BillDuration || 0);
  const technicalResult = mapPlivoStatus(
    params.CallStatus || params.DialBLegStatus || '',
    params.HangupCause || params.DialBLegHangupCause || ''
  );

  const call = upsertPlivoCallRecord({
    callUuid,
    from: params.From,
    to: params.To,
    technicalResult,
    duration,
    startTime: params.StartTime,
    endTime: params.EndTime || new Date().toISOString(),
  });

  crmDb.insert('activityLogs', {
    who: call?.agent || 'Telecaller',
    what: `completed Plivo call (${technicalResult}) with`,
    target: call?.company || call?.phone || 'Contact',
    type: 'call',
    time: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, callId: call?.id, duration, technicalResult });
}
