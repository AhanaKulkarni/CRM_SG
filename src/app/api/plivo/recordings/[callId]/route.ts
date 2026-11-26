import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { crmDb } from '@/db';
import { fetchPlivoRecordingStream } from '@/lib/plivo';

export async function GET(
  req: Request,
  { params }: { params: { callId: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const calls = crmDb.get('callLogs') || [];
  const call = calls.find(
    (c: any) => c.id === params.callId || c.providerCallId === params.callId
  );

  if (!call) {
    return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
  }

  // Enforce role-based access control: Callers can only play their own calls; Admins & Developer can access all
  const isPrivileged = user.role === 'Admin' || user.role === 'Developer';
  const isOwner = call.employeeId === user.id || call.agent === user.name;
  if (!isPrivileged && !isOwner) {
    return NextResponse.json({ error: 'Forbidden: recording access restricted' }, { status: 403 });
  }

  const rawUrl = call.providerRecordingUrl;
  if (!rawUrl) {
    return NextResponse.json({ error: 'Recording not available yet' }, { status: 404 });
  }

  try {
    const upstream = await fetchPlivoRecordingStream(rawUrl);
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: 'Unable to retrieve recording stream' }, { status: 502 });
    }

    const urlObj = new URL(req.url);
    const isDownload = urlObj.searchParams.get('download') === '1';
    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    const ext = contentType.includes('wav') ? 'wav' : 'mp3';

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
    };
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="call_${call.providerCallId || call.id}.${ext}"`;
    }

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error streaming private recording' },
      { status: 500 }
    );
  }
}
