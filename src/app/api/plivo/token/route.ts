import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createBrowserAccessToken, getPlivoEnv, getPlivoEnvStatus } from '@/lib/plivo';
import { getAuthorizedPlivoCallerId } from '@/lib/rbac';

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
        authorized: false,
        error: 'Plivo server credentials (PLIVO_AUTH_ID / PLIVO_AUTH_TOKEN) are not configured.',
      },
      { status: 400 }
    );
  }

  // Enforce strict number assignment: +91 22 6985 7438 ONLY for Admin and Caller 1
  const numberAuth = getAuthorizedPlivoCallerId(user);
  if (!numberAuth.authorized) {
    return NextResponse.json(
      {
        configured: true,
        authorized: false,
        error: numberAuth.reason || 'You are not authorised to use this Plivo calling number.',
      },
      { status: 403 }
    );
  }

  try {
    const cleanIdentity = user.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const username = `aetherx_${cleanIdentity || 'agent'}`;
    const { token, expiresIn } = createBrowserAccessToken(username, user.id);
    const { applicationId } = getPlivoEnv();

    return NextResponse.json({
      configured: true,
      authorized: true,
      token,
      username,
      expiresIn,
      callerId: numberAuth.callerId,
      allowedCallerIds: numberAuth.allowedCallerIds,
      applicationId,
      agentName: user.name,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        configured: false,
        authorized: false,
        error: err?.message || 'Unable to generate Plivo Browser SDK token.',
      },
      { status: 500 }
    );
  }
}
