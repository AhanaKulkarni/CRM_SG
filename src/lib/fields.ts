export const SOURCES = ['Facebook', 'Instagram', 'Website', 'Referral', 'Google Ads', 'LinkedIn', 'Walk-in'];
export const STAGES = [
  'New',
  'Assigned',
  'Attempted',
  'Contacted',
  'Interested',
  'Follow-up Scheduled',
  'Qualified',
  'Converted',
  'Not Interested',
  'Do Not Call',
];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const TASK_STATUS = ['Open', 'In Progress', 'Completed', 'Cancelled'];
export const TECHNICAL_RESULTS = [
  'Answered/Connected',
  'No Answer',
  'Busy',
  'Failed',
  'Rejected',
  'Unavailable',
];
export const SALES_DISPOSITIONS = [
  'Interested',
  'Not Interested',
  'Call Back Required',
  'Follow-up Scheduled',
  'Converted',
  'Do Not Call',
  'Pending Classification',
];
export const DEPTS = ['Sales', 'Marketing', 'Support', 'Telecalling', 'Finance', 'Operations'];
export const ROLES = ['Admin', 'Caller'];
export const CITIES = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Kochi'];

const emp = (s: any) => (s?.employees || []).map((e: any) => e.name);

export const FIELDS = {
  leads: (s: any) => [
    { key: 'name', label: 'Full name', required: true },
    { key: 'company', label: 'Company', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'source', label: 'Source', type: 'select', options: SOURCES },
    { key: 'status', label: 'Stage', type: 'select', options: STAGES },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES },
    { key: 'owner', label: 'Assigned to', type: 'select', options: emp(s) },
    { key: 'value', label: 'Deal value (₹)', type: 'number' },
    { key: 'city', label: 'City' },
  ],
  customers: (s: any) => [
    { key: 'name', label: 'Contact name', required: true },
    { key: 'company', label: 'Company', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'city', label: 'City' },
    { key: 'segment', label: 'Segment', type: 'select', options: ['Enterprise', 'SMB', 'Startup'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    { key: 'owner', label: 'Account owner', type: 'select', options: emp(s) },
    { key: 'ltv', label: 'Lifetime value (₹)', type: 'number' },
  ],
  tasks: (s: any) => [
    { key: 'title', label: 'Task title', required: true, full: true },
    { key: 'assignee', label: 'Assignee', type: 'select', options: emp(s) },
    { key: 'priority', label: 'Priority', type: 'select', options: PRIORITIES },
    { key: 'status', label: 'Status', type: 'select', options: TASK_STATUS },
    { key: 'due', label: 'Due date', type: 'date' },
    { key: 'related', label: 'Related to' },
  ],
  events: (s: any) => [
    { key: 'title', label: 'Meeting title', required: true, full: true },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'time', label: 'Time', type: 'time' },
    { key: 'duration', label: 'Duration (min)', type: 'number' },
    { key: 'type', label: 'Type', type: 'select', options: ['Meeting', 'Call', 'Demo', 'Internal'] },
    { key: 'withPerson', label: 'Host', type: 'select', options: emp(s) },
  ],
  tickets: (s: any) => [
    { key: 'subject', label: 'Subject', required: true, full: true },
    { key: 'customer', label: 'Customer', type: 'select', options: (s?.customers || []).map((c: any) => c.company) },
    { key: 'priority', label: 'Priority', type: 'select', options: ['Urgent', 'High', 'Medium', 'Low'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
    {
      key: 'agent',
      label: 'Assigned agent',
      type: 'select',
      options: (s?.employees || []).filter((e: any) => e.dept === 'Support').map((e: any) => e.name),
    },
    { key: 'category', label: 'Category', type: 'select', options: ['Technical', 'Billing', 'Account', 'Feature Request'] },
  ],
  employees: () => [
    { key: 'name', label: 'Full name', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'dept', label: 'Department', type: 'select', options: DEPTS },
    { key: 'designation', label: 'Designation' },
    { key: 'role', label: 'Role', type: 'select', options: ROLES },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'] },
    { key: 'location', label: 'Location' },
  ],
  reminders: (s: any) => [
    { key: 'title', label: 'Reminder', required: true, full: true },
    { key: 'type', label: 'Type', type: 'select', options: ['Follow-up', 'Deadline', 'Payment', 'Meeting'] },
    { key: 'due', label: 'Date', type: 'date' },
    { key: 'time', label: 'Time', type: 'time' },
    { key: 'owner', label: 'Owner', type: 'select', options: emp(s) },
  ],
  campaigns: () => [
    { key: 'name', label: 'Campaign name', required: true, full: true },
    { key: 'channel', label: 'Channel', type: 'select', options: ['Facebook', 'Instagram', 'Google Ads', 'Email', 'WhatsApp', 'LinkedIn'] },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused', 'Scheduled', 'Completed'] },
    { key: 'budget', label: 'Budget (₹)', type: 'number' },
    { key: 'spend', label: 'Spend (₹)', type: 'number' },
    { key: 'leads', label: 'Leads', type: 'number' },
    { key: 'conversions', label: 'Conversions', type: 'number' },
    { key: 'revenue', label: 'Revenue (₹)', type: 'number' },
    { key: 'start', label: 'Start', type: 'date' },
    { key: 'end', label: 'End', type: 'date' },
  ],
  calls: (s: any) => [
    { key: 'contact', label: 'Contact', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'agent', label: 'Agent', type: 'select', options: emp(s) },
    { key: 'direction', label: 'Direction', type: 'select', options: ['Outbound', 'Inbound'] },
    { key: 'technicalResult', label: 'Technical result', type: 'select', options: TECHNICAL_RESULTS },
    { key: 'disposition', label: 'Sales disposition', type: 'select', options: SALES_DISPOSITIONS },
    { key: 'duration', label: 'Duration (sec)', type: 'number' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'followUp', label: 'Follow-up date', type: 'date' },
    { key: 'recordingUrl', label: 'Recording URL' },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true },
  ],
  orgs: () => [
    { key: 'name', label: 'Organisation', required: true },
    { key: 'domain', label: 'Domain' },
    { key: 'plan', label: 'Plan', type: 'select', options: ['Starter', 'Growth', 'Pro'] },
    { key: 'users', label: 'Users', type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Trial', 'Suspended'] },
    { key: 'primaryColor', label: 'Primary colour', type: 'color' },
    { key: 'secondaryColor', label: 'Secondary colour', type: 'color' },
  ],
};
