import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { localDb } from '@/db';

const VALID_COLLECTIONS: Record<string, string> = {
  leads: 'leads',
  customers: 'customers',
  employees: 'employees',
  tasks: 'tasks',
  todos: 'todos',
  events: 'calendarEvents',
  reminders: 'reminders',
  notifications: 'notifications',
  campaigns: 'marketingCampaigns',
  calls: 'callLogs',
  notes: 'notes',
  invoices: 'invoices',
  channels: 'chatChannels',
  messages: 'chatMessages',
  tickets: 'supportTickets',
  workflows: 'automationWorkflows',
  runs: 'workflowRuns',
  integrations: 'integrations',
  activity: 'activityLogs',
  enquiries: 'enquiries',
  orgs: 'organisations',
};

export async function PUT(
  request: Request,
  { params }: { params: { collection: string; id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const colKey = VALID_COLLECTIONS[params.collection];
  if (!colKey) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  if (['orgs', 'integrations'].includes(params.collection) && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required.' }, { status: 403 });
  }
  if (params.collection === 'employees' && user.role !== 'Admin' && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Admin or Developer access required.' }, { status: 403 });
  }

  if (['orgs', 'integrations'].includes(params.collection) && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required.' }, { status: 403 });
  }
  if (params.collection === 'employees' && user.role !== 'Admin' && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Admin or Developer access required.' }, { status: 403 });
  }

  try {
    const patch = await request.json();
    const updated = localDb.update(colKey, params.id, patch);
    if (!updated) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { collection: string; id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const colKey = VALID_COLLECTIONS[params.collection];
  if (!colKey) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  if (['orgs', 'integrations'].includes(params.collection) && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required.' }, { status: 403 });
  }
  if (params.collection === 'employees' && user.role !== 'Admin' && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Admin or Developer access required.' }, { status: 403 });
  }

  if (['orgs', 'integrations'].includes(params.collection) && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Developer access required.' }, { status: 403 });
  }
  if (params.collection === 'employees' && user.role !== 'Admin' && user.role !== 'Developer') {
    return NextResponse.json({ error: 'Forbidden: Admin or Developer access required.' }, { status: 403 });
  }

  try {
    const success = localDb.delete(colKey, params.id);
    if (!success) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
