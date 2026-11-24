import { NextResponse } from 'next/server';
import { crmDb } from '@/db';

// Technical result normalization helper
function normalizeTechnicalResult(status: string = ''): string {
  const s = status.toLowerCase();
  if (s.includes('complete') || s.includes('answer') || s.includes('connect')) {
    return 'Answered/Connected';
  }
  if (s.includes('busy')) return 'Busy';
  if (s.includes('no-answer') || s.includes('noanswer') || s.includes('ring')) {
    return 'No Answer';
  }
  if (s.includes('reject')) return 'Rejected';
  if (s.includes('fail')) return 'Failed';
  return 'Answered/Connected';
}

export async function POST(req: Request) {
  try {
    let payload: Record<string, any> = {};

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else {
      // Handles form-urlencoded webhooks from providers like Twilio / Exotel
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    }

    // Extract common provider identifiers (Exotel, Twilio, Ozonetel, Knowlarity)
    const providerCallId =
      payload.CallSid ||
      payload.CallId ||
      payload.call_id ||
      payload.sid ||
      payload.id ||
      `call-${Date.now()}`;

    const agentIdentifier =
      payload.AgentName ||
      payload.agent_name ||
      payload.AgentEmail ||
      payload.agent ||
      payload.From ||
      payload.caller ||
      'Outbound Telecaller';

    const customerPhone =
      payload.To ||
      payload.CustomerNumber ||
      payload.customer_number ||
      payload.DialWhomNumber ||
      payload.phone ||
      '';

    const rawStatus =
      payload.CallStatus ||
      payload.Status ||
      payload.status ||
      payload.StatusDetails ||
      'completed';

    const technicalResult = normalizeTechnicalResult(rawStatus);

    const duration = Number(
      payload.CallDuration ||
      payload.DialCallDuration ||
      payload.duration ||
      payload.CallDurationSeconds ||
      0
    );

    const recordingUrl =
      payload.RecordingUrl ||
      payload.recording_url ||
      payload.RecordingLocation ||
      payload.AudioFile ||
      '';

    const normPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
    const targetDigits = normPhone(customerPhone);

    // Look up matching lead in CRM
    const leads = crmDb.get('leads') || [];
    const matchedLead = leads.find((l: any) => targetDigits && normPhone(l.phone) === targetDigits);

    // Look up agent name in employees
    const employees = crmDb.get('employees') || [];
    const matchedAgent = employees.find(
      (e: any) =>
        e.name.toLowerCase() === agentIdentifier.toLowerCase() ||
        (e.email && e.email.toLowerCase() === agentIdentifier.toLowerCase()) ||
        (e.phone && normPhone(e.phone) === normPhone(agentIdentifier))
    );

    const agentName = matchedAgent ? matchedAgent.name : agentIdentifier;
    const contactName = matchedLead ? matchedLead.name : customerPhone || 'External Contact';
    const companyName = matchedLead ? matchedLead.company : 'Direct Call';

    // Idempotency: Check if call record with this providerCallId already exists
    const existingCalls = crmDb.get('callLogs') || [];
    const existingCall = existingCalls.find((c: any) => c.providerCallId === providerCallId);

    const todayIso = new Date().toISOString().slice(0, 10);

    let resultCall;
    if (existingCall) {
      // Update existing record with final details (e.g. duration, recordingUrl, final status)
      resultCall = crmDb.update('callLogs', existingCall.id, {
        duration: duration || existingCall.duration,
        recordingUrl: recordingUrl || existingCall.recordingUrl,
        technicalResult,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Insert new call record
      resultCall = crmDb.insert('callLogs', {
        providerCallId,
        contact: contactName,
        company: companyName,
        phone: customerPhone,
        agent: agentName,
        direction: payload.Direction || (payload.From === customerPhone ? 'Inbound' : 'Outbound'),
        technicalResult,
        disposition: technicalResult === 'Answered/Connected' ? 'Pending Classification' : 'No Answer',
        duration,
        recordingUrl,
        date: todayIso,
        followUp: '',
        notes: payload.notes || `Call captured via provider webhook (ID: ${providerCallId})`,
      });
    }

    // If matched lead exists, update its stage & last called date
    if (matchedLead) {
      const isNew = matchedLead.status === 'New';
      crmDb.update('leads', matchedLead.id, {
        lastCalled: todayIso,
        status: isNew
          ? technicalResult === 'Answered/Connected'
            ? 'Contacted'
            : 'Attempted'
          : matchedLead.status,
      });
    }

    // Add activity log
    crmDb.insert('activityLogs', {
      who: agentName,
      what: `completed telephony call (${technicalResult}) with`,
      target: companyName,
      type: 'call',
      time: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Call event processed successfully',
      call: resultCall,
      idempotent: Boolean(existingCall),
    });
  } catch (err: any) {
    console.error('Call webhook processing error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
