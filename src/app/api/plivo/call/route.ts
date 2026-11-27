import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { crmDb } from '@/db';
import { initiateServerPlivoCall } from '@/lib/plivo';
import { getAuthorizedPlivoCallerId } from '@/lib/rbac';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const to = String(body.to || '').trim();
    if (!to) {
      return NextResponse.json({ error: 'Destination phone number is required' }, { status: 400 });
    }

    const numberAuth = getAuthorizedPlivoCallerId(user, body.callerId);
    if (!numberAuth.authorized) {
      return NextResponse.json(
        { error: numberAuth.reason || 'Not authorised for requested Plivo caller ID.' },
        { status: 403 }
      );
    }

    if (body.leadId) {
      const lead = (crmDb.get('leads') || []).find((l: any) => l.id === body.leadId);
      if (lead && (lead.dnc || lead.status === 'Do Not Call')) {
        return NextResponse.json({ error: 'Lead is marked Do Not Call (DNC)' }, { status: 403 });
      }
    }

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const result = await initiateServerPlivoCall({
      to,
      callerId: numberAuth.callerId,
      baseUrl,
      agentName: user.name,
      employeeId: user.id,
      leadId: body.leadId,
      customerId: body.customerId,
      recordConsent: Boolean(body.recordConsent),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to initiate server-side Plivo call' },
      { status: 500 }
    );
  }
}
