'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  Target,
  Users,
  TrendingUp,
  IndianRupee,
  FileClock,
  Briefcase,
  CheckCircle2,
  CalendarClock,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  Card,
  CardHead,
  PageHeader,
  Stat,
  Segmented,
  Avatar,
  Badge,
  inr,
  ago,
  fmtDate,
  invTotal,
  CHART,
  Button,
  Progress,
  Empty,
} from '@/components/kit';

const RANGES: Record<string, number> = { '7D': 7, '30D': 30, '90D': 12, '12M': 12 };
export const SOURCE_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#EC4899', '#94A3B8'];

export default function OverviewView() {
  const { state } = useStore();
  const [range, setRange] = useState('12M');

  const leads = state.leads || [];
  const customers = state.customers || [];
  const invoices = state.invoices || [];
  const tasks = state.tasks || [];
  const events = state.events || [];
  const employees = state.employees || [];
  const activity = state.activity || [];

  // Computed metrics from real database records
  const totalLeads = leads.length;
  const wonLeads = leads.filter((l: any) => l.status === 'Won').length;
  const activeCustomers = customers.filter((c: any) => c.status === 'Active').length;
  const convRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0.0%';

  const paidInvoices = invoices.filter((i: any) => i.status === 'Paid');
  const pendingInvoices = invoices.filter((i: any) => i.status === 'Pending');
  const revenueTotal = paidInvoices.reduce((a: number, i: any) => a + invTotal(i), 0);

  const activeEmployees = employees.filter((e: any) => e.status === 'Active').length;
  const completedTasks = tasks.filter((t: any) => t.status === 'Done').length;
  const taskCompRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) + '%' : '0%';

  const todayIso = new Date().toISOString().slice(0, 10);
  const next7DaysIso = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const upcomingMeetings = events.filter((e: any) => e.date >= todayIso && e.date <= next7DaysIso);

  // Revenue chart data from real records or empty state
  const revenueData = useMemo(() => {
    const n = RANGES[range] || 12;
    return Array.from({ length: n }, (_, i) => {
      const d = new Date();
      let label;
      if (range === '12M') {
        d.setMonth(d.getMonth() - (n - 1 - i));
        label = d.toLocaleString('en-IN', { month: 'short' });
      } else if (range === '90D') {
        d.setDate(d.getDate() - (n - 1 - i) * 7);
        label = `W${i + 1}`;
      } else {
        d.setDate(d.getDate() - (n - 1 - i));
        label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      }

      // Calculate actual revenue in this period
      const monthPrefix = d.toISOString().slice(0, 7);
      const periodPaid = paidInvoices
        .filter((iv: any) => (iv.paidOn || iv.issue || '').startsWith(monthPrefix))
        .reduce((sum: number, iv: any) => sum + invTotal(iv), 0);

      return {
        label,
        revenue: periodPaid,
        target: periodPaid > 0 ? Math.round(periodPaid * 1.15) : 0,
      };
    });
  }, [range, paidInvoices]);

  // Lead Funnel
  const funnel = [
    ['Leads', totalLeads],
    ['Contacted', leads.filter((l: any) => ['Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won'].includes(l.status)).length],
    ['Qualified', leads.filter((l: any) => ['Qualified', 'Proposal', 'Negotiation', 'Won'].includes(l.status)).length],
    ['Proposal', leads.filter((l: any) => ['Proposal', 'Negotiation', 'Won'].includes(l.status)).length],
    ['Won', wonLeads],
  ];

  // Sources distribution
  const sources = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l: any) => {
      const s = l.source || 'Website';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const userName = (state.session?.name || 'Admin').split(' ')[0];
  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';

  return (
    <div>
      <PageHeader
        title={`Good ${greeting}, ${userName}`}
        subtitle="Here's what's happening across your business today."
        actions={
          <>
            <Segmented
              testid="overview-range"
              options={Object.keys(RANGES)}
              value={range}
              onChange={setRange}
            />
            <Link href="/app/reports">
              <Button variant="secondary">View reports</Button>
            </Link>
          </>
        }
      />

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 stagger">
        <Stat
          testid="stat-total-leads"
          label="Total Leads"
          value={totalLeads.toLocaleString('en-IN')}
          delta={totalLeads > 0 ? '+100%' : undefined}
          icon={Target}
        />
        <Stat
          testid="stat-active-customers"
          label="Active Customers"
          value={activeCustomers.toLocaleString('en-IN')}
          icon={Users}
        />
        <Stat
          testid="stat-conversion-rate"
          label="Conversion Rate"
          value={convRate}
          icon={TrendingUp}
        />
        <Stat
          testid="stat-revenue"
          label="Revenue"
          value={inr(revenueTotal)}
          icon={IndianRupee}
        />
        <Stat
          testid="stat-pending-invoices"
          label="Pending Invoices"
          value={pendingInvoices.length.toString()}
          icon={FileClock}
          hint="awaiting payment"
        />
        <Stat
          testid="stat-active-employees"
          label="Active Employees"
          value={activeEmployees.toString()}
          icon={Briefcase}
        />
        <Stat
          testid="stat-tasks-completed"
          label="Tasks Completed"
          value={taskCompRate}
          icon={CheckCircle2}
        />
        <Stat
          testid="stat-upcoming-meetings"
          label="Upcoming Meetings"
          value={upcomingMeetings.length.toString()}
          icon={CalendarClock}
          hint="next 7 days"
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card className="lg:col-span-2" data-testid="revenue-chart">
          <CardHead
            title="Revenue overview"
            sub={`Collected revenue · ${range}`}
            right={<span className="text-sm font-semibold tabular-nums">{inr(revenueTotal)}</span>}
          />
          {revenueTotal === 0 && paidInvoices.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <Empty
                title="No revenue recorded yet"
                text="Invoices marked as paid will generate your revenue timeline here."
                action={
                  <Link href="/app/invoices?new=1">
                    <Button size="sm">Create Invoice</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="h-72 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="label" tick={CHART.axis} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={CHART.axis}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000).toFixed(0) + 'k'}`
                    }
                    width={52}
                  />
                  <Tooltip {...CHART.tooltip} formatter={(v: any) => inr(v)} />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#CBD5E1"
                    strokeDasharray="4 4"
                    fill="none"
                    name="Target"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--brand)"
                    strokeWidth={2.2}
                    fill="url(#rev)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card data-testid="conversion-funnel">
          <CardHead title="Lead conversion funnel" sub="Stage-to-stage progression" />
          {totalLeads === 0 ? (
            <div className="p-6">
              <Empty
                title="No leads yet"
                text="Add leads to see your conversion funnel progression."
                action={
                  <Link href="/app/leads">
                    <Button size="sm">
                      <Plus className="w-3.5 h-3.5" />
                      Add Lead
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="px-5 pb-5 space-y-3.5">
              {funnel.map(([k, v]: any, i: number) => {
                const max = Math.max(1, totalLeads);
                const pct = Math.round((v / max) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600">{k}</span>
                      <span className="font-medium tabular-nums">
                        {v.toLocaleString('en-IN')}{' '}
                        <span className="text-slate-400 text-xs">{i ? `${pct}%` : ''}</span>
                      </span>
                    </div>
                    <div className="h-7 rounded-md bg-slate-50 overflow-hidden">
                      <div
                        className="h-full rounded-md transition-[width] duration-700"
                        style={{
                          width: `${Math.max(4, pct)}%`,
                          background: 'var(--brand)',
                          opacity: 1 - i * 0.15,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Lead acquisition sources */}
        <Card data-testid="lead-sources-chart" className="min-w-0">
          <CardHead title="Lead acquisition sources" sub="Share of total leads" />
          {sources.length === 0 ? (
            <div className="p-6">
              <Empty title="No lead sources" text="Sources will appear as leads are captured." />
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sources} dataKey="value" innerRadius={52} outerRadius={80} paddingAngle={2}>
                      {sources.map((s, i) => (
                        <Cell key={s.name} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-5 pb-5 text-xs">
                {sources.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                    />
                    <span className="text-slate-600 flex-1 truncate">{s.name}</span>
                    <span className="font-medium tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Recent activities */}
        <Card data-testid="recent-activities">
          <CardHead title="Recent activity" sub="Across your workspace" />
          <div className="px-5 pb-5 space-y-4 max-h-[300px] overflow-y-auto thin-scroll">
            {activity.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity recorded</p>
            ) : (
              activity.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex gap-3">
                  <Avatar name={a.who} size={28} />
                  <div className="min-w-0 text-sm">
                    <p className="text-slate-700">
                      <span className="font-medium text-[#111827]">{a.who}</span> {a.what}{' '}
                      <span className="font-medium text-[#111827]">{a.target}</span>
                    </p>
                    <p className="text-xs text-slate-400">{ago(a.time)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming meetings */}
        <Card data-testid="upcoming-meetings">
          <CardHead
            title="Upcoming meetings"
            right={
              <Link href="/app/calendar" className="text-xs text-brand font-medium hover:underline">
                Calendar
              </Link>
            }
          />
          <div className="px-3 pb-3">
            {upcomingMeetings.length === 0 ? (
              <div className="py-6">
                <Empty
                  title="No upcoming meetings"
                  text="Schedule discovery calls and demos on your calendar."
                  action={
                    <Link href="/app/calendar">
                      <Button size="sm" variant="secondary">
                        Schedule
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              upcomingMeetings.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50">
                  <div className="w-11 text-center rounded-lg bg-brand-soft py-1">
                    <p className="text-[10px] uppercase text-brand font-semibold">
                      {new Date(m.date).toLocaleString('en-IN', { month: 'short' })}
                    </p>
                    <p className="text-sm font-semibold">{new Date(m.date).getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-[#111827]">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {m.time} · {m.duration} min · {m.withPerson || 'Team'}
                    </p>
                  </div>
                  <Badge tone="neutral">{m.type}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Row 4 */}
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        {/* Pending tasks */}
        <Card data-testid="pending-tasks">
          <CardHead
            title="Pending tasks"
            right={
              <Link href="/app/tasks" className="text-xs text-brand font-medium hover:underline">
                All tasks
              </Link>
            }
          />
          <div className="px-5 pb-5 space-y-3">
            {tasks.filter((t: any) => t.status !== 'Done').length === 0 ? (
              <Empty
                title="All tasks completed"
                text="Create new tasks to assign to your team."
                action={
                  <Link href="/app/tasks">
                    <Button size="sm">Create Task</Button>
                  </Link>
                }
              />
            ) : (
              tasks
                .filter((t: any) => t.status !== 'Done')
                .slice(0, 5)
                .map((t: any) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate font-medium text-[#111827]">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.assignee || 'Unassigned'} · due {fmtDate(t.due)}
                      </p>
                    </div>
                    <Badge>{t.priority}</Badge>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Employee performance */}
        <Card data-testid="employee-performance">
          <CardHead title="Employee performance" sub="Score & closed deals" />
          {employees.length === 0 ? (
            <div className="p-6">
              <Empty
                title="No employees added"
                text="Add employees to track attendance and performance."
                action={
                  <Link href="/app/employees">
                    <Button size="sm">Add Employee</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="h-60 px-2 pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employees.slice(0, 6).map((e: any) => ({
                    name: e.name.split(' ')[0],
                    score: e.score || 0,
                    deals: e.dealsWon || 0,
                  }))}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid stroke={CHART.grid} horizontal={false} />
                  <XAxis type="number" tick={CHART.axis} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={CHART.axis}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip {...CHART.tooltip} />
                  <Bar
                    dataKey="score"
                    fill="var(--brand)"
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                    name="Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card data-testid="recent-invoices">
          <CardHead
            title="Recent invoices"
            right={
              <Link
                href="/app/invoices"
                className="text-xs text-brand font-medium flex items-center gap-1 hover:underline"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="px-5 pb-5 space-y-3">
            {invoices.length === 0 ? (
              <Empty
                title="No invoices created"
                text="Generate GST-compliant invoices for your clients."
                action={
                  <Link href="/app/invoices?new=1">
                    <Button size="sm">Create Invoice</Button>
                  </Link>
                }
              />
            ) : (
              invoices.slice(0, 5).map((iv: any) => (
                <div key={iv.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-[#111827]">{iv.customer}</p>
                    <p className="text-xs text-slate-500">{iv.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">{inr(invTotal(iv))}</p>
                    <Badge>{iv.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
