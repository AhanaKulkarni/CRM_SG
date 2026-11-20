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
    name: settings.brandName || org.name || 'NEXORA CRM',
    short: settings.brandShort || 'Nexora',
    logo: settings.logo || '',
    favicon: settings.favicon || '',
    primary: settings.primaryColor || '#6366F1',
    secondary: settings.secondaryColor || '#8B5CF6',
    loginHeadline: settings.loginHeadline || 'Accelerate your entire revenue engine',
    loginSub: settings.loginSub || 'Manage leads, automate customer journeys, issue GST invoices and run AI-assisted telecalling in one command center.',
    company: {
      legal: settings.legalName || 'Nexora Technologies Pvt. Ltd.',
      gst: settings.gstNumber || '27AADCN1234F1Z8',
      email: settings.billingEmail || 'finance@nexora.app',
      phone: settings.phone || '+91 22 4912 8800',
      website: settings.website || 'https://nexora.app',
      address: settings.address || 'BKC, Bandra East, Mumbai, Maharashtra 400051',
    },
  };

  const bot = {
    name: 'Nexa',
    greeting: 'Namaste! I am Nexa, your AI assistant. How can I help you today?',
    qualify: true,
    booking: true,
    handoff: true,
  };

  return NextResponse.json({
    session: user,
    brand,
    bot,
    orgs: all.organisations || [],
    employees: all.employees || [],
    leads: all.leads || [],
    customers: all.customers || [],
    tasks: all.tasks || [],
    todos: all.todos || [],
    events: all.calendarEvents || [],
    reminders: all.reminders || [],
    notifications: all.notifications || [],
    campaigns: all.marketingCampaigns || [],
    calls: all.callLogs || [],
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
      { id: 'kb0', title: 'Getting started with Nexora CRM', category: 'Basics' },
      { id: 'kb1', title: 'Importing leads from Excel or CSV', category: 'Leads' },
      { id: 'kb2', title: 'Connecting Facebook & Instagram lead ads', category: 'Integrations' },
      { id: 'kb3', title: 'Creating GST-compliant invoices', category: 'Invoices' },
      { id: 'kb4', title: 'Setting up automation workflows', category: 'Automation' },
      { id: 'kb5', title: 'Configuring AI calling scripts', category: 'AI' },
      { id: 'kb6', title: 'Managing roles and permissions', category: 'Admin' },
      { id: 'kb7', title: 'White-labelling your workspace', category: 'Admin' },
    ],
    permissions: {
      Admin: ['view', 'create', 'edit', 'delete', 'export', 'settings'],
      Manager: ['view', 'create', 'edit', 'export'],
      'Sales Executive': ['view', 'create', 'edit'],
      Agent: ['view', 'create'],
      Viewer: ['view'],
    },
    system: {
      maintenance: false,
      signups: false,
      twoFactor: false,
      region: 'Mumbai (ap-south-1)',
    },
    features: {
      'Lead Management': ['Basic', 'Pro'],
      Invoices: ['Basic', 'Pro'],
      Telecalling: ['Basic', 'Pro'],
      'Internal Chat': ['Basic', 'Pro'],
      'AI Assistant': ['Pro'],
      'AI Calling': ['Pro'],
      Automation: ['Pro'],
      'White-Label': ['Pro'],
      'Meta Integration': ['Pro'],
      'Advanced Reports': ['Pro'],
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
