import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await loginUser(email, password);
    return NextResponse.json({ user, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 });
  }
}
