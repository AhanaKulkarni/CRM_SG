import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { crmDb } from '@/db';
import { getPlivoEnvStatus, verifyPlivoConnection } from '@/lib/plivo';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required' }, { status: 403 });
  }

  return NextResponse.json({
    envStatus: getPlivoEnvStatus(),
  });
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required' }, { status: 403 });
  }

  const result = await verifyPlivoConnection();

  crmDb.insert('activityLogs', {
    who: user.name,
    what: result.connected ? 'verified Plivo API connection' : 'failed Plivo API connection test',
    target: 'Plivo Telephony',
    type: 'developer_audit',
    time: new Date().toISOString(),
  });

  return NextResponse.json(result, { status: 200 });
}
