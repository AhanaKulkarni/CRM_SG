export type AppRole = 'Developer' | 'Admin' | 'Caller';

export const SHARED_PLIVO_NUMBER = '+912269857438';
export const SHARED_PLIVO_NUMBER_DISPLAY = '+91 22 6985 7438';

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
 * - +91 22 6985 7438 is ONLY assigned to Admin and Caller 1.
 * - Caller 2 & Caller 3 can only call if a separately authorized number is configured for them.
 * - Developer manages telephony config and is NOT an operational caller.
 */
export function getAuthorizedPlivoCallerId(user: {
  role?: string;
  email?: string;
  name?: string;
  assignedCallerId?: string;
} | null | undefined): {
  authorized: boolean;
  callerId: string;
  reason?: string;
} {
  if (!user) {
    return { authorized: false, callerId: '', reason: 'Authentication required.' };
  }

  if (user.role === 'Developer') {
    return {
      authorized: false,
      callerId: '',
      reason: 'Developer role manages Plivo configuration and is not an operational caller.',
    };
  }

  const cleanEmail = (user.email || '').trim().toLowerCase();
  const cleanName = (user.name || '').trim().toLowerCase();
  const sharedDigits = normalizePhoneDigits(SHARED_PLIVO_NUMBER);

  // Admin and Caller 1 are authorized to use +91 22 6985 7438
  const isAdminUser = user.role === 'Admin' || cleanEmail === 'admin@startappguru';
  const isCaller1 =
    cleanEmail === 'caller1@startappguru' ||
    cleanEmail === 'caller1@aetherx.app' ||
    cleanName === 'caller 1';

  if (isAdminUser || isCaller1) {
    const serverNumber =
      (process.env.PLIVO_CALLER_ID || process.env.PLIVO_PHONE_NUMBER || SHARED_PLIVO_NUMBER).trim();
    return {
      authorized: true,
      callerId: serverNumber,
    };
  }

  // Caller 2 and Caller 3: must NEVER use +91 22 6985 7438
  let separateNumber = (user.assignedCallerId || '').trim();
  if (!separateNumber && (cleanEmail === 'caller2@startappguru' || cleanName === 'caller 2')) {
    separateNumber = (process.env.PLIVO_CALLER_ID_CALLER2 || '').trim();
  }
  if (!separateNumber && (cleanEmail === 'caller3@startappguru' || cleanName === 'caller 3')) {
    separateNumber = (process.env.PLIVO_CALLER_ID_CALLER3 || '').trim();
  }

  if (separateNumber && normalizePhoneDigits(separateNumber) !== sharedDigits) {
    return {
      authorized: true,
      callerId: separateNumber,
    };
  }

  return {
    authorized: false,
    callerId: '',
    reason:
      'No Plivo calling number is authorized for your account. +91 22 6985 7438 is restricted to Admin and Caller 1.',
  };
}
