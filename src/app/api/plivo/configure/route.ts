import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { configurePlivoApplicationWebhooks } from '@/lib/plivo';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'Admin' && user.role !== 'Super Admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const result = await configurePlivoApplicationWebhooks(baseUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to configure Plivo application webhooks' },
      { status: 500 }
    );
  }
}
