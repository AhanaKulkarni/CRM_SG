import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { localDb } from '@/db';
import bcrypt from 'bcryptjs';

// POST /api/auth/create-user
// Admin-only: create a new Caller account within the same workspace
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session || (session.role !== 'Admin' && session.role !== 'Developer')) {
      return NextResponse.json({ error: 'Unauthorized. Admin or Developer access required.' }, { status: 403 });
    }

    const { name, email, password, role = 'Caller', designation = 'Telecaller', assignedCallerId = '' } = await request.json();

    if ((role === 'Developer' || role === 'Admin') && session.role !== 'Developer') {
      return NextResponse.json({ error: 'Forbidden: Only Developer can assign Admin or Developer roles.' }, { status: 403 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = localDb.find('authorisedUsers', (u: any) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters.' }, { status: 400 });
    }

    const hash = bcrypt.hashSync(password, 10);
    const newUser = localDb.insert('authorisedUsers', {
      orgId: session.orgId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hash,
      role,
      designation,
      assignedCallerId,
      phone: '',
      avatar: '',
      status: 'Active',
    });

    localDb.insert('activityLogs', {
      who: session.name,
      what: `created ${role} account`,
      target: cleanEmail,
      type: session.role === 'Developer' ? 'developer_audit' : 'auth',
      time: new Date().toISOString(),
    });

    // Also add to employees directory if not already there
    const empExists = localDb.find('employees', (e: any) => e.email?.toLowerCase() === cleanEmail);
    if (!empExists) {
      localDb.insert('employees', {
        name: newUser.name,
        email: newUser.email,
        role,
        dept: role === 'Caller' ? 'Telecalling' : 'Sales',
        designation,
        phone: '',
        score: 100,
        status: 'Active',
        joined: new Date().toISOString().slice(0, 10),
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        designation: newUser.designation,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user.' }, { status: 500 });
  }
}
