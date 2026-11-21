import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const DB_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const LOCAL_DB_FILE = path.join(DB_DIR, 'nexora_db.json');

// Ensure local storage directory exists
if (!fs.existsSync(DB_DIR)) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
  } catch (e) {
    // Ignore if running in a read-only environment
  }
}

// Global Postgres connection if DATABASE_URL is provided
let drizzleDb: any = null;
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DATABASE_URL;

if (databaseUrl) {
  try {
    const client = postgres(databaseUrl, { max: 10, prepare: false });
    drizzleDb = drizzle(client, { schema });
  } catch (err) {
    console.warn('[DB] Could not connect to Postgres URL, falling back to local persistent store.', err);
  }
}

// Initial seed data for essential setup (Zero demo records for business data)
function getInitialDbState() {
  const hash = bcrypt.hashSync('demo1234', 10);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const defaultOrgId = '00000000-0000-0000-0000-000000000001';

  return {
    organisations: [
      {
        id: defaultOrgId,
        name: 'NEXORA CRM',
        domain: 'demo.nexora.app',
        plan: 'Pro',
        users: 4,
        status: 'Active',
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        region: 'Mumbai (ap-south-1)',
        createdAt: now,
        updatedAt: now,
      },
    ],
    authorisedUsers: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        orgId: defaultOrgId,
        name: 'Aisha Khan',
        email: 'admin@nexora.app',
        passwordHash: hash,
        role: 'Admin',
        designation: 'Head of Sales',
        phone: '+91 98200 11001',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        orgId: defaultOrgId,
        name: 'Platform Owner',
        email: 'superadmin@nexora.app',
        passwordHash: hash,
        role: 'Super Admin',
        designation: 'Platform Administrator',
        phone: '+91 98200 11002',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        orgId: defaultOrgId,
        name: 'Rohan Mehta',
        email: 'manager@nexora.app',
        passwordHash: hash,
        role: 'Standard User',
        designation: 'Senior Account Executive',
        phone: '+91 98200 11003',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        orgId: defaultOrgId,
        name: 'Priya Nair',
        email: 'agent@nexora.app',
        passwordHash: hash,
        role: 'Standard User',
        designation: 'Account Executive',
        phone: '+91 98200 11004',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    sessions: [],
    organisationSettings: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        orgId: defaultOrgId,
        brandName: 'NEXORA CRM',
        brandShort: 'Nexora',
        logo: '',
        favicon: '',
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        loginHeadline: 'Accelerate your entire revenue engine',
        loginSub: 'Manage leads, automate customer journeys, issue GST invoices and run AI-assisted telecalling in one command center.',
        legalName: 'Nexora Technologies Pvt. Ltd.',
        gstNumber: '27AADCN1234F1Z8',
        billingEmail: 'finance@nexora.app',
        phone: '+91 22 4912 8800',
        website: 'https://nexora.app',
        address: 'BKC, Bandra East, Mumbai, Maharashtra 400051',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        updatedAt: now,
      },
    ],
    // Essential empty business tables per Part 23
    employees: [],
    leads: [],
    customers: [],
    tasks: [],
    todos: [],
    calendarEvents: [],
    reminders: [],
    notifications: [],
    marketingCampaigns: [],
    callLogs: [],
    notes: [],
    invoices: [],
    chatChannels: [
      { id: 'general', name: 'general', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'sales', name: 'sales', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'marketing', name: 'marketing', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'support', name: 'support', type: 'channel', orgId: defaultOrgId, createdAt: now },
    ],
    chatMessages: [],
    supportTickets: [],
    automationWorkflows: [
      {
        id: 'w0',
        orgId: defaultOrgId,
        name: 'New lead auto-assignment',
        trigger: 'New lead received',
        conditions: [{ field: 'Source', op: 'is any of', value: 'Facebook, Instagram, Website' }],
        actions: ['Assign employee (round-robin)', 'Send notification', 'Schedule follow-up (+1 day)', 'AI calling simulation'],
        active: false,
        runs: 0,
        lastRun: null,
        createdAt: now,
      },
      {
        id: 'w1',
        orgId: defaultOrgId,
        name: 'Overdue invoice reminder',
        trigger: 'Invoice overdue',
        conditions: [{ field: 'Amount', op: 'greater than', value: '₹10,000' }],
        actions: ['Send email reminder', 'Create task for finance', 'Send WhatsApp message'],
        active: false,
        runs: 0,
        lastRun: null,
        createdAt: now,
      },
    ],
    workflowRuns: [],
    integrations: [
      { id: 'int-meta', orgId: defaultOrgId, name: 'Meta', connected: false, config: {}, lastSync: null },
      { id: 'int-website', orgId: defaultOrgId, name: 'Website', connected: false, config: { apiKey: 'nx_live_' + Math.random().toString(36).slice(2, 16) }, lastSync: null },
      { id: 'int-whatsapp', orgId: defaultOrgId, name: 'WhatsApp', connected: false, config: {}, lastSync: null },
      { id: 'int-gmail', orgId: defaultOrgId, name: 'Gmail', connected: false, config: {}, lastSync: null },
      { id: 'int-cal', orgId: defaultOrgId, name: 'Google Calendar', connected: false, config: {}, lastSync: null },
      { id: 'int-razorpay', orgId: defaultOrgId, name: 'Razorpay', connected: false, config: {}, lastSync: null },
      { id: 'int-slack', orgId: defaultOrgId, name: 'Slack', connected: false, config: {}, lastSync: null },
      { id: 'int-zapier', orgId: defaultOrgId, name: 'Zapier', connected: false, config: {}, lastSync: null },
      { id: 'int-tally', orgId: defaultOrgId, name: 'Tally', connected: false, config: {}, lastSync: null },
    ],
    activityLogs: [
      {
        id: 'act-init',
        orgId: defaultOrgId,
        who: 'System',
        what: 'initialised workspace',
        target: 'NEXORA CRM',
        type: 'system',
        time: now,
        createdAt: now,
      },
    ],
    enquiries: [],
    subscriptions: [
      {
        id: 'sub-0',
        orgId: defaultOrgId,
        plan: 'Pro',
        seats: 4,
        renews: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
        billingCycle: 'monthly',
        updatedAt: now,
      },
    ],
    billingHistory: [],
    formFields: [
      { id: 'f0', label: 'Full name', type: 'text', required: true },
      { id: 'f1', label: 'Work email', type: 'email', required: true },
      { id: 'f2', label: 'Phone number', type: 'tel', required: true },
      { id: 'f3', label: 'Company size', type: 'select', required: false },
      { id: 'f4', label: 'How can we help?', type: 'textarea', required: false },
    ],
  };
}

// In-memory / file-backed persistent repository
class LocalDbRepository {
  private data: any;

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      try {
        const raw = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        const initial = getInitialDbState();
        for (const key of Object.keys(initial)) {
          if (!this.data[key]) {
            this.data[key] = initial[key];
          }
        }
        return;
      } catch (e) {
        console.error('Error reading local db file, resetting to initial state', e);
      }
    }
    this.data = getInitialDbState();
    this.persist();
  }

  private persist() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write local db', e);
    }
  }

  get(collection: string) {
    return this.data[collection] || [];
  }

  find(collection: string, predicate: (item: any) => boolean) {
    const list = this.get(collection);
    return list.find(predicate);
  }

  filter(collection: string, predicate: (item: any) => boolean) {
    const list = this.get(collection);
    return list.filter(predicate);
  }

  insert(collection: string, item: any) {
    if (!this.data[collection]) this.data[collection] = [];
    const rec = {
      id: item.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    };
    this.data[collection].unshift(rec);
    this.persist();
    return rec;
  }

  update(collection: string, id: string, patch: any) {
    if (!this.data[collection]) return null;
    const index = this.data[collection].findIndex((x: any) => x.id === id);
    if (index === -1) return null;
    this.data[collection][index] = {
      ...this.data[collection][index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data[collection][index];
  }

  delete(collection: string, id: string) {
    if (!this.data[collection]) return false;
    this.data[collection] = this.data[collection].filter((x: any) => x.id !== id);
    this.persist();
    return true;
  }

  set(collection: string, list: any[]) {
    this.data[collection] = list;
    this.persist();
  }

  getAll() {
    return this.data;
  }

  reset() {
    this.data = getInitialDbState();
    this.persist();
    return this.data;
  }
}

export const localDb = new LocalDbRepository();
export const crmDb = localDb;
export { drizzleDb, schema };
