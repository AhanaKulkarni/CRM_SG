# CRM_SG
# NEXORA CRM — Complete Business Management & Intelligence Platform

A full-stack, responsive enterprise CRM and business operating system built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Drizzle ORM, and Recharts.

---

## ⚡ Quick Deployment on Vercel

1. Push this repository to GitHub (`CRM_SG`).
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Framework Preset: **Next.js** (auto-detected).
4. (Optional) Configure environment variables:
   - `DATABASE_URL` or `SUPABASE_DATABASE_URL`: PostgreSQL connection string (if using managed Postgres/Supabase). If not provided, it seamlessly runs with persistent local storage.
5. Click **Deploy**.

---

## 🔑 Authorized Credentials (Pre-Provisioned Accounts)

In strict enterprise compliance, public signup is disabled. Use the pre-provisioned demo accounts authenticated via bcrypt and secure HTTP-only session cookies:

| Email | Role | Default Password | Initial Assigned Name |
| :--- | :--- | :--- | :--- |
| **`admin@nexora.app`** | **Admin** | `demo1234` | Aisha Khan |
| **`superadmin@nexora.app`** | **Super Admin** | `demo1234` | Platform Owner |
| **`manager@nexora.app`** | **Standard User** | `demo1234` | Rohan Mehta |
| **`agent@nexora.app`** | **Standard User** | `demo1234` | Priya Nair |

> 1-click quick login buttons are also provided on the `/login` screen for rapid evaluation.

---

## 🏗️ Core Features & Modules

### 1. Workspace
- **Overview Dashboard** (`/app/overview`): Dynamic KPI analytics, revenue trend area chart, lead conversion funnel, channel distribution pie chart, upcoming meetings agenda, pending tasks, and employee performance leaderboard.
- **Lead Management** (`/app/leads`): Interactive Table & Kanban pipeline view with drag-and-drop stage updates, stage filtering, CSV export, 1-click customer conversion, and comprehensive lead profile view (`/app/leads/:id`).
- **Customer Management** (`/app/customers`): Customer directory with segment classification (`Enterprise`, `SMB`, `Startup`), Lifetime Value (LTV), and detailed account history (`/app/customers/:id`).
- **Tasks & To-Do** (`/app/tasks`): 5 view modes (Kanban, List, Personal/Team to-do lists, Daily Planner, Workload by Employee) with drag-and-drop status transitions.
- **Calendar** (`/app/calendar`): Month, Week, and Day views with category-coded scheduling and direct lead/customer association.
- **Reminders & Notifications** (`/app/reminders`): Automated notification rules engine and notification centre.
- **Marketing** (`/app/marketing`): Campaign performance, budget spend, revenue attribution, channel breakdown, and ROI calculations.
- **Telecalling** (`/app/telecalling`): Integrated browser dialer with active call duration timer, mute/unmute, and disposition logging (`Interested`, `Callback`, `Converted`).

### 2. Operations
- **Employees** (`/app/employees`): Team roster, department filters, interactive Roles & Permissions matrix, and attendance tracking.
- **Internal Chat** (`/app/chat`): Real-time departmental channels (`#general`, `#sales`, `#marketing`, `#support`), direct messaging, and file attachments.
- **Notes** (`/app/notes`): Pinned notes, company association, author attribution, and instant search.
- **Invoices & Billing** (`/app/invoices`): GST 18% calculation, dynamic line items, printable PDF preview modal (`#invoice-print`), and payment recording (UPI/Bank/Card).

### 3. Intelligence
- **AI Assistant** (`/app/ai-assistant`): Natural language query interface linked directly to active database records for leads, invoices, and scheduling.
- **AI Calling** (`/app/ai-calling`): Automated voice call simulator with audio waveforms, streaming transcripts, intent detection, and automated CRM dispositioning.
- **AI Chatbot** (`/app/ai-chatbot`): Website chatbot configuration and simulator with automated lead qualification.
- **Automation** (`/app/automation`): Visual trigger-condition-action workflow builder with execution history.
- **Reports & Analytics** (`/app/reports`): 5 deep-dive tabs (Revenue, Lead Conversion, Employee Productivity, Campaign Performance, Customer Acquisition) with date range filters and CSV export.

### 4. Administration & White-Label
- **Integrations** (`/app/integrations`): Meta lead ad sync, website form builder with arrow ordering, live form preview, webhook endpoint, API keys, and device previews.
- **Support & Services** (`/app/support`): Support ticket management, conversation threads, and searchable knowledge base.
- **Subscription** (`/app/subscription`): Plan switching (Basic ₹999 / Pro ₹1,299), user seat counter with 18% GST calculation, and billing history.
- **Settings** (`/app/settings`): User profile, organisation defaults, notifications, security (2FA/SSO), and database reset.
- **White-Label Configuration** (`/app/white-label`): Instant primary/secondary color customization, logo upload, login headline customization, and side-by-side live preview.
- **Super Admin Portal** (`/admin`): Multi-tenant management, organisation suspension/reactivation, user governance, plan upgrades, and usage analytics.

### 5. Webhook Integration
- Inbound lead capture endpoint: `POST /api/webhooks/leads`

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions & Route Handlers)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, Sonner (Toasts)
- **Visualizations**: Recharts
- **Database**: Drizzle ORM, Postgres.js client, SQLite / Persistent JSON store
- **Authentication**: Bcrypt password hashing, HTTP-only secure session cookies

---

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/AhanaKulkarni/CRM_SG.git
cd CRM_SG

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
npm run build

# Start production server
npm start
```
