import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { crmDb } from '@/db';
import { configurePlivoApplicationWebhooks } from '@/lib/plivo';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const result = await configurePlivoApplicationWebhooks(baseUrl);

    crmDb.insert('activityLogs', {
      who: user.name,
      what: 'updated Plivo Voice Application webhooks',
      target: result.answerUrl,
      type: 'developer_audit',
      time: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to configure Plivo application webhooks' },
      { status: 500 }
    );
  }
}
