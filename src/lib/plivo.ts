import crypto from 'crypto';
import * as plivo from 'plivo';

const plivoAny: any = plivo;

export const AETHERX_PUBLIC_CALLER_ID = '+912269857438';
export const AETHERX_PUBLIC_CALLER_ID_DISPLAY = '+91 22 6985 7438';

export interface PlivoEnvStatus {
  configured: boolean;
  hasAuthId: boolean;
  hasAuthToken: boolean;
  hasAppId: boolean;
  hasPhoneNumber: boolean;
  hasWebhookSecret: boolean;
  phoneNumber: string;
}

export function getPlivoEnv() {
  return {
    authId: (process.env.PLIVO_AUTH_ID || '').trim(),
    authToken: (process.env.PLIVO_AUTH_TOKEN || '').trim(),
    applicationId: (process.env.PLIVO_APPLICATION_ID || '').trim(),
    phoneNumber: (process.env.PLIVO_CALLER_ID || process.env.PLIVO_PHONE_NUMBER || AETHERX_PUBLIC_CALLER_ID).trim(),
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
    phoneNumber: phoneNumber === AETHERX_PUBLIC_CALLER_ID ? AETHERX_PUBLIC_CALLER_ID_DISPLAY : phoneNumber,
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
        const cleanNum = phoneNumber.replace(/[^\d]/g, '');
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
  const { authId, authToken, applicationId } = getPlivoEnv();
  if (!authId || !authToken) {
    throw new Error('Plivo credentials are not configured on the server.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'HS256',
    typ: 'JWT',
    cty: 'plivo;v=1',
  };
  const payload = {
    jti: uid || `${username}-${nowSec}`,
    iss: authId,
    sub: username,
    ...(applicationId ? { app: applicationId } : {}),
    nbf: nowSec - 60,
    exp: nowSec + 3600,
    per: {
      voice: {
        incoming_allow: true,
        outgoing_allow: true,
      },
    },
    grants: {
      voice: {
        incoming_allow: true,
        outgoing_allow: true,
      },
    },
  };

  const b64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const signature = crypto
    .createHmac('sha256', authToken)
    .update(signingInput)
    .digest('base64url');

  return {
    token: `${signingInput}.${signature}`,
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

export async function fetchPlivoRecordingStream(recordingUrl: string): Promise<Response> {
  const { authId, authToken } = getPlivoEnv();
  const headers: Record<string, string> = {};
  if (authId && authToken && recordingUrl.includes('plivo.com')) {
    headers['Authorization'] = `Basic ${Buffer.from(`${authId}:${authToken}`).toString('base64')}`;
  }
  return fetch(recordingUrl, { headers });
}

export async function configurePlivoApplicationWebhooks(baseUrl: string) {
  const { authId, authToken, applicationId } = getPlivoEnv();
  if (!authId || !authToken || !applicationId) {
    throw new Error('Missing PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN, or PLIVO_APPLICATION_ID');
  }
  const client: any = new plivo.Client(authId, authToken);
  const answerUrl = `${baseUrl}/api/plivo/webhooks/answer`;
  const hangupUrl = `${baseUrl}/api/plivo/webhooks/hangup`;
  const updated = await client.applications.update(applicationId, {
    answerUrl,
    answerMethod: 'POST',
    hangupUrl,
    hangupMethod: 'POST',
  });
  return {
    updated: true,
    answerUrl,
    hangupUrl,
    message: updated?.message || 'Application updated',
  };
}

export async function initiateServerPlivoCall(opts: {
  to: string;
  callerId?: string;
  baseUrl: string;
  agentName: string;
  employeeId: string;
  leadId?: string;
  customerId?: string;
  recordConsent?: boolean;
}) {
  const { authId, authToken, phoneNumber } = getPlivoEnv();
  if (!authId || !authToken) {
    throw new Error('Plivo credentials are not configured on the server.');
  }
  const effectiveCallerId = opts.callerId || phoneNumber;
  const client: any = new plivo.Client(authId, authToken);
  const answerUrl = new URL(`${opts.baseUrl}/api/plivo/webhooks/answer`);
  answerUrl.searchParams.set('X-PH-Agent', opts.agentName);
  answerUrl.searchParams.set('X-PH-EmployeeId', opts.employeeId);
  if (opts.leadId) answerUrl.searchParams.set('X-PH-LeadId', opts.leadId);
  if (opts.customerId) answerUrl.searchParams.set('X-PH-CustomerId', opts.customerId);
  answerUrl.searchParams.set('X-PH-Record', opts.recordConsent ? 'true' : 'false');

  const res = await client.calls.create(
    effectiveCallerId,
    opts.to.replace(/\s+/g, ''),
    answerUrl.toString(),
    {
      answerMethod: 'POST',
      hangupUrl: `${opts.baseUrl}/api/plivo/webhooks/hangup`,
      hangupMethod: 'POST',
      callbackUrl: `${opts.baseUrl}/api/plivo/webhooks/status`,
      callbackMethod: 'POST',
    }
  );
  return {
    requestUuid: res?.requestUuid || res?.request_uuid || '',
    message: res?.message || 'Call initiated',
    callerId: effectiveCallerId,
  };
}
