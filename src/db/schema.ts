import { pgTable, text, timestamp, boolean, integer, numeric, jsonb, uuid, index } from 'drizzle-orm/pg-core';

// 1. Organisations
export const organisations = pgTable('organisations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  plan: text('plan').default('Pro').notNull(),
  users: integer('users').default(4).notNull(),
  status: text('status').default('Active').notNull(), // Active, Trial, Suspended
  primaryColor: text('primary_color').default('#6366F1').notNull(),
  secondaryColor: text('secondary_color').default('#8B5CF6').notNull(),
  region: text('region').default('Mumbai (ap-south-1)').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Authorised Users
export const authorisedUsers = pgTable('authorised_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').default('Standard User').notNull(), // Admin, Super Admin, Manager, Agent, Standard User
  designation: text('designation').default('Team Member'),
  phone: text('phone'),
  avatar: text('avatar'),
  status: text('status').default('Active').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index('user_email_idx').on(table.email),
  };
});

// 3. Sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: text('token').unique().notNull(),
  userId: uuid('user_id').references(() => authorisedUsers.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    tokenIdx: index('session_token_idx').on(table.token),
  };
});

// 4. Organisation Settings & White-Label
export const organisationSettings = pgTable('organisation_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  brandName: text('brand_name').default('AetherX').notNull(),
  brandShort: text('brand_short').default('AetherX'),
  logo: text('logo').default(''),
  favicon: text('favicon').default(''),
  primaryColor: text('primary_color').default('#6366F1').notNull(),
  secondaryColor: text('secondary_color').default('#8B5CF6').notNull(),
  loginHeadline: text('login_headline').default('Accelerate your entire revenue engine'),
  loginSub: text('login_sub').default('Manage leads, automate customer journeys, issue GST invoices and run AI-assisted telecalling in one command center.'),
  legalName: text('legal_name').default('AetherX Technologies Pvt. Ltd.'),
  gstNumber: text('gst_number').default('27AADCN1234F1Z8'),
  billingEmail: text('billing_email').default('hello@aetherx.app'),
  phone: text('phone').default('+91 22 4912 8800'),
  website: text('website').default('https://aetherx.app'),
  address: text('address').default('BKC, Bandra East, Mumbai, Maharashtra 400051'),
  currency: text('currency').default('INR').notNull(),
  timezone: text('timezone').default('Asia/Kolkata').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Employees Directory
export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  dept: text('dept').notNull(), // Sales, Marketing, Support, Telecalling, Finance, Operations
  designation: text('designation').notNull(),
  role: text('role').default('Agent').notNull(), // Admin, Manager, Sales Executive, Agent, Viewer
  status: text('status').default('Active').notNull(), // Active, On Leave, Inactive
  attendance: integer('attendance').default(95).notNull(),
  score: integer('score').default(80).notNull(),
  color: text('color').default('#6366F1'),
  location: text('location').default('Mumbai'),
  leadsHandled: integer('leads_handled').default(0),
  dealsWon: integer('deals_won').default(0),
  joined: text('joined').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Leads
export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email'),
  phone: text('phone'),
  source: text('source').default('Website').notNull(), // Facebook, Instagram, Website, Referral, Google Ads, LinkedIn, Walk-in
  status: text('status').default('New').notNull(), // New, Contacted, Qualified, Proposal, Negotiation, Won, Lost
  priority: text('priority').default('Medium').notNull(), // High, Medium, Low
  owner: text('owner'),
  value: numeric('value').default('50000').notNull(),
  city: text('city'),
  notes: text('notes'),
  nextFollowUp: text('next_follow_up'),
  created: text('created').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 7. Customers
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  company: text('company').notNull(),
  email: text('email'),
  phone: text('phone'),
  city: text('city'),
  segment: text('segment').default('SMB').notNull(), // Enterprise, SMB, Startup
  status: text('status').default('Active').notNull(), // Active, Inactive
  ltv: numeric('ltv').default('0').notNull(),
  owner: text('owner'),
  since: text('since').notNull(),
  lastContact: text('last_contact'),
  interactions: jsonb('interactions').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 8. Tasks & To-Do
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  assignee: text('assignee'),
  priority: text('priority').default('Medium').notNull(), // High, Medium, Low
  status: text('status').default('To Do').notNull(), // To Do, In Progress, Review, Done
  due: text('due').notNull(),
  related: text('related'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  done: boolean('done').default(false).notNull(),
  scope: text('scope').default('personal').notNull(), // personal, team
  due: text('due'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 9. Calendar & Meetings
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  duration: integer('duration').default(30).notNull(),
  type: text('type').default('Meeting').notNull(), // Meeting, Call, Demo, Internal
  withPerson: text('with_person'),
  relatedLeadOrCustomer: text('related_lead_or_customer'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 10. Reminders
export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').default('Follow-up').notNull(), // Follow-up, Deadline, Payment, Meeting
  due: text('due').notNull(),
  time: text('time').default('10:00').notNull(),
  owner: text('owner'),
  done: boolean('done').default(false).notNull(),
  auto: boolean('auto').default(false).notNull(),
  related: text('related'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 11. Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').default('system').notNull(),
  read: boolean('read').default(false).notNull(),
  time: text('time').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 12. Marketing Campaigns
export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  channel: text('channel').notNull(), // Facebook, Instagram, Google Ads, Email, WhatsApp, LinkedIn
  status: text('status').default('Scheduled').notNull(), // Active, Paused, Scheduled, Completed
  budget: numeric('budget').default('100000').notNull(),
  spend: numeric('spend').default('0').notNull(),
  leads: integer('leads').default(0).notNull(),
  conversions: integer('conversions').default(0).notNull(),
  revenue: numeric('revenue').default('0').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 13. Telecalling & Call Logs
export const callLogs = pgTable('call_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  contact: text('contact').notNull(),
  company: text('company'),
  phone: text('phone'),
  agent: text('agent').notNull(),
  direction: text('direction').default('Outbound').notNull(), // Outbound, Inbound
  disposition: text('disposition').default('Interested').notNull(), // Interested, Callback, Not Interested, No Answer, Converted
  duration: integer('duration').default(0).notNull(),
  date: text('date').notNull(),
  followUp: text('follow_up'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 14. Internal Notes
export const notes = pgTable('notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').default('Internal').notNull(), // Lead, Customer, Internal
  related: text('related'),
  author: text('author').notNull(),
  date: text('date').notNull(),
  pinned: boolean('pinned').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 15. Invoices & Items
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  number: text('number').unique().notNull(),
  customer: text('customer').notNull(),
  contact: text('contact'),
  email: text('email'),
  issue: text('issue').notNull(),
  due: text('due').notNull(),
  tax: numeric('tax').default('18').notNull(),
  status: text('status').default('Pending').notNull(), // Paid, Pending, Overdue, Cancelled, Draft
  paidOn: text('paid_on'),
  mode: text('mode'), // UPI, Bank transfer, Card
  items: jsonb('items').default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 16. Chat Channels & Messages
export const chatChannels = pgTable('chat_channels', {
  id: text('id').primaryKey(), // 'general', 'sales', etc.
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').default('channel').notNull(), // channel, dm
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: text('channel_id').notNull(),
  author: text('author').notNull(),
  text: text('text'),
  file: text('file'),
  time: text('time').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 17. Support Tickets
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  number: text('number').unique().notNull(),
  subject: text('subject').notNull(),
  customer: text('customer').notNull(),
  priority: text('priority').default('Medium').notNull(), // Urgent, High, Medium, Low
  status: text('status').default('Open').notNull(), // Open, In Progress, Resolved, Closed
  agent: text('agent'),
  category: text('category').default('Technical').notNull(), // Technical, Billing, Account, Feature Request
  created: text('created').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 18. Automation Workflows & Runs
export const automationWorkflows = pgTable('automation_workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  conditions: jsonb('conditions').default([]).notNull(),
  actions: jsonb('actions').default([]).notNull(),
  active: boolean('active').default(false).notNull(),
  runs: integer('runs').default(0).notNull(),
  lastRun: text('last_run'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  workflow: text('workflow').notNull(),
  status: text('status').notNull(), // Success, Failed
  time: text('time').notNull(),
  detail: text('detail'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 19. Integrations Status & Config
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Meta, Website, WhatsApp, Gmail, Google Calendar, Razorpay, Slack, Zapier, Tally
  connected: boolean('connected').default(false).notNull(),
  config: jsonb('config').default({}).notNull(),
  lastSync: text('last_sync'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 20. Activity Logs (Audit)
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  who: text('who').notNull(),
  what: text('what').notNull(),
  target: text('target').notNull(),
  type: text('type').default('system').notNull(),
  time: text('time').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 21. Website Enquiries
export const enquiries = pgTable('enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  page: text('page'),
  message: text('message'),
  time: text('time').notNull(),
  utm: text('utm'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 22. Subscriptions & Billing Records
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  plan: text('plan').default('Pro').notNull(),
  seats: integer('seats').default(4).notNull(),
  renews: text('renews').notNull(),
  billingCycle: text('billing_cycle').default('monthly').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const billingHistory = pgTable('billing_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organisations.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
  date: text('date').notNull(),
  seats: integer('seats').notNull(),
  plan: text('plan').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').default('Paid').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
