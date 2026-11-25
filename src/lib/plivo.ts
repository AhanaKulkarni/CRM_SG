import * as plivo from 'plivo';

const plivoAny: any = plivo;

export interface PlivoEnvStatus {
  configured: boolean;
  hasAuthId: boolean;
  hasAuthToken: boolean;
  hasAppId: boolean;
  hasPhoneNumber: boolean;
  hasWebhookSecret: boolean;
  authIdMasked: string;
  applicationId: string;
  phoneNumber: string;
}

export function getPlivoEnv() {
  return {
    authId: (process.env.PLIVO_AUTH_ID || '').trim(),
    authToken: (process.env.PLIVO_AUTH_TOKEN || '').trim(),
    applicationId: (process.env.PLIVO_APPLICATION_ID || '').trim(),
    phoneNumber: (process.env.PLIVO_PHONE_NUMBER || '').trim(),
    webhookSecret: (process.env.PLIVO_PUBLIC_WEBHOOK_SECRET || '').trim(),
  };
}

export function getPlivoEnvStatus(): PlivoEnvStatus {
  const { authId, authToken, applicationId, phoneNumber, webhookSecret } = getPlivoEnv();
  const hasAuthId = Boolean(authId);
  const hasAuthToken = Boolean(authToken);
  const hasAppId = Boolean(applicationId);
  const hasPhoneNumber = Boolean(phoneNumber);
  const hasWebhookSecret = Boolean(webhookSecret);

  return {
    configured: hasAuthId && hasAuthToken && hasAppId && hasPhoneNumber,
    hasAuthId,
    hasAuthToken,
    hasAppId,
    hasPhoneNumber,
    hasWebhookSecret,
    authIdMasked: authId ? `${authId.slice(0, 6)}••••${authId.slice(-4)}` : 'Not configured',
    applicationId: applicationId || 'Not configured',
    phoneNumber: phoneNumber || 'Not configured',
  };
}

export function getPlivoClient() {
  const { authId, authToken } = getPlivoEnv();
  if (!authId || !authToken) {
    throw new Error('Plivo credentials (PLIVO_AUTH_ID / PLIVO_AUTH_TOKEN) are not configured on the server.');
  }
  return new plivo.Client(authId, authToken);
}

export async function verifyPlivoConnection() {
  const envStatus = getPlivoEnvStatus();
  const { authId, authToken, applicationId, phoneNumber } = getPlivoEnv();

  if (!authId || !authToken) {
    return {
      connected: false,
      error: 'Missing PLIVO_AUTH_ID or PLIVO_AUTH_TOKEN in server environment.',
      envStatus,
      account: null,
      application: null,
      number: null,
      endpoints: [],
      compliance: {
        indiaRegion: false,
        kycVerified: false,
        numberVerified: false,
        appVerified: false,
        webhookVerified: envStatus.hasWebhookSecret,
      },
    };
  }

  try {
    const client: any = new plivo.Client(authId, authToken);
    const account = await client.accounts.get();

    let application: any = null;
    let appError: string | null = null;
    if (applicationId) {
      try {
        application = await client.applications.get(applicationId);
      } catch (e: any) {
        appError = e?.message || 'Application ID not found';
      }
    }

    let numberInfo: any = null;
    let numberError: string | null = null;
    if (phoneNumber) {
      try {
        const cleanNum = phoneNumber.replace(/^\+/, '');
        numberInfo = await client.numbers.get(cleanNum);
      } catch (e: any) {
        numberError = e?.message || 'Number not found in Plivo account';
      }
    }

    let endpoints: any[] = [];
    try {
      const epList: any = await client.endpoints.list({ limit: 20 });
      endpoints = Array.isArray(epList) ? epList : epList?.objects || [];
    } catch {
      endpoints = [];
    }

    const isIndiaNumber = Boolean(
      phoneNumber.startsWith('+91') ||
        phoneNumber.startsWith('91') ||
        numberInfo?.country === 'India' ||
        numberInfo?.region?.toLowerCase?.().includes('india')
    );

    return {
      connected: true,
      error: null,
      envStatus,
      account: {
        name: account?.name || 'Plivo Account',
        accountType: account?.accountType || 'standard',
        cashCredits: account?.cashCredits || '0.00',
        city: account?.city || '',
        state: account?.state || '',
        timezone: account?.timezone || 'Asia/Kolkata',
      },
      application: application
        ? {
            appId: application.appId || applicationId,
            appName: application.appName,
            answerUrl: application.answerUrl,
            hangupUrl: application.hangupUrl,
            enabled: application.enabled,
          }
        : null,
      appError,
      number: numberInfo
        ? {
            number: numberInfo.number || phoneNumber,
            type: numberInfo.type || numberInfo.numberType || 'local',
            voiceEnabled: Boolean(numberInfo.voiceEnabled),
            country: numberInfo.country || (isIndiaNumber ? 'India' : 'Global'),
            region: numberInfo.region || '',
          }
        : null,
      numberError,
      endpoints: endpoints.map((ep: any) => ({
        username: ep.username,
        alias: ep.alias,
        endpointId: ep.endpointId,
      })),
      compliance: {
        indiaRegion: isIndiaNumber || (account?.timezone || '').includes('Kolkata'),
        kycVerified: account?.accountType === 'standard',
        numberVerified: Boolean(numberInfo && numberInfo.voiceEnabled),
        appVerified: Boolean(application && application.enabled !== false),
        webhookVerified: envStatus.hasWebhookSecret,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err?.message || 'Failed to authenticate with Plivo API.',
      envStatus,
      account: null,
      application: null,
      number: null,
      endpoints: [],
      compliance: {
        indiaRegion: false,
        kycVerified: false,
        numberVerified: false,
        appVerified: false,
        webhookVerified: envStatus.hasWebhookSecret,
      },
    };
  }
}

export function createBrowserAccessToken(username: string, uid?: string) {
  const { authId, authToken } = getPlivoEnv();
  if (!authId || !authToken) {
    throw new Error('Plivo credentials are not configured on the server.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const token = new plivoAny.AccessToken(
    authId,
    authToken,
    username,
    { validFrom: nowSec, lifetime: 3600 },
    uid || username
  );
  token.addVoiceGrants(true, true);
  return {
    token: token.toJwt(),
    username,
    expiresIn: 3600,
  };
}

export function validatePlivoWebhookSignature(
  fullUrl: string,
  method: string,
  headers: Headers,
  params: Record<string, any>
): { valid: boolean; reason?: string } {
  const { authToken, webhookSecret } = getPlivoEnv();
  const secret = webhookSecret || authToken;

  // If no secret/authToken is set in environment, fail closed in production or warn in dev
  if (!secret) {
    return { valid: false, reason: 'Server Plivo webhook secret / auth token not configured' };
  }

  const sigV3 = headers.get('x-plivo-signature-v3');
  const nonceV3 = headers.get('x-plivo-signature-v3-nonce');
  const sigV2 = headers.get('x-plivo-signature-v2');
  const nonceV2 = headers.get('x-plivo-signature-v2-nonce');

  try {
    if (sigV3 && nonceV3) {
      const ok = Boolean(plivo.validateV3Signature(method, fullUrl, nonceV3, secret, sigV3, params));
      return { valid: ok, reason: ok ? undefined : 'Invalid Plivo V3 signature' };
    }
    if (sigV2 && nonceV2) {
      const ok = Boolean(plivo.validateSignature(fullUrl, nonceV2, sigV2, secret));
      return { valid: ok, reason: ok ? undefined : 'Invalid Plivo V2 signature' };
    }
    return { valid: false, reason: 'Missing Plivo signature headers' };
  } catch (e: any) {
    return { valid: false, reason: e?.message || 'Signature verification error' };
  }
}
