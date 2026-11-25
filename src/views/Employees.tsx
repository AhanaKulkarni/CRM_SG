'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Mail, Phone, MapPin, Plus, Check, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS, DEPTS, ROLES } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Stat,
  Avatar,
  Button,
  Modal,
  Tabs,
  SearchInput,
  Segmented,
  FormModal,
  CHART,
  Progress,
  fmtDate,
  cn,
  Empty,
} from '@/components/kit';

const PERMS = ['view', 'create', 'edit', 'delete', 'export', 'settings'];
const todayIso = new Date().toISOString().slice(0, 10);

export default function EmployeesView() {
  const store = useStore();
  const { state } = store;
  const [tab, setTab] = useState('Directory');
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('All');
  const [prof, setProf] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'Caller', designation: 'Telecaller' });
  const [showPw, setShowPw] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) {
      toast.error('Name, email and password are required.');
      return;
    }
    setUserLoading(true);
    try {
      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      toast.success(`Account created for ${data.user.name}`, {
        description: `They can now log in with ${data.user.email}`,
      });
      setAddingUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'Caller', designation: 'Telecaller' });
      store.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUserLoading(false);
    }
  };

  const employees = state.employees || [];
  const activeCount = employees.filter((e: any) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e: any) => e.status === 'On Leave').length;
  const avgAttendance =
    employees.length > 0
      ? Math.round(
          employees.reduce((a: number, e: any) => a + Number(e.attendance || 95), 0) / employees.length
        )
      : 100;

  const list = employees.filter(
    (e: any) =>
      (dept === 'All' || e.dept === dept) &&
      (!q || `${e.name} ${e.designation} ${e.email}`.toLowerCase().includes(q.toLowerCase()))
  );

  const week = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (5 - i));
    return d;
  });

  const permissions = state.permissions || {
    Admin: ['view', 'create', 'edit', 'delete', 'export', 'settings'],
    Manager: ['view', 'create', 'edit', 'export'],
    'Sales Executive': ['view', 'create', 'edit'],
    Agent: ['view', 'create'],
    Viewer: ['view'],
  };

  const togglePerm = (role: string, p: string) => {
    store.set('permissions', (pm: any) => {
      const cur = pm?.[role] || [];
      const updated = cur.includes(p) ? cur.filter((x: string) => x !== p) : [...cur, p];
      return { ...pm, [role]: updated };
    });
  };

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Your team directory, roles, attendance and performance."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setAddingUser(true)} data-testid="add-user-account-btn">
              <UserPlus className="w-4 h-4" />
              Add Login Account
            </Button>
            <Button onClick={() => setAdding(true)} data-testid="employee-add-btn">
              <Plus className="w-4 h-4" />
              Add employee
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 stagger">
        <Stat label="Active employees" value={activeCount.toString()} />
        <Stat label="Departments" value={DEPTS.length} />
        <Stat label="Avg. attendance" value={`${avgAttendance}%`} />
        <Stat label="On leave today" value={onLeaveCount.toString()} />
      </div>

      <Tabs
        testid="employee-tabs"
        tabs={['Directory', 'Table', 'Roles & Permissions', 'Attendance', 'Performance']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Directory' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Search employees…"
              testid="employee-search"
              className="w-full sm:w-64"
            />
            <Segmented
              testid="employee-dept"
              options={['All', ...DEPTS]}
              value={dept}
              onChange={setDept}
            />
          </div>

          {list.length === 0 ? (
            <Card className="p-8">
              <Empty
                title="No employees found"
                text="Add employees to build your company directory."
                action={
                  <Button onClick={() => setAdding(true)}>
                    <Plus className="w-4 h-4" />
                    Add Employee
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger">
              {list.map((e: any) => (
                <Card
                  key={e.id}
                  className="p-5 hover-lift cursor-pointer"
                  onClick={() => setProf(e)}
                  data-testid={`employee-card-${e.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={e.name} size={44} color={e.color} />
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-[#1C2433]">{e.name}</p>
                      <p className="text-xs text-[#778196] truncate">{e.designation}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    <Badge tone="neutral">{e.dept}</Badge>
                    <Badge tone="brand">{e.role}</Badge>
                    <Badge>{e.status}</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#778196]">Performance</span>
                      <span className="font-medium text-[#1C2433]">{e.score || 80}</span>
                    </div>
                    <Progress value={e.score || 80} color={e.color} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'Table' && (
        <CrudTable
          testid="employees"
          collection="employees"
          entity="Employee"
          addLabel="Add employee"
          fields={FIELDS.employees()}
          defaults={{
            status: 'Active',
            attendance: 95,
            score: 75,
            leadsHandled: 0,
            dealsWon: 0,
            joined: todayIso,
            color: '#6965ED',
          }}
          searchKeys={['name', 'email', 'designation']}
          filters={[
            { key: 'dept', label: 'departments', options: DEPTS },
            { key: 'role', label: 'roles', options: ROLES },
          ]}
          columns={[
            {
              key: 'name',
              label: 'Employee',
              render: (e: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={e.name} size={26} color={e.color} />
                  <span className="font-medium text-[#1C2433]">{e.name}</span>
                </span>
              ),
            },
            { key: 'dept', label: 'Department' },
            { key: 'designation', label: 'Designation' },
            { key: 'role', label: 'Role', render: (e: any) => <Badge tone="brand">{e.role}</Badge> },
            { key: 'status', label: 'Status', render: (e: any) => <Badge>{e.status}</Badge> },
            { key: 'email', label: 'Email' },
          ]}
        />
      )}

      {tab === 'Roles & Permissions' && (
        <Card className="overflow-x-auto" data-testid="permissions-matrix">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#778196] bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Role</th>
                {PERMS.map((p) => (
                  <th key={p} className="px-4 py-3 text-center font-medium">
                    {p}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Members</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium text-[#1C2433]">{r}</td>
                  {PERMS.map((p) => {
                    const on = (permissions[r] || []).includes(p);
                    return (
                      <td key={p} className="px-4 py-3 text-center">
                        <button
                          data-testid={`perm-${r.replace(/\s/g, '-').toLowerCase()}-${p}`}
                          onClick={() => {
                            togglePerm(r, p);
                            toast.success(`${r}: ${p} ${on ? 'revoked' : 'granted'}`);
                          }}
                          className={cn(
                            'w-5 h-5 rounded-md border inline-flex items-center justify-center transition-colors',
                            on ? 'bg-brand border-transparent text-white' : 'border-slate-300'
                          )}
                        >
                          {on && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-[#778196] font-medium">
                    {employees.filter((e: any) => e.role === r).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'Attendance' && (
        <Card className="overflow-x-auto" data-testid="attendance-grid">
          {employees.length === 0 ? (
            <div className="p-8">
              <Empty title="No attendance records" text="Add employees to track daily attendance." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#778196] bg-slate-50/70 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  {week.map((d) => (
                    <th key={d.toISOString()} className="px-3 py-3 text-center font-medium">
                      {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-right">Monthly</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e: any) => (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-5 py-2.5">
                      <span className="flex items-center gap-2">
                        <Avatar name={e.name} size={24} color={e.color} />
                        <span className="font-medium text-[#1C2433]">{e.name}</span>
                      </span>
                    </td>
                    {week.map((d, j) => {
                      const isSunday = d.getDay() === 0;
                      const isLeave = e.status === 'On Leave' && j >= 4;
                      const st = isSunday ? '-' : isLeave ? 'L' : 'P';
                      return (
                        <td key={j} className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              'inline-flex w-7 h-7 rounded-md items-center justify-center text-xs font-semibold',
                              {
                                P: 'bg-emerald-50 text-emerald-700',
                                A: 'bg-red-50 text-red-600',
                                L: 'bg-amber-50 text-amber-700',
                                '-': 'bg-slate-50 text-slate-400',
                              }[st]
                            )}
                          >
                            {st}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 font-medium text-right tabular-nums text-[#1C2433]">
                      {e.attendance || 95}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'Performance' && (
        <Card data-testid="performance-chart">
          <CardHead title="Performance metrics" sub="Leads handled vs. deals won" />
          {employees.length === 0 ? (
            <div className="h-80 flex items-center justify-center">
              <Empty
                title="No performance data yet"
                text="Employee deals and metrics will render here once employees are active."
              />
            </div>
          ) : (
            <div className="h-80 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={employees.map((e: any) => ({
                    name: e.name.split(' ')[0],
                    Leads: e.leadsHandled || 0,
                    Deals: e.dealsWon || 0,
                    Score: e.score || 75,
                  }))}
                >
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="name" tick={CHART.axis} axisLine={false} tickLine={false} />
                  <YAxis tick={CHART.axis} axisLine={false} tickLine={false} />
                  <Tooltip {...CHART.tooltip} />
                  <Bar dataKey="Leads" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Leads" />
                  <Bar dataKey="Deals" fill="#26A879" radius={[4, 4, 0, 0]} name="Deals Won" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      <Modal open={!!prof} onClose={() => setProf(null)} title="Employee profile" testid="employee-profile-modal">
        {prof && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={prof.name} size={60} color={prof.color} />
              <div>
                <p className="text-lg font-semibold text-[#1C2433]">{prof.name}</p>
                <p className="text-sm text-[#778196]">
                  {prof.designation} · {prof.dept}
                </p>
                <div className="flex gap-1.5 mt-1.5">
                  <Badge tone="brand">{prof.role}</Badge>
                  <Badge>{prof.status}</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
              {[
                [Mail, prof.email],
                [Phone, prof.phone || '—'],
                [MapPin, prof.location || '—'],
              ].map(([Icon, v]: any, i: number) => (
                <p key={i} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{v}</span>
                </p>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              {[
                ['Score', prof.score || 75],
                ['Attend.', `${prof.attendance || 95}%`],
                ['Leads', prof.leadsHandled || 0],
                ['Deals', prof.dealsWon || 0],
              ].map(([l, v]: any) => (
                <div key={l} className="rounded-lg bg-slate-50 p-3">
                  <p className="font-semibold text-[#1C2433]">{v}</p>
                  <p className="text-[11px] text-[#778196]">{l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Joined {fmtDate(prof.joined)} · Open tasks:{' '}
              {(state.tasks || []).filter((t: any) => t.assignee === prof.name && t.status !== 'Done').length}
            </p>
          </div>
        )}
      </Modal>

      <FormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add employee"
        fields={FIELDS.employees()}
        initial={{ status: 'Active', role: 'Caller', dept: 'Telecalling' }}
        onSubmit={(v: any) => {
          store.add('employees', {
            attendance: 95,
            score: 75,
            leadsHandled: 0,
            dealsWon: 0,
            joined: todayIso,
            color: '#6965ED',
            ...v,
          });
          toast.success('Employee added');
        }}
      />

      {/* Add Login Account Modal */}
      <Modal
        open={addingUser}
        onClose={() => setAddingUser(false)}
        title="Create Login Account"
        description="Create CRM login credentials for a team member. They will be able to log in with these credentials."
        testid="add-user-modal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C2433] mb-1">Full Name</label>
            <input
              className="w-full h-9 rounded-lg border border-[#E1E5ED] px-3 text-sm outline-none focus:border-brand transition-colors"
              placeholder="e.g. Rahul Sharma"
              value={userForm.name}
              onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C2433] mb-1">Email</label>
            <input
              type="email"
              className="w-full h-9 rounded-lg border border-[#E1E5ED] px-3 text-sm outline-none focus:border-brand transition-colors"
              placeholder="rahul@yourcompany.com"
              value={userForm.email}
              onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C2433] mb-1">Role</label>
            <select
              className="w-full h-9 rounded-lg border border-[#E1E5ED] px-3 text-sm outline-none focus:border-brand bg-white transition-colors"
              value={userForm.role}
              onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="Caller">Caller (Telecalling access only)</option>
              <option value="Admin">Admin (Full access)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C2433] mb-1">Designation</label>
            <input
              className="w-full h-9 rounded-lg border border-[#E1E5ED] px-3 text-sm outline-none focus:border-brand transition-colors"
              placeholder="e.g. Telecaller, Sales Executive"
              value={userForm.designation}
              onChange={(e) => setUserForm((f) => ({ ...f, designation: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C2433] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="w-full h-9 rounded-lg border border-[#E1E5ED] px-3 pr-10 text-sm outline-none focus:border-brand transition-colors"
                placeholder="Minimum 4 characters"
                value={userForm.password}
                onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setAddingUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={userLoading}>
              <KeyRound className="w-4 h-4" />
              {userLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
