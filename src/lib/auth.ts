import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { localDb } from '@/db';

export const SESSION_COOKIE_NAME = 'nexora_session';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// In-memory rate limiting map (IP / email -> attempts & timestamps)
const rateLimits = new Map<string, { count: number; lastAttempt: number }>();

export function checkRateLimit(key: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry) {
    rateLimits.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (now - entry.lastAttempt > windowMs) {
    rateLimits.set(key, { count: 1, lastAttempt: now });
    return true;
  }
  if (entry.count >= maxAttempts) {
    return false;
  }
  entry.count++;
  entry.lastAttempt = now;
  return true;
}

export async function loginUser(email: string, passwordPlain: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!checkRateLimit(`login:${cleanEmail}`, 10, 60000)) {
    throw new Error('Too many login attempts. Please wait 1 minute and try again.');
  }

  const user = localDb.find('authorisedUsers', (u: any) => u.email.toLowerCase() === cleanEmail);
  if (!user) {
    throw new Error('Invalid email or password. Only authorized accounts are permitted.');
  }

  if (user.status !== 'Active') {
    throw new Error('This account has been deactivated. Please contact your administrator.');
  }

  const valid = bcrypt.compareSync(passwordPlain, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  // Create session
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  localDb.insert('sessions', {
    token,
    userId: user.id,
    expiresAt,
  });

  // Set HTTP-only cookie
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  // Audit log
  localDb.insert('activityLogs', {
    who: user.name,
    what: 'signed in to workspace',
    target: 'NEXORA CRM',
    type: 'auth',
    time: new Date().toISOString(),
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    designation: user.designation,
    phone: user.phone,
    avatar: user.avatar,
    orgId: user.orgId,
  };
}

export async function getSessionUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = localDb.find('sessions', (s: any) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      localDb.delete('sessions', session.id);
      return null;
    }

    const user = localDb.find('authorisedUsers', (u: any) => u.id === session.userId);
    if (!user || user.status !== 'Active') return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation,
      phone: user.phone,
      avatar: user.avatar,
      orgId: user.orgId,
    };
  } catch (err) {
    return null;
  }
}

export async function logoutUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = localDb.find('sessions', (s: any) => s.token === token);
      if (session) {
        localDb.delete('sessions', session.id);
      }
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (err) {
    // ignore
  }
}
