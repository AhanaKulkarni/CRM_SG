import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getPlivoEnvStatus, verifyPlivoConnection } from '@/lib/plivo';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const result = await verifyPlivoConnection();
  return NextResponse.json(result, { status: result.connected ? 200 : 200 });
}
