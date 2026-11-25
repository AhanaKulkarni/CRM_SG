'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Check,
  Building2,
  MoreHorizontal,
  LifeBuoy,
  CreditCard,
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
      ['Support', '/app/support', LifeBuoy, 'support'],
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
      ['Subscription', '/app/subscription', CreditCard, 'subscription'],
      ['Settings', '/app/settings', SettingsIcon, 'settings'],
      ['White-Label', '/app/white-label', Palette, 'white-label'],
    ],
  },
];

// Callers see their working tools
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

export const NAV = NAV_ADMIN;

export function BrandMark({ brand, size = 32, light, collapsed = false }: any) {
  const b = brand || { name: 'AetherX', primary: '#6965ED', secondary: '#8B83F6', logo: '/logo.png' };
  return (
    <div className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'justify-center')}>
      {b.logo ? (
        <img
          src={b.logo}
          alt={b.name || 'AetherX'}
          className="rounded-xl object-contain bg-white shrink-0 p-0.5 shadow-sm"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
          style={{ width: size, height: size, background: b.primary || '#6965ED', fontSize: size * 0.46 }}
        >
          {(b.short || b.name || 'A')[0]}
        </span>
      )}
      {!collapsed && (
        <div className="min-w-0">
          <span className={cn('block font-semibold tracking-tight truncate text-sm', light ? 'text-white' : 'text-[#1C2433]')}>
            {b.name || 'AetherX'}
          </span>
          {light && <span className="block text-[10px] text-slate-400 tracking-wide">Enterprise CRM</span>}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { state } = useStore();
  const pathname = usePathname();
  const role = state.session?.role || 'Caller';
  const isAdmin = role === 'Admin' || role === 'Super Admin';
  const nav = isAdmin ? NAV_ADMIN : NAV_CALLER;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#171C2C]/55 backdrop-blur-xs lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        data-testid="sidebar"
        className={cn(
          'fixed z-50 inset-y-0 left-0 bg-[#171C2C] flex flex-col transition-all duration-200 ease-out border-r border-white/5 shadow-2xl lg:shadow-none lg:translate-x-0',
          collapsed ? 'lg:w-[78px] w-[264px]' : 'w-[264px]',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.07] shrink-0">
          <BrandMark brand={state.brand} light size={32} collapsed={collapsed && !open} />
          <button
            type="button"
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            onClick={onClose}
            data-testid="sidebar-close-btn"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-5">
          {nav.map((g) => (
            <div key={g.section}>
              {(!collapsed || open) && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                  {g.section}
                </p>
              )}
              <div className="space-y-0.5">
                {g.items.map(([label, path, Icon, testKey]: any) => {
                  const isActive = pathname === path || (path !== '/app/overview' && pathname.startsWith(path));
                  return (
                    <Link
                      key={path}
                      href={path}
                      onClick={onClose}
                      title={collapsed && !open ? label : undefined}
                      data-testid={`nav-${testKey}`}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] font-medium transition-all duration-150',
                        collapsed && !open && 'justify-center px-0',
                        isActive
                          ? 'bg-white/[0.11] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.2)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      )}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full"
                          style={{ background: state.brand?.primary || '#6965ED' }}
                        />
                      )}
                      <Icon
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={isActive ? { color: state.brand?.secondary || '#8B83F6' } : undefined}
                      />
                      {(!collapsed || open) && <span className="truncate">{label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {isAdmin && (
          <div className="p-3 border-t border-white/[0.07]">
            <Link
              href="/admin"
              onClick={onClose}
              title={collapsed && !open ? 'Super Admin Portal' : undefined}
              data-testid="nav-admin-portal"
              className={cn(
                'flex items-center gap-3 px-3 h-10 rounded-xl bg-white/[0.06] text-slate-200 text-[13px] hover:bg-white/[0.12] transition-colors font-medium',
                collapsed && !open && 'justify-center px-0'
              )}
            >
              <ShieldCheck className="w-4 h-4 text-[#8B83F6] shrink-0" />
              {(!collapsed || open) && <span className="truncate">Super Admin Portal</span>}
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute top-full mt-2 z-50 bg-[#F5F6FA] border border-white/80 rounded-2xl shadow-2xl max-w-[calc(100vw-24px)] overflow-hidden',
              width,
              align === 'right' ? 'right-0' : 'left-0'
            )}
            onClick={(e: any) => e.target.closest('[data-close]') && setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
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
        .filter((l: any) => m(l.name) || m(l.company) || m(l.phone))
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
      <Search className="w-4 h-4 text-[#778196] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        data-testid="global-search-input"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        placeholder="Search leads, contacts, calls…"
        className="w-full h-9 rounded-xl neu-inset pl-9 pr-3 text-sm text-[#1C2433] placeholder:text-[#778196] outline-none transition-all duration-150"
      />
      <AnimatePresence>
        {open && q.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full mt-2 left-0 right-0 bg-[#F5F6FA] border border-white/80 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
            data-testid="global-search-results"
          >
            {res.length === 0 ? (
              <p className="p-4 text-sm text-[#778196]">No results found for "{q}"</p>
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
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-white/80 border-b border-[#E1E5ED]/60 last:border-0 transition-colors"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-brand w-16 shrink-0">
                    {r.k}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate text-[#1C2433]">{r.t}</span>
                    <span className="block text-xs text-[#778196] truncate">{r.s}</span>
                  </span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  tasks: { status: 'Open', priority: 'Medium', due: futureIso },
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
  const me = state.session || { name: 'Admin', email: 'admin@aetherx.app', role: 'Admin' };

  const switchOrg = (o: any) => {
    store.set('brand', (b: any) => ({
      ...b,
      name: o.name,
      short: o.name.split(' ')[0],
      primary: o.primaryColor || o.primary,
      secondary: o.secondaryColor || o.secondary,
      logo: o.logo || b.logo || '/logo.png',
    }));
    toast.success(`Switched to ${o.name}`, { description: 'Branding applied across the workspace' });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    router.push('/login');
  };

  return (
    <header className="h-16 sticky top-0 z-30 bg-[#EEF1F6]/85 backdrop-blur-xl border-b border-[#E1E5ED] flex items-center gap-2 sm:gap-3 px-3 sm:px-6">
      <button
        type="button"
        className="lg:hidden p-2 rounded-xl neu-btn text-[#1C2433] shrink-0"
        onClick={onMenu}
        data-testid="mobile-menu-btn"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <Dropdown
        testid="workspace-switcher"
        align="left"
        width="w-72"
        trigger={
          <button
            type="button"
            className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl neu-btn text-sm font-medium text-[#1C2433] max-w-[200px]"
          >
            <Building2 className="w-4 h-4 text-brand shrink-0" />
            <span className="truncate">{state.brand?.name || 'AetherX'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#778196] shrink-0" />
          </button>
        }
      >
        <p className="px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#778196]">Workspaces</p>
        {(state.orgs || []).map((o: any) => (
          <button
            key={o.id}
            data-close
            data-testid={`workspace-${o.id}`}
            onClick={() => switchOrg(o)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/80 text-left transition-colors"
          >
            <span
              className="w-7 h-7 rounded-lg text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: o.primaryColor || o.primary || '#6965ED' }}
            >
              {o.name[0]}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium truncate text-[#1C2433]">{o.name}</span>
              <span className="block text-xs text-[#778196]">
                {o.plan} · {o.users || 4} users
              </span>
            </span>
            {state.brand?.name === o.name && <Check className="w-4 h-4 text-brand" />}
          </button>
        ))}
      </Dropdown>

      <GlobalSearch />

      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        <Dropdown
          testid="quick-create-btn"
          width="w-52"
          trigger={
            <Button size="md" className="px-2.5 sm:px-3.5">
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
                className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-white font-medium text-[#1C2433] transition-colors"
              >
                New {l.toLowerCase()}
              </button>
            ))}
          </div>
        </Dropdown>

        <button
          type="button"
          data-testid="help-centre-btn"
          onClick={() => setHelp(true)}
          className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl neu-btn text-[#778196] hover:text-[#1C2433]"
          aria-label="Help centre"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <Dropdown
          testid="notifications-btn"
          width="w-[340px]"
          trigger={
            <button
              type="button"
              className="relative flex items-center justify-center w-9 h-9 rounded-xl neu-btn text-[#778196] hover:text-[#1C2433]"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E15B63] text-white text-[10px] font-semibold flex items-center justify-center shadow-sm"
                  data-testid="notification-count"
                >
                  {unread}
                </span>
              )}
            </button>
          }
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E1E5ED]">
            <span className="font-semibold text-sm text-[#1C2433]">Notifications</span>
            {unread > 0 && (
              <button
                data-testid="mark-all-read-btn"
                className="text-xs text-brand font-medium hover:underline"
                onClick={() => store.set('notifications', (ns: any[]) => ns.map((n) => ({ ...n, read: true })))}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {(state.notifications || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-[#778196]">No notifications</p>
            ) : (
              state.notifications.slice(0, 7).map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => store.update('notifications', n.id, { read: true })}
                  className="w-full text-left flex gap-3 px-4 py-3 hover:bg-white/80 border-b border-[#E1E5ED]/60 last:border-0 transition-colors"
                >
                  <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', n.read ? 'bg-transparent' : 'bg-brand')} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[#1C2433]">{n.title}</span>
                    <span className="block text-xs text-[#778196] line-clamp-2">{n.body}</span>
                    <span className="block text-[11px] text-[#778196]/80 mt-1">{ago(n.time)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            data-close
            onClick={() => router.push('/app/reminders?tab=Notification%20Centre')}
            className="w-full py-2.5 text-xs font-semibold text-brand hover:bg-white border-t border-[#E1E5ED] transition-colors"
            data-testid="view-all-notifications-btn"
          >
            Open notification centre
          </button>
        </Dropdown>

        <Dropdown
          testid="user-profile-btn"
          width="w-60"
          trigger={
            <button type="button" className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-xl neu-btn">
              <Avatar name={me.name} size={28} />
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#778196]" />
            </button>
          }
        >
          <div className="px-4 py-3 border-b border-[#E1E5ED]">
            <p className="text-sm font-semibold text-[#1C2433] truncate">{me.name}</p>
            <p className="text-xs text-[#778196] truncate">
              {me.email} · {me.role}
            </p>
          </div>
          <div className="p-1.5 text-sm">
            <button
              data-close
              onClick={() => router.push('/app/settings')}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-white flex items-center gap-2 text-[#1C2433] transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-[#778196]" />
              Account settings
            </button>
            {(me.role === 'Admin' || me.role === 'Super Admin') && (
              <button
                data-close
                onClick={() => router.push('/admin')}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-white flex items-center gap-2 text-[#1C2433] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-brand" />
                Super Admin Portal
              </button>
            )}
            <button
              data-close
              data-testid="logout-btn"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#E15B63]/10 text-[#E15B63] flex items-center gap-2 transition-colors"
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
            <div key={k.id} className="flex justify-between items-center p-3 rounded-xl neu-surface text-sm">
              <span className="text-[#1C2433] font-medium">{k.title}</span>
              <span className="text-xs text-[#778196]">{k.category}</span>
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
  const { state } = useStore();
  const role = state.session?.role || 'Caller';
  const isAdmin = role === 'Admin' || role === 'Super Admin';

  const items = [
    { label: 'Home', path: isAdmin ? '/app/overview' : '/app/telecalling', icon: LayoutDashboard },
    { label: 'Leads', path: '/app/leads', icon: Target },
    { label: 'Tasks', path: '/app/tasks', icon: CheckSquare },
    { label: 'Calendar', path: '/app/calendar', icon: CalendarDays },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#F5F6FA]/95 backdrop-blur-xl border-t border-[#E1E5ED] z-40 pb-safe shadow-[0_-4px_20px_rgba(28,36,51,0.08)]"
    >
      <div className="h-16 flex items-center justify-around px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path !== '/app/overview' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.label}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 text-[11px] font-medium transition-all duration-150',
                isActive ? 'text-brand font-semibold neu-inset' : 'text-[#778196] hover:text-[#1C2433]'
              )}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 text-[11px] font-medium text-[#778196] hover:text-[#1C2433] transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 mb-1" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#EEF1F6] text-[#1C2433]">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className={cn('min-w-0 flex flex-col min-h-screen transition-[padding] duration-200', collapsed ? 'lg:pl-[78px]' : 'lg:pl-[264px]')}>
        <Topbar onMenu={() => setOpen(true)} />
        <main
          className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1520px] w-full mx-auto min-w-0 pb-24 lg:pb-8"
          data-testid="main-content"
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <MobileBottomNav onOpenMore={() => setOpen(true)} />
      <ChatWidget />
    </div>
  );
}
