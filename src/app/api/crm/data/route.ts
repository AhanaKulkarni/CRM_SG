import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { localDb } from '@/db';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const all = localDb.getAll();
  const settings = localDb.get('organisationSettings')[0] || {};
  const org = localDb.get('organisations')[0] || {};

  const brand = {
    name: settings.brandName || org.name || 'StartAppGuru CRM',
    short: settings.brandShort || 'StartAppGuru',
    logo: settings.logo || org.logo || '/logo.png',
    favicon: settings.favicon || '/logo.png',
    primary: settings.primaryColor || org.primaryColor || '#1E2B6D',
    secondary: settings.secondaryColor || org.secondaryColor || '#22C55E',
    loginHeadline: settings.loginHeadline || 'Accelerate your entire revenue engine',
    loginSub: settings.loginSub || 'Manage leads, run telecalling campaigns, record calls and grow your business — all in one platform.',
    company: {
      legal: settings.legalName || 'Start App Guru Pvt. Ltd.',
      gst: settings.gstNumber || '',
      email: settings.billingEmail || 'hello@startappguru.com',
      phone: settings.phone || '',
      website: settings.website || 'https://startappguru.com',
      address: settings.address || '',
    },
  };

  const bot = {
    name: 'Nexa',
    greeting: 'Namaste! I am Nexa, your AI assistant. How can I help you today?',
    qualify: true,
    booking: true,
    handoff: true,
  };

  const isCaller = user.role === 'Caller';
  const callerName = user.name;

  // Data scoping per Rulebook Section 3
  const scopedLeads = isCaller
    ? (all.leads || []).filter((l: any) => l.owner === callerName || !l.owner)
    : all.leads || [];

  const scopedCalls = (isCaller
    ? (all.callLogs || []).filter((c: any) => c.employeeId === user.id || c.agent === callerName)
    : all.callLogs || []
  ).map((c: any) => {
    // Never expose raw providerRecordingUrl to client; always route through authenticated /api/plivo/recordings/[id]
    const { providerRecordingUrl, ...rest } = c;
    return {
      ...rest,
      recordingUrl: providerRecordingUrl ? `/api/plivo/recordings/${c.id}` : c.recordingUrl || '',
    };
  });

  const scopedTasks = isCaller
    ? (all.tasks || []).filter((t: any) => t.assignee === callerName || !t.assignee)
    : all.tasks || [];

  return NextResponse.json({
    session: user,
    brand,
    bot,
    orgs: all.organisations || [],
    employees: all.employees || [],
    leads: scopedLeads,
    customers: all.customers || [],
    tasks: scopedTasks,
    todos: all.todos || [],
    events: all.calendarEvents || [],
    reminders: all.reminders || [],
    notifications: all.notifications || [],
    campaigns: all.marketingCampaigns || [],
    calls: scopedCalls,
    notes: all.notes || [],
    invoices: all.invoices || [],
    channels: all.chatChannels || [],
    messages: all.chatMessages || [],
    tickets: all.supportTickets || [],
    workflows: all.automationWorkflows || [],
    runs: all.workflowRuns || [],
    integrations: all.integrations || [],
    activity: all.activityLogs || [],
    enquiries: all.enquiries || [],
    subscription: all.subscriptions?.[0] || { plan: 'Pro', seats: 4, renews: '2026-12-31' },
    billing: all.billingHistory || [],
    formFields: all.formFields || [],
    kb: [
      { id: 'kb0', title: 'Getting started with AetherX', category: 'Basics' },
      { id: 'kb1', title: 'Importing leads from Excel or CSV', category: 'Leads' },
      { id: 'kb2', title: 'Connecting Facebook & Instagram lead ads', category: 'Integrations' },
      { id: 'kb3', title: 'Setting up telecalling scripts', category: 'Telecalling' },
      { id: 'kb4', title: 'Managing roles and permissions', category: 'Admin' },
      { id: 'kb5', title: 'White-labelling your workspace', category: 'Admin' },
      { id: 'kb6', title: 'Using the AI Assistant', category: 'AI' },
    ],
    permissions: {
      Admin: ['view', 'create', 'edit', 'delete', 'export', 'settings'],
      Caller: ['view', 'create', 'edit'],
    },
    system: {
      maintenance: false,
      signups: false,
      twoFactor: false,
      region: 'Mumbai (ap-south-1)',
    },
    features: {
      'Lead Management': ['Starter', 'Growth', 'Pro'],
      Telecalling: ['Starter', 'Growth', 'Pro'],
      'Internal Chat': ['Starter', 'Growth', 'Pro'],
      Customers: ['Growth', 'Pro'],
      Marketing: ['Growth', 'Pro'],
      Employees: ['Growth', 'Pro'],
      Reports: ['Growth', 'Pro'],
      'AI Assistant': ['Growth', 'Pro'],
      Integrations: ['Pro'],
      'White-Label': ['Pro'],
      'Meta Integration': ['Pro'],
    },
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  if (body.action === 'reset') {
    localDb.reset();
    return NextResponse.json({ success: true, message: 'Database reset to clean state' });
  }
  return NextResponse.json({ success: true });
}
