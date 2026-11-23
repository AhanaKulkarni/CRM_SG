'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Target,
  Users,
  CheckSquare,
  CalendarDays,
  BellRing,
  Megaphone,
  PhoneCall,
  Briefcase,
  MessagesSquare,
  StickyNote,
  Sparkles,
  BarChart3,
  Plug,
  Settings as SettingsIcon,
  Palette,
  Search,
  Bell,
  Plus,
  ChevronDown,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Check,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import { Avatar, FormModal, Modal, ago, cn, Button } from './kit';
import { ChatWidget } from './ChatWidget';

// Admin sees everything
export const NAV_ADMIN = [
  {
    section: 'Workspace',
    items: [
      ['Overview', '/app/overview', LayoutDashboard, 'overview'],
      ['Leads', '/app/leads', Target, 'leads'],
      ['Customers', '/app/customers', Users, 'customers'],
      ['Tasks & To-Do', '/app/tasks', CheckSquare, 'tasks'],
      ['Calendar', '/app/calendar', CalendarDays, 'calendar'],
      ['Reminders', '/app/reminders', BellRing, 'reminders'],
      ['Marketing', '/app/marketing', Megaphone, 'marketing'],
      ['Telecalling', '/app/telecalling', PhoneCall, 'telecalling'],
    ],
  },
  {
    section: 'Operations',
    items: [
      ['Employees', '/app/employees', Briefcase, 'employees'],
      ['Internal Chat', '/app/chat', MessagesSquare, 'chat'],
      ['Notes', '/app/notes', StickyNote, 'notes'],
    ],
  },
  {
    section: 'Intelligence',
    items: [
      ['AI Assistant', '/app/ai-assistant', Sparkles, 'ai-assistant'],
      ['Reports & Analytics', '/app/reports', BarChart3, 'reports'],
    ],
  },
  {
    section: 'Administration',
    items: [
      ['Integrations', '/app/integrations', Plug, 'integrations'],
      ['Settings', '/app/settings', SettingsIcon, 'settings'],
      ['White-Label', '/app/white-label', Palette, 'white-label'],
    ],
  },
];

// Callers see only their working tools
export const NAV_CALLER = [
  {
    section: 'Workspace',
    items: [
      ['Leads', '/app/leads', Target, 'leads'],
      ['Telecalling', '/app/telecalling', PhoneCall, 'telecalling'],
      ['Tasks & To-Do', '/app/tasks', CheckSquare, 'tasks'],
      ['Calendar', '/app/calendar', CalendarDays, 'calendar'],
      ['Reminders', '/app/reminders', BellRing, 'reminders'],
    ],
  },
  {
    section: 'Collaboration',
    items: [
      ['Internal Chat', '/app/chat', MessagesSquare, 'chat'],
      ['Notes', '/app/notes', StickyNote, 'notes'],
    ],
  },
];

// Keep backward compat for anything importing NAV
export const NAV = NAV_ADMIN;

export function BrandMark({ brand, size = 32, light }: any) {
  const b = brand || { name: 'NEXORA CRM', primary: '#6366F1' };
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {b.logo ? (
        <img
          src={b.logo}
          alt="logo"
          className="rounded-lg object-contain bg-white shrink-0"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
          style={{ width: size, height: size, background: b.primary || '#6366F1', fontSize: size * 0.48 }}
        >
          {(b.short || b.name || 'N')[0]}
        </span>
      )}
      <span className={cn('font-semibold tracking-tight truncate', light ? 'text-white' : 'text-[#111827]')}>
        {b.name || 'NEXORA CRM'}
      </span>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useStore();
  const pathname = usePathname();
  const role = state.session?.role || 'Caller';
  const isAdmin = role === 'Admin' || role === 'Super Admin';
  const nav = isAdmin ? NAV_ADMIN : NAV_CALLER;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <aside
        data-testid="sidebar"
        className={cn(
          'fixed z-50 inset-y-0 left-0 w-[260px] bg-[#111827] flex flex-col transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <BrandMark brand={state.brand} light size={30} />
          <button className="lg:hidden text-slate-400 hover:text-white p-1" onClick={onClose} data-testid="sidebar-close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-5">
          {nav.map((g) => (
            <div key={g.section}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                {g.section}
              </p>
              {g.items.map(([label, path, Icon, testKey]: any) => {
                const isActive = pathname === path || (path !== '/app/overview' && pathname.startsWith(path));
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={onClose}
                    data-testid={`nav-${testKey}`}
                    className={cn(
                      'group flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] font-medium transition-colors',
                      isActive ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0 transition-colors"
                      style={isActive ? { color: state.brand?.primary || '#6366F1' } : undefined}
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {isAdmin && (
          <div className="p-3 border-t border-white/5">
            <Link
              href="/admin"
              onClick={onClose}
              data-testid="nav-admin-portal"
              className="flex items-center gap-3 px-3 h-10 rounded-lg bg-white/5 text-slate-300 text-[13px] hover:bg-white/10 transition-colors font-medium"
            >
              <ShieldCheck className="w-4 h-4 text-brand" /> Super Admin Portal
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

function useOutside(ref: any, close: () => void) {
  useEffect(() => {
    const h = (e: any) => ref.current && !ref.current.contains(e.target) && close();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, close]);
}

function Dropdown({ trigger, children, testid, align = 'right', width = 'w-72' }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)} data-testid={testid}>
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 z-50 bg-white border border-[#E5E7EB] rounded-xl shadow-xl fade-up max-w-[calc(100vw-24px)]',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={(e: any) => e.target.closest('[data-close]') && setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function GlobalSearch() {
  const { state } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  const res = useMemo(() => {
    if (q.length < 2) return [];
    const m = (s: any) => String(s || '').toLowerCase().includes(q.toLowerCase());
    return [
      ...(state.leads || [])
        .filter((l: any) => m(l.name) || m(l.company))
        .slice(0, 4)
        .map((l: any) => ({ k: 'Lead', t: l.name, s: l.company, to: `/app/leads/${l.id}` })),
      ...(state.customers || [])
        .filter((c: any) => m(c.name) || m(c.company))
        .slice(0, 4)
        .map((c: any) => ({ k: 'Customer', t: c.company, s: c.name, to: `/app/customers/${c.id}` })),
      ...(state.employees || [])
        .filter((e: any) => m(e.name))
        .slice(0, 3)
        .map((e: any) => ({ k: 'Employee', t: e.name, s: e.designation, to: '/app/employees' })),
      ...(state.tickets || [])
        .filter((t: any) => m(t.subject) || m(t.number))
        .slice(0, 3)
        .map((t: any) => ({ k: 'Ticket', t: t.number, s: t.subject, to: '/app/support' })),
    ];
  }, [q, state]);

  return (
    <div className="relative flex-1 max-w-md" ref={ref}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        data-testid="global-search-input"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder="Search leads, customers, invoices…"
        className="w-full h-9 rounded-lg bg-slate-100 border border-transparent focus:bg-white focus:border-[#E5E7EB] pl-9 pr-3 text-sm outline-none transition-colors"
      />
      {open && q.length >= 2 && (
        <div
          className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#E5E7EB] rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto fade-up"
          data-testid="global-search-results"
        >
          {res.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No results found for "{q}"</p>
          ) : (
            res.map((r, i) => (
              <button
                key={i}
                data-testid={`search-result-${i}`}
                onClick={() => {
                  router.push(r.to);
                  setOpen(false);
                  setQ('');
                }}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 w-16 shrink-0">
                  {r.k}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate text-[#111827]">{r.t}</span>
                  <span className="block text-xs text-slate-500 truncate">{r.s}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const QUICK = [
  ['Lead', 'leads'],
  ['Customer', 'customers'],
  ['Task', 'tasks'],
  ['Meeting', 'events'],
  ['Reminder', 'reminders'],
];

const todayIso = new Date().toISOString().slice(0, 10);
const futureIso = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

const QDEF: Record<string, any> = {
  leads: { status: 'New', priority: 'Medium', source: 'Website', created: todayIso, value: 50000 },
  customers: { status: 'Active', segment: 'SMB', since: todayIso, lastContact: todayIso, ltv: 0 },
  tasks: { status: 'To Do', priority: 'Medium', due: futureIso },
  events: { date: todayIso, time: '11:00', duration: 30, type: 'Meeting' },
  tickets: { status: 'Open', priority: 'Medium', created: todayIso },
  reminders: { type: 'Follow-up', due: futureIso, time: '10:00', done: false, auto: false },
};

function Topbar({ onMenu }: { onMenu: () => void }) {
  const store = useStore();
  const { state } = store;
  const router = useRouter();
  const [quick, setQuick] = useState<string | null>(null);
  const [help, setHelp] = useState(false);

  const unread = (state.notifications || []).filter((n: any) => !n.read).length;
  const me = state.session || { name: 'Aisha Khan', email: 'admin@nexora.app', role: 'Admin' };

  const switchOrg = (o: any) => {
    store.set('brand', (b: any) => ({
      ...b,
      name: o.name,
      short: o.name.split(' ')[0],
      primary: o.primaryColor || o.primary,
      secondary: o.secondaryColor || o.secondary,
      logo: '',
    }));
    toast.success(`Switched to ${o.name}`, { description: 'Branding applied across the workspace' });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    router.push('/login');
  };

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] flex items-center gap-2 sm:gap-3 px-3 sm:px-6">
      <button className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900" onClick={onMenu} data-testid="mobile-menu-btn">
        <Menu className="w-5 h-5" />
      </button>

      <Dropdown
        testid="workspace-switcher"
        align="left"
        width="w-72"
        trigger={
          <button className="hidden md:flex items-center gap-2 h-9 px-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-sm font-medium max-w-[200px]">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="truncate">{state.brand?.name || 'NEXORA CRM'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        }
      >
        <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">Workspaces</p>
        {(state.orgs || []).map((o: any) => (
          <button
            key={o.id}
            data-close
            data-testid={`workspace-${o.id}`}
            onClick={() => switchOrg(o)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left"
          >
            <span
              className="w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: o.primaryColor || o.primary || '#6366F1' }}
            >
              {o.name[0]}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate">{o.name}</span>
              <span className="block text-xs text-slate-500">
                {o.plan} · {o.users || 4} users
              </span>
            </span>
            {state.brand?.name === o.name && <Check className="w-4 h-4 text-brand" />}
          </button>
        ))}
      </Dropdown>

      <GlobalSearch />

      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <Dropdown
          testid="quick-create-btn"
          width="w-52"
          trigger={
            <Button size="md" className="px-2.5 sm:px-4">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          }
        >
          <div className="p-1.5">
            {QUICK.map(([l, c]) => (
              <button
                key={c}
                data-close
                data-testid={`quick-create-${c}`}
                onClick={() => setQuick(c)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-50 font-medium text-slate-700"
              >
                New {l.toLowerCase()}
              </button>
            ))}
          </div>
        </Dropdown>

        <button
          data-testid="help-centre-btn"
          onClick={() => setHelp(true)}
          className="hidden sm:flex p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <Dropdown
          testid="notifications-btn"
          width="w-[340px]"
          trigger={
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span
                  className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-semibold flex items-center justify-center"
                  data-testid="notification-count"
                >
                  {unread}
                </span>
              )}
            </button>
          }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                data-testid="mark-all-read-btn"
                className="text-xs text-brand font-medium hover:underline"
                onClick={() =>
                  store.set('notifications', (ns: any[]) => ns.map((n) => ({ ...n, read: true })))
                }
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(state.notifications || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No notifications</p>
            ) : (
              state.notifications.slice(0, 7).map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => store.update('notifications', n.id, { read: true })}
                  className="w-full text-left flex gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                >
                  <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-brand')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#111827]">{n.title}</span>
                    <span className="block text-xs text-slate-500 line-clamp-2">{n.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-1">{ago(n.time)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            data-close
            onClick={() => router.push('/app/reminders?tab=Notification%20Centre')}
            className="w-full py-2.5 text-xs font-medium text-brand hover:bg-slate-50 border-t border-slate-100 rounded-b-xl"
            data-testid="view-all-notifications-btn"
          >
            Open notification centre
          </button>
        </Dropdown>

        <Dropdown
          testid="user-profile-btn"
          width="w-60"
          trigger={
            <button className="flex items-center gap-2 pl-1">
              <Avatar name={me.name} size={32} />
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="text-sm font-semibold text-[#111827]">{me.name}</p>
            <p className="text-xs text-slate-500 truncate">
              {me.email} · {me.role}
            </p>
          </div>
            <div className="p-1.5 text-sm">
              <button
                data-close
                onClick={() => router.push('/app/settings')}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                Account settings
              </button>
              {(me.role === 'Admin' || me.role === 'Super Admin') && (
                <button
                  data-close
                  onClick={() => router.push('/admin')}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  Super Admin Portal
                </button>
              )}
              <button
                data-close
                data-testid="logout-btn"
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
        </Dropdown>
      </div>

      {quick && (
        <FormModal
          open
          onClose={() => setQuick(null)}
          title={`New ${QUICK.find((x) => x[1] === quick)?.[0].toLowerCase()}`}
          fields={(FIELDS as any)[quick](state)}
          initial={QDEF[quick]}
          onSubmit={(v: any) => {
            store.add(quick, {
              ...QDEF[quick],
              ...v,
              ...(quick === 'tickets' ? { number: `TK-${1050 + (state.tickets?.length || 0)}` } : {}),
            });
            toast.success('Created successfully');
          }}
        />
      )}

      <Modal open={help} onClose={() => setHelp(false)} title="Help centre" description="Guides and shortcuts for your workspace" testid="help-modal">
        <div className="space-y-2">
          {(state.kb || []).slice(0, 5).map((k: any) => (
            <div key={k.id} className="flex justify-between items-center p-3 rounded-lg border border-[#E5E7EB] text-sm">
              <span>{k.title}</span>
              <span className="text-xs text-slate-400">{k.category}</span>
            </div>
          ))}
        </div>
        <div className="pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              setHelp(false);
              router.push('/app/support');
            }}
          >
            Open Support & Services
          </Button>
        </div>
      </Modal>
    </header>
  );
}

function MobileBottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();

  const items = [
    { label: 'Home', path: '/app/overview', icon: LayoutDashboard },
    { label: 'Leads', path: '/app/leads', icon: Target },
    { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
    { label: 'Calendar', path: '/app/calendar', icon: CalendarDays },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] z-40 flex items-center justify-around px-2 shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path || (item.path !== '/app/overview' && pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-colors',
              isActive ? 'text-brand font-semibold' : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <MoreHorizontal className="w-5 h-5 mb-1" />
        <span>More</span>
      </button>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[260px] min-w-0 flex flex-col min-h-screen">
        <Topbar onMenu={() => setOpen(true)} />
        <main
          className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1500px] w-full mx-auto min-w-0 pb-24 lg:pb-8"
          data-testid="main-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMore={() => setOpen(true)} />

      {/* Floating AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
