import { NextResponse } from 'next/server';
import { parsePlivoWebhook, upsertPlivoCallRecord } from '@/lib/plivoWebhook';

export async function POST(req: Request) {
  const { params, sigCheck } = await parsePlivoWebhook(req);
  if (!sigCheck.valid) {
    return NextResponse.json({ error: sigCheck.reason || 'Invalid Plivo signature' }, { status: 403 });
  }

  const callUuid = params.CallUUID || `plivo-${Date.now()}`;
  const recordingUrl = params.RecordUrl || params.RecordingUrl || '';
  const recordingDuration = Number(params.RecordingDuration || params.RecordingDurationMs || 0);

  const call = upsertPlivoCallRecord({
    callUuid,
    from: params.From,
    to: params.To,
    recordingUrl,
    recordingDuration,
  });

  return NextResponse.json({
    success: true,
    callId: call?.id,
    recordingUrl,
  });
}
