import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { localDb } from '@/db';

const inr = (n: number) => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
const invTotal = (iv: any) => (iv.items || []).reduce((a: number, i: any) => a + (i.qty || 1) * (i.rate || 0), 0) * (1 + (iv.tax || 0) / 100);

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, mode } = await request.json();
  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  const t = query.toLowerCase();
  const leads = localDb.get('leads');
  const customers = localDb.get('customers');
  const invoices = localDb.get('invoices');
  const tasks = localDb.get('tasks');
  const calls = localDb.get('callLogs');
  const notes = localDb.get('notes');
  const employees = localDb.get('employees');

  const today = new Date().toISOString().slice(0, 10);

  // Check if company is mentioned
  const company = [...customers, ...leads].find(
    (c: any) => (c.company && t.includes(c.company.toLowerCase())) || (c.name && t.includes(c.name.toLowerCase()))
  );

  // Handle lead capture if email or phone is present in customer mode
  const emailMatch = query.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = query.match(/(\+?\d[\d\s-]{8,}\d)/);

  if (emailMatch || phoneMatch) {
    const nameGuess = (query.match(/(?:i am|i'm|my name is|this is)\s+([a-z]+(?:\s[a-z]+)?)/i) || [])[1];
    const newLead = localDb.insert('leads', {
      name: nameGuess ? nameGuess.replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Chatbot Visitor',
      company: 'Website enquiry',
      email: emailMatch?.[0] || '',
      phone: phoneMatch?.[0] || '',
      source: 'Website',
      status: 'Qualified',
      priority: 'High',
      owner: employees[0]?.name || user.name,
      value: 75000,
      city: '',
      created: today,
    });

    localDb.insert('notifications', {
      title: 'Chatbot captured lead',
      body: `${newLead.name} was qualified via chatbot`,
      type: 'lead',
      read: false,
      time: new Date().toISOString(),
    });

    return NextResponse.json({
      reply: `Thanks! I've saved your details and logged you as a **high-priority lead**. Our sales team will reach out within 2 hours. Would you also like to book a demo slot?`,
    });
  }

  // Meeting / demo booking
  if (/book|demo|appointment|schedule|meeting/.test(t)) {
    const targetComp = company?.company || 'Scheduled demo';
    const ev = localDb.insert('calendarEvents', {
      title: `Product demo · ${targetComp}`,
      date: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
      time: '11:00',
      duration: 45,
      type: 'Demo',
      withPerson: user.name,
    });

    localDb.insert('notifications', {
      title: 'Demo booked via AI',
      body: `${ev.title} scheduled for tomorrow at 11:00 AM`,
      type: 'meeting',
      read: false,
      time: new Date().toISOString(),
    });

    return NextResponse.json({
      reply: `Done — I've scheduled a **45-minute product demo tomorrow at 11:00 AM** with ${user.name}. It has been saved to your Calendar.`,
    });
  }

  // Create task / follow-up
  if (/task|follow[- ]?up|remind/.test(t)) {
    const target = company?.company || (leads[0]?.company ? leads[0].company : 'New lead');
    localDb.insert('tasks', {
      title: `Follow up with ${target}`,
      assignee: user.name,
      priority: 'High',
      due: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
      status: 'To Do',
      related: target,
    });

    return NextResponse.json({
      reply: `Created a high-priority follow-up task **"Follow up with ${target}"**, assigned to ${user.name} and due tomorrow. You will find it in **Tasks & To-Do**.`,
    });
  }

  // Summarise company
  if ((/summar|history|interaction|details/.test(t)) && company) {
    const relCalls = calls.filter((c: any) => c.company === company.company);
    const relInvs = invoices.filter((i: any) => i.customer === company.company);
    const relNotes = notes.filter((n: any) => n.related === company.company || n.related === company.name);
    const totalVal = relInvs.reduce((a: number, i: any) => a + invTotal(i), 0);

    return NextResponse.json({
      reply: `**${company.company}** — Contact: ${company.name}${company.city ? ', ' + company.city : ''}.\n• **${relCalls.length}** logged call(s)${relCalls[0] ? `, last outcome: "${relCalls[0].disposition}"` : ''}\n• **${relInvs.length}** invoice(s) totalling ${inr(totalVal)}${relInvs.some((i: any) => i.status === 'Overdue') ? ' (has overdue invoices)' : ''}\n• **${relNotes.length}** internal note(s)\nRecommended next step: schedule a check-in call with ${company.name}.`,
    });
  }

  // Open leads / hot leads query
  if (/lead/.test(t)) {
    const openLeads = leads.filter((l: any) => !['Won', 'Lost'].includes(l.status));
    const hotLeads = openLeads.filter((l: any) => l.priority === 'High');

    if (leads.length === 0) {
      return NextResponse.json({
        reply: `You currently have **0 leads** in your workspace database. Use the **+ Create** button or go to the **Leads** section to add your first lead.`,
      });
    }

    const topNames = hotLeads.slice(0, 3).map((l: any) => `${l.name} (${l.company})`).join(', ');
    return NextResponse.json({
      reply: `You currently have **${leads.length} total leads** in the database, of which **${openLeads.length}** are active/open. ${hotLeads.length > 0 ? `**${hotLeads.length}** are high-priority: ${topNames}.` : 'None are marked as high priority at the moment.'}`,
    });
  }

  // Invoices & revenue query
  if (/revenue|invoice|overdue|billing|paid/.test(t)) {
    const paidInvs = invoices.filter((i: any) => i.status === 'Paid');
    const overdueInvs = invoices.filter((i: any) => i.status === 'Overdue');
    const pendingInvs = invoices.filter((i: any) => i.status === 'Pending');

    const paidTotal = paidInvs.reduce((a: number, i: any) => a + invTotal(i), 0);
    const overdueTotal = overdueInvs.reduce((a: number, i: any) => a + invTotal(i), 0);

    if (invoices.length === 0) {
      return NextResponse.json({
        reply: `There are currently **0 invoices** recorded in your database. You can generate your first invoice in the **Invoices** section.`,
      });
    }

    return NextResponse.json({
      reply: `Total collected revenue from paid invoices is **${inr(paidTotal)}** across ${paidInvs.length} invoice(s).\n• **${pendingInvs.length}** invoice(s) pending payment.\n• **${overdueInvs.length}** invoice(s) overdue (worth ${inr(overdueTotal)}): ${overdueInvs.map((i: any) => `${i.number} (${i.customer})`).join(', ') || 'None'}.`,
    });
  }

  // Pending tasks query
  if (/task|pending/.test(t)) {
    const pendingTasks = tasks.filter((t: any) => t.status !== 'Done');
    if (tasks.length === 0) {
      return NextResponse.json({
        reply: `There are currently **0 tasks** in the database. You can create new tasks in the **Tasks & To-Do** section.`,
      });
    }

    return NextResponse.json({
      reply: `You have **${pendingTasks.length} pending tasks** out of ${tasks.length} total tasks. ${pendingTasks.slice(0, 3).map((t: any) => `"${t.title}" (assigned to ${t.assignee || 'Unassigned'})`).join(', ')}.`,
    });
  }

  // Pricing / plans
  if (/price|pricing|plan|cost/.test(t)) {
    return NextResponse.json({
      reply: `We offer two plans:\n• **Basic — ₹999/user/month**: Core CRM, leads, customers, tasks, telecalling, invoices and chat.\n• **Pro — ₹1,299/user/month**: Everything in Basic plus AI Assistant, AI Calling, Automation workflows, Meta integration and White-label branding.\nAll plans include 14-day evaluation and dedicated onboarding support.`,
    });
  }

  // Integrations query
  if (/whatsapp|integrat|facebook|instagram|meta|website/.test(t)) {
    return NextResponse.json({
      reply: `NEXORA CRM connects with Facebook & Instagram lead ads, website forms via secure webhooks, WhatsApp Cloud API, Gmail and Google Calendar. Incoming enquiries flow directly into your pipeline with zero manual entry.`,
    });
  }

  // Fallback greeting or assistance
  return NextResponse.json({
    reply: `I have access to your active workspace database. You can ask me:\n• "How many open leads do we have?"\n• "Which invoices are overdue?"\n• "What tasks are pending?"\n• "Create follow-up task for [Company]"\n• "Book a demo"`,
  });
}
