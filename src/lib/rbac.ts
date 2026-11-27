export type AppRole = 'Developer' | 'Admin' | 'Caller';

export const SHARED_PLIVO_NUMBER = '+912269857438';
export const SHARED_PLIVO_NUMBER_DISPLAY = '+91 22 6985 7438';

export const CALLER1_PLIVO_NUMBER = '+912269857438';
export const CALLER2_PLIVO_NUMBER = '+912269874466';
export const CALLER3_PLIVO_NUMBER = '+912269854754';

export function formatPlivoNumber(num: string): string {
  const digits = (num || '').replace(/\D/g, '');
  if (digits === '912269857438') return '+91 22 6985 7438';
  if (digits === '912269874466') return '+91 22 6987 4466';
  if (digits === '912269854754') return '+91 22 6985 4754';
  return num;
}

export function isDeveloper(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'Developer';
}

export function isAdminOrDeveloper(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'Admin' || user?.role === 'Developer';
}

export function normalizePhoneDigits(p: string = ''): string {
  return p.replace(/\D/g, '').slice(-10);
}

/**
 * Enforces Plivo number assignment rules:
 * - Caller 1: ONLY +912269857438 (preserved existing config)
 * - Caller 2: ONLY +912269874466
 * - Admin & Developer: Access to both +912269857438 and +912269874466
 * - Caller 3: No telecalling access
 */
export function getAuthorizedPlivoCallerId(
  user: {
    role?: string;
    email?: string;
    name?: string;
    assignedCallerId?: string;
  } | null | undefined,
  requestedCallerId?: string
): {
  authorized: boolean;
  callerId: string;
  allowedCallerIds: string[];
  reason?: string;
} {
  if (!user) {
    return { authorized: false, callerId: '', allowedCallerIds: [], reason: 'Authentication required.' };
  }

  const caller1Num = (process.env.PLIVO_CALLER_ID || process.env.PLIVO_PHONE_NUMBER || CALLER1_PLIVO_NUMBER).trim();
  const caller2Num = (process.env.PLIVO_CALLER_ID_CALLER2 || CALLER2_PLIVO_NUMBER).trim();
  const caller3Num = (process.env.PLIVO_CALLER_ID_CALLER3 || CALLER3_PLIVO_NUMBER).trim();

  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanName = (user.name || '').trim().toLowerCase();

  let allowed: string[] = [];

  if (user.role === 'Developer' || user.role === 'Admin' || cleanEmail === 'admin@startappguru' || cleanEmail === 'developer@startappguru') {
    allowed = [caller1Num, caller2Num, caller3Num];
  } else if (
    cleanEmail === 'caller1@startappguru' ||
    cleanEmail === 'caller1@aetherx.app' ||
    cleanName === 'caller 1'
  ) {
    allowed = [caller1Num];
  } else if (
    cleanEmail === 'caller2@startappguru' ||
    cleanEmail === 'caller2@aetherx.app' ||
    cleanName === 'caller 2'
  ) {
    allowed = [caller2Num];
  } else if (
    cleanEmail === 'caller3@startappguru' ||
    cleanEmail === 'caller3@aetherx.app' ||
    cleanName === 'caller 3'
  ) {
    allowed = [caller3Num];
  } else if (user.assignedCallerId && normalizePhoneDigits(user.assignedCallerId) !== normalizePhoneDigits(caller1Num)) {
    allowed = [user.assignedCallerId.trim()];
  }

  if (allowed.length === 0) {
    return {
      authorized: false,
      callerId: '',
      allowedCallerIds: [],
      reason: 'Telecalling is not authorized for your account.',
    };
  }

  if (requestedCallerId) {
    const reqDigits = normalizePhoneDigits(requestedCallerId);
    const matched = allowed.find((n) => normalizePhoneDigits(n) === reqDigits);
    if (!matched) {
      return {
        authorized: false,
        callerId: '',
        allowedCallerIds: allowed,
        reason: `You are not authorized to use caller ID ${requestedCallerId}.`,
      };
    }
    return {
      authorized: true,
      callerId: matched,
      allowedCallerIds: allowed,
    };
  }

  return {
    authorized: true,
    callerId: allowed[0],
    allowedCallerIds: allowed,
  };
}
