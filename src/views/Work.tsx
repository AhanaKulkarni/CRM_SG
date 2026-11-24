'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Pin, Bell, Zap, Check, Search, Pencil } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS, TASK_STATUS, PRIORITIES } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Avatar,
  Button,
  Tabs,
  fmtDate,
  ago,
  Toggle,
  Empty,
  FormModal,
  ConfirmModal,
  SearchInput,
  inputCls,
  cn,
  Stat,
  Segmented,
} from '@/components/kit';
import { Kanban } from './Leads';

const todayIso = new Date().toISOString().slice(0, 10);
const futureIso = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 10);

const TDEF = { status: 'Open', priority: 'Medium', due: futureIso };
const TCOL: Record<string, string> = {
  Open: '#94A3B8',
  'In Progress': '#F59E0B',
  Completed: '#10B981',
  Cancelled: '#EF4444',
  'To Do': '#94A3B8',
  Review: '#8B5CF6',
  Done: '#10B981',
};

function TodoList({ scope }: { scope: string }) {
  const store = useStore();
  const [txt, setTxt] = useState('');
  const [due, setDue] = useState(todayIso);

  const list = (store.state.todos || []).filter((t: any) => t.scope === scope);

  return (
    <Card data-testid={`todo-${scope}`}>
      <CardHead
        title={scope === 'personal' ? 'My to-do list' : 'Team to-do list'}
        sub={`${list.filter((t: any) => t.done).length}/${list.length} completed`}
      />
      <form
        className="flex gap-2 px-5 pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!txt.trim()) return;
          store.add('todos', { text: txt, done: false, scope, due });
          setTxt('');
        }}
      >
        <input
          data-testid={`todo-${scope}-input`}
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder="Add a to-do…"
          className={inputCls}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className={cn(inputCls, 'w-36 hidden sm:block')}
        />
        <Button data-testid={`todo-${scope}-add`}>
          <Plus className="w-4 h-4" />
        </Button>
      </form>
      <div className="px-3 pb-3">
        {list.length === 0 ? (
          <Empty title="All clear" text="Nothing on this list yet." />
        ) : (
          list.map((t: any) => (
            <div key={t.id} className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50">
              <button
                data-testid={`todo-toggle-${t.id}`}
                onClick={() => store.update('todos', t.id, { done: !t.done })}
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                  t.done ? 'bg-brand border-transparent text-white' : 'border-slate-300'
                )}
              >
                {t.done && <Check className="w-3.5 h-3.5" />}
              </button>
              <span className={cn('flex-1 text-sm text-slate-800', t.done && 'line-through text-slate-400')}>
                {t.text}
              </span>
              <span className={cn('text-xs', t.due && t.due < todayIso && !t.done ? 'text-red-500 font-medium' : 'text-slate-400')}>
                {t.due === todayIso ? 'Today' : fmtDate(t.due)}
              </span>
              <button
                onClick={() => store.remove('todos', t.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function Planner() {
  const { state } = useStore();
  const evs = (state.events || []).filter((e: any) => e.date === todayIso);
  const tasks = (state.tasks || []).filter(
    (t: any) => t.due === todayIso || (t.due < todayIso && !['Completed', 'Done', 'Cancelled'].includes(t.status))
  );
  const slots = Array.from({ length: 10 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`);

  return (
    <div className="grid lg:grid-cols-3 gap-4" data-testid="daily-planner">
      <Card className="lg:col-span-2">
        <CardHead
          title="Daily planner"
          sub={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        />
        <div className="px-5 pb-5">
          {slots.map((s) => {
            const e = evs.filter((x: any) => x.time?.slice(0, 2) === s.slice(0, 2));
            return (
              <div key={s} className="flex gap-4 border-t border-slate-100 min-h-[52px] py-2">
                <span className="text-xs text-slate-400 w-12 pt-1">{s}</span>
                <div className="flex-1 space-y-1">
                  {e.length === 0 ? (
                    <span className="text-xs text-slate-300 block pt-1">Free</span>
                  ) : (
                    e.map((x: any) => (
                      <div
                        key={x.id}
                        className="rounded-lg px-3 py-2 text-sm bg-brand-soft border-l-2 border-brand"
                      >
                        <span className="font-medium text-[#111827]">{x.title}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {x.time} · {x.duration}m
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <CardHead title="Due today & overdue" sub={`${tasks.length} tasks`} />
        <div className="px-5 pb-5 space-y-3">
          {tasks.length ? (
            tasks.map((t: any) => (
              <div key={t.id} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-[#111827]">{t.title}</span>
                  <Badge>{t.priority}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.assignee || 'Unassigned'} ·{' '}
                  {t.due < todayIso ? <span className="text-red-500 font-medium">overdue</span> : 'today'}
                </p>
              </div>
            ))
          ) : (
            <Empty title="Nothing due today" text="No immediate task deadlines." />
          )}
        </div>
      </Card>
    </div>
  );
}

export function TasksView() {
  const store = useStore();
  const { state } = store;
  const [tab, setTab] = useState('Kanban');
  const [emp, setEmp] = useState('');
  const [edit, setEdit] = useState<any>(null);

  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  const tasks = isCaller
    ? (state.tasks || []).filter((t: any) => t.assignee === currentUser || !t.assignee)
    : state.tasks || [];
  const items = tasks.filter((t: any) => !emp || t.assignee === emp);
  const done = tasks.filter((t: any) => ['Completed', 'Done'].includes(t.status)).length;
  const inProgress = tasks.filter((t: any) => t.status === 'In Progress').length;
  const overdue = tasks.filter((t: any) => t.due < todayIso && !['Completed', 'Done', 'Cancelled'].includes(t.status)).length;

  const byEmp = (state.employees || [])
    .map((e: any) => ({
      e,
      n: tasks.filter((t: any) => t.assignee === e.name).length,
      d: tasks.filter((t: any) => t.assignee === e.name && ['Completed', 'Done'].includes(t.status)).length,
    }))
    .filter((x: any) => x.n > 0);

  return (
    <div>
      <PageHeader
        title="Tasks & To-Do"
        subtitle="Plan, assign and track work across your team."
        actions={
          <Button onClick={() => setEdit(TDEF)} data-testid="task-create-btn">
            <Plus className="w-4 h-4" />
            New task
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 stagger">
        <Stat label="Total tasks" value={tasks.length} />
        <Stat label="In progress" value={inProgress} />
        <Stat
          label="Completed"
          value={done}
          hint={`${Math.round((done / Math.max(1, tasks.length)) * 100)}% of tasks`}
        />
        <Stat label="Overdue" value={overdue} hint="need action" />
      </div>

      <Tabs
        testid="tasks-tabs"
        tabs={['Kanban', 'List', 'To-Do', 'Daily Planner', 'By Employee']}
        value={tab}
        onChange={setTab}
      />

      {['Kanban', 'List'].includes(tab) && (
        <select
          data-testid="task-employee-filter"
          className={cn(inputCls, 'w-auto mb-3')}
          value={emp}
          onChange={(e) => setEmp(e.target.value)}
        >
          <option value="">All employees</option>
          {(state.employees || []).map((e: any) => (
            <option key={e.id}>{e.name}</option>
          ))}
        </select>
      )}

      {tab === 'Kanban' && (
        <Kanban
          testid="task-board"
          items={items}
          stages={TASK_STATUS}
          field="status"
          colors={TCOL}
          onMove={(id: string, st: string) => {
            store.update('tasks', id, { status: st });
            toast.success(`Task moved to ${st}`);
          }}
          render={(t: any) => (
            <Card
              className="p-3 hover-lift cursor-pointer"
              onClick={() => setEdit(t)}
              data-testid={`task-card-${t.id}`}
            >
              <div className="flex justify-between gap-2">
                <p className="text-sm font-medium text-[#111827]">{t.title}</p>
                <Badge>{t.priority}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">{t.related || 'General'}</p>
              <div className="flex justify-between items-center mt-3">
                <span
                  className={cn(
                    'text-xs',
                    t.due < todayIso && t.status !== 'Done' ? 'text-red-500 font-medium' : 'text-slate-500'
                  )}
                >
                  Due {fmtDate(t.due)}
                </span>
                <Avatar name={t.assignee || '?'} size={22} />
              </div>
            </Card>
          )}
        />
      )}

      {tab === 'List' && (
        <CrudTable
          testid="tasks"
          rows={items}
          collection="tasks"
          entity="Task"
          addLabel="Add task"
          fields={FIELDS.tasks(state)}
          defaults={TDEF}
          searchKeys={['title', 'assignee', 'related']}
          filters={[
            { key: 'status', label: 'statuses', options: TASK_STATUS },
            { key: 'priority', label: 'priorities', options: PRIORITIES },
          ]}
          columns={[
            {
              key: 'title',
              label: 'Task',
              render: (t: any) => <span className="font-medium text-[#111827]">{t.title}</span>,
            },
            {
              key: 'assignee',
              label: 'Assignee',
              render: (t: any) => (
                <span className="flex items-center gap-2">
                  <Avatar name={t.assignee || '?'} size={22} />
                  {t.assignee || 'Unassigned'}
                </span>
              ),
            },
            { key: 'priority', label: 'Priority', render: (t: any) => <Badge>{t.priority}</Badge> },
            { key: 'status', label: 'Status', render: (t: any) => <Badge>{t.status}</Badge> },
            { key: 'due', label: 'Deadline', render: (t: any) => fmtDate(t.due) },
            { key: 'related', label: 'Related to', render: (t: any) => t.related || '—' },
          ]}
        />
      )}

      {tab === 'To-Do' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <TodoList scope="personal" />
          <TodoList scope="team" />
        </div>
      )}

      {tab === 'Daily Planner' && <Planner />}

      {tab === 'By Employee' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="tasks-by-employee">
          {byEmp.length === 0 ? (
            <Card className="p-6 col-span-3">
              <Empty title="No employee workloads" text="Assign tasks to employees to see workloads." />
            </Card>
          ) : (
            byEmp.map(({ e, n, d }: any) => (
              <Card key={e.id} className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} color={e.color} />
                  <div>
                    <p className="font-medium text-sm text-[#111827]">{e.name}</p>
                    <p className="text-xs text-slate-500">{e.designation}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm mt-4">
                  <span className="text-slate-500">{n} assigned</span>
                  <span className="font-medium text-[#111827]">{d} completed</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${(d / n) * 100}%` }} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <FormModal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit task' : 'New task'}
        fields={FIELDS.tasks(state)}
        initial={edit}
        onSubmit={(v: any) => {
          if (edit.id) {
            store.update('tasks', edit.id, v);
          } else {
            store.add('tasks', { ...TDEF, ...v });
            store.notify('Task assigned', `"${v.title}" assigned to ${v.assignee || 'team'}`, 'task');
          }
          toast.success(edit.id ? 'Task updated' : 'Task created');
        }}
      />
    </div>
  );
}

export function RemindersView() {
  const store = useStore();
  const { state } = store;
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams?.get('tab') || 'Reminders');
  const [nf, setNf] = useState('All');
  const [rules, setRules] = useState({
    followup: true,
    deadline: true,
    payment: true,
    meeting: false,
  });

  const reminders = state.reminders || [];
  const notifs = (state.notifications || []).filter(
    (n: any) => nf === 'All' || (nf === 'Unread' ? !n.read : n.read)
  );

  return (
    <div>
      <PageHeader title="Reminders & Notifications" subtitle="Never miss a follow-up, deadline or payment." />
      <Tabs
        testid="reminder-tabs"
        tabs={['Reminders', 'Notification Centre', 'Automation Rules']}
        value={tab}
        onChange={setTab}
      />

      {tab === 'Reminders' && (
        <CrudTable
          testid="reminders"
          collection="reminders"
          entity="Reminder"
          addLabel="New reminder"
          fields={FIELDS.reminders(state)}
          defaults={{ type: 'Follow-up', due: futureIso, time: '10:00', done: false, auto: false }}
          searchKeys={['title', 'owner']}
          filters={[{ key: 'type', label: 'types', options: ['Follow-up', 'Deadline', 'Payment', 'Meeting'] }]}
          rowActions={(r: any) => (
            <button
              data-testid={`reminder-done-${r.id}`}
              onClick={() => {
                store.update('reminders', r.id, { done: !r.done });
                toast.success(r.done ? 'Marked pending' : 'Reminder completed');
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              title="Toggle status"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
          columns={[
            {
              key: 'title',
              label: 'Reminder',
              render: (r: any) => (
                <span className={cn('font-medium', r.done ? 'line-through text-slate-400' : 'text-[#111827]')}>
                  {r.title}
                </span>
              ),
            },
            {
              key: 'type',
              label: 'Type',
              render: (r: any) => <Badge tone="brand">{r.type}</Badge>,
            },
            {
              key: 'due',
              label: 'When',
              render: (r: any) => (
                <span className={r.due < todayIso && !r.done ? 'text-red-500 font-medium' : ''}>
                  {fmtDate(r.due)} · {r.time}
                </span>
              ),
            },
            { key: 'owner', label: 'Owner', render: (r: any) => r.owner || '—' },
            {
              key: 'auto',
              label: 'Source',
              render: (r: any) =>
                r.auto ? (
                  <span className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                    <Zap className="w-3 h-3" />
                    Automated
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Manual</span>
                ),
            },
            {
              key: 'done',
              label: 'Status',
              render: (r: any) => (
                <Badge tone={r.done ? 'success' : 'warning'}>{r.done ? 'Done' : 'Pending'}</Badge>
              ),
            },
          ]}
        />
      )}

      {tab === 'Notification Centre' && (
        <Card data-testid="notification-centre">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[#E5E7EB]">
            <Segmented testid="notif-filter" options={['All', 'Unread', 'Read']} value={nf} onChange={setNf} />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  store.set('notifications', (ns: any[]) => ns.map((n) => ({ ...n, read: true })))
                }
                data-testid="notif-mark-all"
              >
                Mark all read
              </Button>
              <Button
                size="sm"
                data-testid="notif-test-btn"
                onClick={() => {
                  store.notify('System Notice', 'CRM automated workflows are active.', 'system');
                  toast('Test notification generated');
                }}
              >
                <Bell className="w-3.5 h-3.5" />
                Simulate
              </Button>
            </div>
          </div>
          {notifs.length === 0 ? (
            <Empty title="You're all caught up" text="No notifications in this filter." />
          ) : (
            notifs.map((n: any) => (
              <div
                key={n.id}
                className={cn(
                  'flex gap-4 px-5 py-4 border-b border-slate-100 last:border-0',
                  !n.read && 'bg-brand-soft/40'
                )}
                data-testid={`notif-${n.id}`}
              >
                <span
                  className={cn(
                    'mt-2 w-2 h-2 rounded-full shrink-0',
                    n.read ? 'bg-slate-200' : 'bg-brand'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111827]">{n.title}</p>
                  <p className="text-sm text-slate-500">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ago(n.time)} · {n.type}
                  </p>
                </div>
                <button
                  className="text-xs text-brand font-medium shrink-0 hover:underline"
                  onClick={() => store.update('notifications', n.id, { read: !n.read })}
                >
                  {n.read ? 'Mark unread' : 'Mark read'}
                </button>
              </div>
            ))
          )}
        </Card>
      )}

      {tab === 'Automation Rules' && (
        <Card className="divide-y divide-slate-100" data-testid="reminder-rules">
          {[
            ['followup', 'Follow-up reminders', 'Create a reminder 24h after a lead is contacted with no response'],
            ['deadline', 'Deadline notifications', 'Notify assignees 2h before a task deadline'],
            ['payment', 'Payment reminders', 'Remind finance 3 days before invoice due date'],
            ['meeting', 'Meeting alerts', 'Push alert 15 minutes before calendar events'],
          ].map(([k, t, d]: any) => (
            <div key={k} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-[#111827]">{t}</p>
                <p className="text-sm text-slate-500">{d}</p>
              </div>
              <Toggle
                testid={`rule-${k}`}
                checked={(rules as any)[k]}
                onChange={(v: boolean) => {
                  setRules((r) => ({ ...r, [k]: v }));
                  toast.success(`${t} ${v ? 'enabled' : 'disabled'}`);
                }}
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export function NotesView() {
  const store = useStore();
  const { state } = store;
  const [q, setQ] = useState('');
  const [type, setType] = useState('All');
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);

  const notes = state.notes || [];

  const fields = [
    { key: 'title', label: 'Title', required: true, full: true },
    { key: 'body', label: 'Note', type: 'textarea', required: true, full: true },
    { key: 'type', label: 'Attach to', type: 'select', options: ['Lead', 'Customer', 'Internal'] },
    {
      key: 'related',
      label: 'Lead / customer',
      type: 'select',
      options: [
        ...(state.leads || []).map((l: any) => l.name),
        ...(state.customers || []).map((c: any) => c.company),
      ],
    },
    { key: 'author', label: 'Author', type: 'select', options: (state.employees || []).map((e: any) => e.name) },
  ];

  const list = useMemo(
    () =>
      notes
        .filter(
          (n: any) =>
            (type === 'All' || n.type === type) &&
            (!q || `${n.title} ${n.body} ${n.related}`.toLowerCase().includes(q.toLowerCase()))
        )
        .sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [notes, q, type]
  );

  return (
    <div>
      <PageHeader
        title="Notes"
        subtitle="Internal notes attached to leads, customers and your team."
        actions={
          <Button
            onClick={() =>
              setEdit({
                type: 'Internal',
                author: state.session?.name || 'Aisha Khan',
                date: todayIso,
                pinned: false,
              })
            }
            data-testid="note-create-btn"
          >
            <Plus className="w-4 h-4" />
            New note
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Search notes…"
          testid="note-search"
          className="w-full sm:w-64"
        />
        <Segmented
          testid="note-filter-type"
          options={['All', 'Lead', 'Customer', 'Internal']}
          value={type}
          onChange={setType}
        />
      </div>

      {list.length === 0 ? (
        <Card className="p-8">
          <Empty
            title="No notes found"
            text="Add notes to keep track of decisions, client calls and team context."
            action={
              <Button
                onClick={() =>
                  setEdit({
                    type: 'Internal',
                    author: state.session?.name || 'Aisha Khan',
                    date: todayIso,
                    pinned: false,
                  })
                }
              >
                <Plus className="w-4 h-4" />
                Add note
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {list.map((n: any) => (
            <Card key={n.id} className="p-5 flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge tone={n.type === 'Internal' ? 'neutral' : 'brand'}>{n.type}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => store.update('notes', n.id, { pinned: !n.pinned })}
                      className={cn('p-1 rounded text-slate-400 hover:text-slate-600', n.pinned && 'text-brand')}
                      title="Pin note"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEdit(n)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDel(n)}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-[15px] text-[#111827]">{n.title}</h3>
                {n.related && <p className="text-xs text-brand font-medium mt-0.5">{n.related}</p>}
                <p className="text-sm text-slate-600 mt-2 line-clamp-4 leading-relaxed">{n.body}</p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs text-slate-400">
                <span>By {n.author}</span>
                <span>{fmtDate(n.date)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit note' : 'New note'}
        fields={fields}
        initial={edit}
        onSubmit={(v: any) => {
          if (edit.id) {
            store.update('notes', edit.id, v);
          } else {
            store.add('notes', { ...edit, ...v });
          }
          toast.success(edit.id ? 'Note updated' : 'Note created');
        }}
      />

      <ConfirmModal
        open={!!del}
        onClose={() => setDel(null)}
        title="Delete note?"
        text={`Delete note "${del?.title}"?`}
        onConfirm={() => {
          store.remove('notes', del.id);
          toast.success('Note deleted');
        }}
      />
    </div>
  );
}
