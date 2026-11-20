import { NextResponse } from 'next/server';
import { crmDb } from '@/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name = 'Website visitor',
      email = '',
      phone = '',
      company = 'Website enquiry',
      requirements = '',
      message = '',
      budget = 50000,
      source = 'Website',
      city = '',
    } = body;

    const leadData = {
      name,
      company: company || 'Website enquiry',
      email,
      phone,
      source: source || 'Website',
      status: 'New',
      priority: 'Medium',
      owner: 'Rohan Mehta',
      value: Number(budget) || 50000,
      city: city || 'India',
      notes: requirements || message || 'Inbound website enquiry submission',
      created: new Date().toISOString().slice(0, 10),
    };

    const newLead = await crmDb.insert('leads', leadData);

    // Also record enquiry
    await crmDb.insert('enquiries', {
      name,
      email,
      phone,
      page: body.page || '/contact',
      message: requirements || message || 'Form submission',
      time: new Date().toISOString(),
      utm: body.utm || 'direct',
    });

    // Create notification
    await crmDb.insert('notifications', {
      title: 'New website enquiry',
      text: `${name} submitted the contact form (${newLead.company})`,
      category: 'lead',
      read: false,
      created: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Lead received and assigned',
      lead: newLead,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process lead webhook' },
      { status: 500 }
    );
  }
}
