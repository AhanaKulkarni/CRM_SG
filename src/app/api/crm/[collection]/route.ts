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
  formFields: 'formFields',
};

export async function POST(
  request: Request,
  { params }: { params: { collection: string } }
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

  try {
    const body = await request.json();
    const created = localDb.insert(colKey, body);

    // Also trigger activity log if applicable
    if (['leads', 'customers', 'invoices', 'calls', 'tasks'].includes(params.collection)) {
      const targetName = body.company || body.name || body.title || body.number || 'record';
      localDb.insert('activityLogs', {
        who: user.name,
        what: `created ${params.collection.slice(0, -1)}`,
        target: targetName,
        type: params.collection,
        time: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, item: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
