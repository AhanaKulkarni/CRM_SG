import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createBrowserAccessToken, getPlivoEnv, getPlivoEnvStatus } from '@/lib/plivo';

export async function POST() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const envStatus = getPlivoEnvStatus();
  if (!envStatus.hasAuthId || !envStatus.hasAuthToken) {
    return NextResponse.json(
      {
        configured: false,
        error: 'Plivo server credentials (PLIVO_AUTH_ID / PLIVO_AUTH_TOKEN) are not configured.',
      },
      { status: 400 }
    );
  }

  try {
    // Employee-specific calling identity (4 authorised users)
    const cleanIdentity = user.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const username = `aetherx_${cleanIdentity || 'agent'}`;
    const { token, expiresIn } = createBrowserAccessToken(username, user.id);
    const { applicationId, phoneNumber } = getPlivoEnv();

    return NextResponse.json({
      configured: true,
      token,
      username,
      expiresIn,
      callerId: phoneNumber,
      applicationId,
      agentName: user.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: false,
        error: err?.message || 'Unable to generate Plivo Browser SDK token.',
      },
      { status: 500 }
    );
  }
}
