import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const DB_DIR = process.env.VERCEL
  ? path.join('/tmp', '.data')
  : path.join(process.cwd(), '.data');
const LOCAL_DB_FILE = path.join(DB_DIR, 'aetherx_db.json');

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

// Initial seed data — 4 operational accounts (@startappguru) + 1 Developer account
function getInitialDbState() {
  const now = new Date().toISOString();
  const defaultOrgId = '00000000-0000-0000-0000-000000000001';

  const adminHash = bcrypt.hashSync(process.env.ADMIN_INITIAL_PASSWORD || 'Admin@StartApp2026', 10);
  const devHash = bcrypt.hashSync(process.env.DEVELOPER_INITIAL_PASSWORD || 'Dev@AetherX2026', 10);
  const caller1Hash = bcrypt.hashSync(process.env.CALLER1_INITIAL_PASSWORD || 'Caller1@StartApp2026', 10);
  const caller2Hash = bcrypt.hashSync(process.env.CALLER2_INITIAL_PASSWORD || 'Caller2@StartApp2026', 10);
  const caller3Hash = bcrypt.hashSync(process.env.CALLER3_INITIAL_PASSWORD || 'Caller3@StartApp2026', 10);

  return {
    organisations: [
      {
        id: defaultOrgId,
        name: 'StartAppGuru CRM',
        domain: 'startappguru',
        plan: 'Pro',
        users: 4,
        status: 'Active',
        logo: '/logo.png',
        primaryColor: '#6965ED',
        secondaryColor: '#8B83F6',
        region: 'Mumbai (ap-south-1)',
        createdAt: now,
        updatedAt: now,
      },
    ],
    // 4 operational accounts + 1 Developer account with individual credentials
    authorisedUsers: [
      {
        id: '10000000-0000-0000-0000-000000000001',
        orgId: defaultOrgId,
        name: 'Workspace Admin',
        email: 'admin@startappguru',
        passwordHash: adminHash,
        role: 'Admin',
        designation: 'Head of Sales & Operations',
        assignedCallerId: '+912269857438',
        phone: '',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        orgId: defaultOrgId,
        name: 'Developer',
        email: 'developer@startappguru',
        passwordHash: devHash,
        role: 'Developer',
        designation: 'Application Owner & Developer',
        assignedCallerId: '',
        phone: '',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        orgId: defaultOrgId,
        name: 'Caller 1',
        email: 'caller1@startappguru',
        passwordHash: caller1Hash,
        role: 'Caller',
        designation: 'Telecalling Executive',
        assignedCallerId: '+912269857438',
        phone: '',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        orgId: defaultOrgId,
        name: 'Caller 2',
        email: 'caller2@startappguru',
        passwordHash: caller2Hash,
        role: 'Caller',
        designation: 'Telecalling Executive',
        assignedCallerId: '+912269874466',
        phone: '',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        orgId: defaultOrgId,
        name: 'Caller 3',
        email: 'caller3@startappguru',
        passwordHash: caller3Hash,
        role: 'Caller',
        designation: 'Telecalling Executive',
        assignedCallerId: '+912269854754',
        phone: '',
        avatar: '',
        status: 'Active',
        createdAt: now,
        updatedAt: now,
      },
    ],
    sessions: [],
    organisationSettings: [],
    // 4 billable operational team members in employee directory
    employees: [
      {
        id: 'emp-admin',
        orgId: defaultOrgId,
        name: 'Workspace Admin',
        email: 'admin@startappguru',
        phone: '+91 22 6985 7438',
        dept: 'Sales',
        designation: 'Head of Sales & Operations',
        role: 'Admin',
        assignedCallerId: '+912269857438',
        status: 'Active',
        location: 'Mumbai',
        score: 95,
        createdAt: now,
      },
      {
        id: 'emp-caller1',
        orgId: defaultOrgId,
        name: 'Caller 1',
        email: 'caller1@startappguru',
        phone: '+91 22 6985 7438',
        dept: 'Telecalling',
        designation: 'Telecalling Executive',
        role: 'Caller',
        assignedCallerId: '+912269857438',
        status: 'Active',
        location: 'Mumbai',
        score: 88,
        createdAt: now,
      },
      {
        id: 'emp-caller2',
        orgId: defaultOrgId,
        name: 'Caller 2',
        email: 'caller2@startappguru',
        phone: '+91 22 6987 4466',
        dept: 'Telecalling',
        designation: 'Telecalling Executive',
        role: 'Caller',
        assignedCallerId: '+912269874466',
        status: 'Active',
        location: 'Mumbai',
        score: 90,
        createdAt: now,
      },
      {
        id: 'emp-caller3',
        orgId: defaultOrgId,
        name: 'Caller 3',
        email: 'caller3@startappguru',
        phone: '+91 22 6985 4754',
        dept: 'Telecalling',
        designation: 'Telecalling Executive',
        role: 'Caller',
        assignedCallerId: '+912269854754',
        status: 'Active',
        location: 'Mumbai',
        score: 87,
        createdAt: now,
      },
    ],
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
    // invoices removed — not a CRM feature
    chatChannels: [
      { id: 'general', name: 'general', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'sales', name: 'sales', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'marketing', name: 'marketing', type: 'channel', orgId: defaultOrgId, createdAt: now },
      { id: 'support', name: 'support', type: 'channel', orgId: defaultOrgId, createdAt: now },
    ],
    chatMessages: [],
    supportTickets: [],
    automationWorkflows: [],
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
        target: 'AetherX',
        type: 'system',
        time: now,
        createdAt: now,
      },
    ],
    enquiries: [],
    subscriptions: [],
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
        // Ensure all collections exist and migrate legacy Super Admin -> Developer + @startappguru accounts
        const initial = getInitialDbState();
        for (const key of Object.keys(initial)) {
          if (!this.data[key]) {
            this.data[key] = initial[key];
          }
        }
        let changed = false;
        const devSeed = initial.authorisedUsers.find((s: any) => s.role === 'Developer');
        this.data.authorisedUsers = (this.data.authorisedUsers || []).map((u: any) => {
          if (u.role === 'Super Admin') {
            changed = true;
            return {
              ...u,
              role: 'Developer',
              email: u.email === 'superadmin@aetherx.app' ? 'developer@startappguru' : u.email,
              passwordHash: u.email === 'superadmin@aetherx.app' && devSeed ? devSeed.passwordHash : u.passwordHash,
            };
          }
          if (u.email?.toLowerCase() === 'caller2@startappguru' && !u.assignedCallerId) {
            changed = true;
            return { ...u, assignedCallerId: '+912269874466' };
          }
          if (u.email?.toLowerCase() === 'caller3@startappguru' && !u.assignedCallerId) {
            changed = true;
            return { ...u, assignedCallerId: '+912269854754' };
          }
          return u;
        });
        for (const seedUser of initial.authorisedUsers) {
          const exists = this.data.authorisedUsers.some(
            (u: any) => u.email.toLowerCase() === seedUser.email.toLowerCase()
          );
          if (!exists) {
            this.data.authorisedUsers.push(seedUser);
            changed = true;
          }
        }
        if (changed) this.persist();
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
