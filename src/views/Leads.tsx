'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Pencil,
  Trash2,
  Download,
  LayoutList,
  KanbanSquare,
  Plus,
  Eye,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS, STAGES, SOURCES, PRIORITIES } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Avatar,
  Button,
  Segmented,
  inr,
  fmtDate,
  FormModal,
  ConfirmModal,
  Empty,
  downloadCSV,
  Stat,
  cn,
  inputCls,
} from '@/components/kit';

const STAGE_COLOR: Record<string, string> = {
  New: '#6965ED',
  Assigned: '#3B82F6',
  Attempted: '#E7A23A',
  Contacted: '#0EA5E9',
  Interested: '#8B83F6',
  'Follow-up Scheduled': '#EC4899',
  Qualified: '#14B8A6',
  Converted: '#26A879',
  'Not Interested': '#64748B',
  'Do Not Call': '#E15B63',
  Won: '#26A879',
  Lost: '#64748B',
};

const todayIso = new Date().toISOString().slice(0, 10);
const LDEF = { status: 'New', priority: 'Medium', source: 'Website', value: 50000, created: todayIso };

export function checkDuplicateLead(newLead: any, allLeads: any[], currentId?: string) {
  const normPhone = (p: string) => (p || '').replace(/\D/g, '').slice(-10);
  const cleanEmail = (e: string) => (e || '').trim().toLowerCase();

  const newP = normPhone(newLead.phone);
  const newE = cleanEmail(newLead.email);

  return (allLeads || []).find((l: any) => {
    if (currentId && l.id === currentId) return false;
    if (newP && newP.length >= 7 && normPhone(l.phone) === newP) return true;
    if (newE && newE.length > 3 && cleanEmail(l.email) === newE) return true;
    return false;
  });
}

export function Kanban({ items = [], stages = [], field, onMove, render, colors = {}, testid }: any) {
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 thin-scroll" data-testid={testid}>
      {stages.map((st: string) => {
        const list = items.filter((i: any) => i[field] === st);
        return (
          <div
            key={st}
            data-testid={`${testid}-col-${st.toLowerCase().replace(/\s/g, '-')}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(st);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData('id');
              if (id) onMove(id, st);
            }}
            className={cn(
              'w-72 shrink-0 rounded-xl bg-slate-100/70 p-2.5 transition-colors',
              over === st && 'bg-brand-soft ring-2 ring-brand'
            )}
          >
            <div className="flex items-center gap-2 px-1.5 py-1 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: colors[st] || '#94A3B8' }} />
              <span className="text-sm font-semibold text-[#1C2433]">{st}</span>
              <span className="text-xs text-slate-400 ml-auto tabular-nums">{list.length}</span>
            </div>
            <div className="space-y-2 min-h-[80px]">
              {list.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center text-xs text-slate-400">
                  Drop cards here
                </div>
              ) : (
                list.map((it: any) => (
                  <div
                    key={it.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('id', it.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {render(it)}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function convertLead(store: any, lead: any) {
  store.add('customers', {
    name: lead.name,
    company: lead.company,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    segment: Number(lead.value) > 200000 ? 'Enterprise' : 'SMB',
    status: 'Active',
    ltv: lead.value,
    since: new Date().toISOString().slice(0, 10),
    owner: lead.owner,
    lastContact: new Date().toISOString().slice(0, 10),
    leadId: lead.id,
  });
  store.update('leads', lead.id, { status: 'Converted' });
  store.log(lead.owner || 'You', 'converted lead to customer', lead.company, 'lead');
  store.notify('Lead converted', `${lead.name} (${lead.company}) is now an active customer`, 'lead');
  toast.success('Lead converted to customer', { description: `${lead.company} added to Customers` });
}

export function LeadsView() {
  const store = useStore();
  const { state } = store;
  const router = useRouter();
  const [view, setView] = useState('List');
  const [owner, setOwner] = useState('');
  const [adding, setAdding] = useState(false);

  const isCaller = state.session?.role === 'Caller';
  const currentUser = state.session?.name;

  // Caller rule: view only own assigned leads (plus unassigned if any)
  const allLeads = state.leads || [];
  const leads = isCaller
    ? allLeads.filter((l: any) => l.owner === currentUser || !l.owner)
    : allLeads;

  const closedStatuses = ['Won', 'Lost', 'Converted', 'Not Interested', 'Do Not Call'];
  const open = leads.filter((l: any) => !closedStatuses.includes(l.status));
  const wonThisMonth = leads.filter((l: any) => ['Won', 'Converted'].includes(l.status)).length;
  const highPriority = open.filter((l: any) => l.priority === 'High').length;
  const pipelineValue = open.reduce((a: number, l: any) => a + Number(l.value || 0), 0);

  const cols = [
    {
      key: 'name',
      label: 'Lead',
      render: (l: any) => (
        <div className="flex items-center gap-3">
          <Avatar name={l.name} size={30} />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-[#1C2433]">{l.name}</p>
              {(l.dnc || l.status === 'Do Not Call') && (
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">DNC</span>
              )}
            </div>
            <p className="text-xs text-[#778196]">{l.company}</p>
          </div>
        </div>
      ),
    },
    { key: 'source', label: 'Source' },
    {
      key: 'status',
      label: 'Stage',
      render: (l: any) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${STAGE_COLOR[l.status] || '#64748B'}15`,
            color: STAGE_COLOR[l.status] || '#64748B',
          }}
        >
          {l.status}
        </span>
      ),
    },
    { key: 'priority', label: 'Priority', render: (l: any) => <Badge>{l.priority}</Badge> },
    { key: 'owner', label: 'Assigned to' },
    { key: 'value', label: 'Value', render: (l: any) => <span className="tabular-nums font-medium">{inr(l.value)}</span> },
    { key: 'created', label: 'Created', render: (l: any) => fmtDate(l.created) },
  ];

  const handleAddLead = (v: any) => {
    const dup = checkDuplicateLead(v, allLeads);
    if (dup) {
      toast.warning('Possible duplicate lead', {
        description: `Phone or email already associated with ${dup.name} (${dup.company}). Flagged for review.`,
      });
    }
    const leadOwner = isCaller ? (currentUser || v.owner) : v.owner;
    store.add('leads', {
      ...LDEF,
      ...v,
      owner: leadOwner,
      assignmentHistory: leadOwner
        ? [{ from: 'Unassigned', to: leadOwner, at: new Date().toISOString(), by: currentUser || 'Admin' }]
        : [],
    });
    toast.success('Lead created');
    setAdding(false);
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Capture, qualify and convert every enquiry in one pipeline."
        actions={
          <>
            <Segmented
              testid="leads-view"
              options={[
                {
                  value: 'List',
                  label: (
                    <span className="flex items-center gap-1">
                      <LayoutList className="w-3.5 h-3.5" />
                      List
                    </span>
                  ),
                },
                {
                  value: 'Pipeline',
                  label: (
                    <span className="flex items-center gap-1">
                      <KanbanSquare className="w-3.5 h-3.5" />
                      Pipeline
                    </span>
                  ),
                },
              ]}
              value={view}
              onChange={setView}
            />
            <Button
              variant="secondary"
              onClick={() => downloadCSV('leads', leads)}
              data-testid="leads-export-btn"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat label="Open leads" value={open.length} />
        <Stat label="Pipeline value" value={inr(pipelineValue)} />
        <Stat label="Won this month" value={wonThisMonth} hint="deals won" />
        <Stat label="High priority" value={highPriority} hint="need attention" />
      </div>

      {view === 'List' ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <CrudTable
              testid="leads"
              collection="leads"
              entity="Lead"
              addLabel="Add lead"
              columns={cols}
              fields={FIELDS.leads(state)}
              defaults={LDEF}
              searchKeys={['name', 'company', 'email', 'phone', 'owner']}
              onRowClick={(l: any) => router.push(`/app/leads/${l.id}`)}
              filters={[
                { key: 'status', label: 'stages', options: STAGES },
                { key: 'source', label: 'sources', options: SOURCES },
                { key: 'priority', label: 'priorities', options: PRIORITIES },
                {
                  key: 'owner',
                  label: 'owners',
                  options: [...new Set(leads.map((l: any) => l.owner).filter(Boolean))],
                },
              ]}
            />
          </div>

          {/* Mobile-Optimized Cards View */}
          <div className="sm:hidden space-y-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">All Leads ({leads.length})</span>
              <Button size="sm" onClick={() => setAdding(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Lead
              </Button>
            </div>
            {leads.length === 0 ? (
              <Card>
                <Empty
                  title="No leads yet"
                  text="Add your first lead to start building your pipeline."
                  action={
                    <Button onClick={() => setAdding(true)}>
                      <Plus className="w-4 h-4" />
                      Add lead
                    </Button>
                  }
                />
              </Card>
            ) : (
              leads.map((l: any) => (
                <Card
                  key={l.id}
                  className="p-4 hover-lift cursor-pointer"
                  onClick={() => router.push(`/app/leads/${l.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={l.name} size={36} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate text-[#1C2433]">{l.name}</p>
                        <p className="text-xs text-[#778196] truncate">{l.company}</p>
                      </div>
                    </div>
                    <Badge>{l.priority}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">Deal: </span>
                      <span className="font-semibold text-[#1C2433]">{inr(l.value)}</span>
                    </div>
                    <Badge>{l.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1 text-[11px] text-slate-400">
                    <span>{l.source}</span>
                    <span>Assigned: {l.owner || 'Unassigned'}</span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-3 items-center">
            <select
              data-testid="pipeline-owner-filter"
              className={cn(inputCls, 'w-auto')}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">All owners</option>
              {[...new Set(leads.map((l: any) => l.owner).filter(Boolean))].map((o: any) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <Button onClick={() => setAdding(true)} data-testid="pipeline-add-lead-btn">
              <Plus className="w-4 h-4" />
              Add lead
            </Button>
            <span className="text-xs text-[#778196] self-center hidden sm:inline">
              Drag cards between stages to update them.
            </span>
          </div>

          <Kanban
            testid="lead-pipeline"
            items={leads.filter((l: any) => !owner || l.owner === owner)}
            stages={STAGES}
            field="status"
            colors={STAGE_COLOR}
            onMove={(id: string, st: string) => {
              store.update('leads', id, { status: st });
              toast.success(`Moved to ${st}`);
            }}
            render={(l: any) => (
              <Card
                className="p-3 hover-lift cursor-pointer"
                data-testid={`pipeline-card-${l.id}`}
                onClick={() => router.push(`/app/leads/${l.id}`)}
              >
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium truncate text-[#1C2433]">{l.company}</p>
                  <Badge>{l.priority}</Badge>
                </div>
                <p className="text-xs text-[#778196] mt-0.5">
                  {l.name} · {l.source}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-semibold tabular-nums text-[#1C2433]">{inr(l.value)}</span>
                  <Avatar name={l.owner || '?'} size={22} />
                </div>
              </Card>
            )}
          />
        </>
      )}

      <FormModal
        open={adding}
        onClose={() => setAdding(false)}
        title="New lead"
        fields={FIELDS.leads(state)}
        initial={LDEF}
        onSubmit={handleAddLead}
      />
    </div>
  );
}

export function LeadDetailView({ leadId }: { leadId?: string }) {
  const store = useStore();
  const { state } = store;
  const router = useRouter();
  const params = useParams();
  const id = leadId || (params?.id as string);

  const isCaller = state.session?.role === 'Caller';
  const lead = (state.leads || []).find((l: any) => l.id === id);
  const [edit, setEdit] = useState(false);
  const [del, setDel] = useState(false);
  const [note, setNote] = useState('');

  if (!lead) {
    return (
      <Card className="p-8">
        <Empty
          title="Lead not found"
          text="This lead may have been deleted or moved."
          action={
            <Link href="/app/leads">
              <Button>Back to leads</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const notes = (state.notes || []).filter((n: any) => n.related === lead.name || n.related === lead.company);
  const calls = (state.calls || []).filter((c: any) => c.contact === lead.name);

  const timeline = [
    ...calls.map((c: any) => ({
      t: c.date,
      text: `${c.direction} call by ${c.agent} — ${c.disposition}${c.technicalResult ? ` (${c.technicalResult})` : ''}`,
      k: 'Call',
    })),
    ...notes.map((n: any) => ({
      t: n.date,
      text: `${n.author} added note: "${n.title || n.body?.slice(0, 40)}"`,
      k: 'Note',
    })),
    ...(lead.assignmentHistory || []).map((h: any) => ({
      t: h.at || lead.created,
      text: `Reassigned from ${h.from} to ${h.to} by ${h.by || 'Admin'}`,
      k: 'Assignment',
    })),
    {
      t: lead.created || todayIso,
      text: `Lead captured from ${lead.source} and assigned to ${lead.owner || 'Unassigned'}`,
      k: 'Created',
    },
  ].sort((a, b) => String(b.t).localeCompare(String(a.t)));

  const stageIdx = STAGES.indexOf(lead.status);
  const isDNC = lead.status === 'Do Not Call' || lead.dnc;

  return (
    <div>
      <button
        onClick={() => router.push('/app/leads')}
        className="flex items-center gap-1.5 text-sm text-[#778196] hover:text-slate-800 mb-4 transition-colors"
        data-testid="lead-back-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        All leads
      </button>

      {isDNC && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl mb-4 flex items-center gap-3 text-red-900 text-sm">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-red-700 font-bold text-xs">DNC</span>
          </div>
          <div>
            <p className="font-semibold text-sm">Do Not Call (DNC) Active</p>
            <p className="text-xs text-red-700">
              This contact has opted out. Outbound calling and messaging workflows must remain suppressed.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 fade-up">
        <Avatar name={lead.name} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1C2433]" data-testid="lead-detail-name">
              {lead.name}
            </h1>
            {isDNC && (
              <span className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded">Do Not Call</span>
            )}
          </div>
          <p className="text-[#778196] text-sm">
            {lead.company} · {inr(lead.value)} potential
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEdit(true)} data-testid="lead-edit-btn">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
          {!isCaller && (
            <Button variant="secondary" onClick={() => setDel(true)} data-testid="lead-delete-btn">
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
          <Button
            disabled={['Won', 'Converted'].includes(lead.status)}
            onClick={() => convertLead(store, lead)}
            data-testid="lead-convert-btn"
          >
            <UserCheck className="w-4 h-4" />
            {['Won', 'Converted'].includes(lead.status) ? 'Converted' : 'Convert to customer'}
          </Button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <Card className="p-4 mb-4 overflow-x-auto">
        <div className="flex gap-1.5 min-w-[760px]" data-testid="lead-stage-bar">
          {STAGES.map((s, i) => {
            const isPassed = i <= stageIdx && !['Not Interested', 'Do Not Call'].includes(lead.status);
            const isCurrent = lead.status === s;
            const isDncOrLost = ['Not Interested', 'Do Not Call'].includes(s) && lead.status === s;
            return (
              <button
                key={s}
                data-testid={`lead-stage-${s.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => {
                  store.update('leads', lead.id, {
                    status: s,
                    dnc: s === 'Do Not Call' ? true : lead.dnc,
                  });
                  toast.success(`Stage set to ${s}`);
                }}
                className={cn(
                  'flex-1 h-9 px-2 text-[11px] font-medium rounded-md transition-colors truncate',
                  isCurrent ? 'ring-2 ring-brand font-semibold' : '',
                  isPassed ? 'text-white' : 'bg-slate-100 text-[#778196] hover:bg-slate-200',
                  isDncOrLost && 'bg-red-500 text-white'
                )}
                style={isPassed && !isDncOrLost ? { background: STAGE_COLOR[s] || 'var(--brand)' } : undefined}
                title={s}
              >
                {s}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Details & Activity */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 space-y-4 h-fit">
          <h3 className="font-semibold text-[#1C2433]">Lead details</h3>
          {[
            [Mail, lead.email || '—'],
            [Phone, lead.phone || '—'],
            [MapPin, lead.city || '—'],
          ].map(([Icon, v]: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{v}</span>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E1E5ED] text-sm">
            <div>
              <p className="text-xs text-[#778196]">Source</p>
              <p className="font-medium text-[#1C2433]">{lead.source}</p>
            </div>
            <div>
              <p className="text-xs text-[#778196]">Priority</p>
              <Badge>{lead.priority}</Badge>
            </div>
            <div>
              <p className="text-xs text-[#778196]">Created</p>
              <p className="font-medium text-[#1C2433]">{fmtDate(lead.created)}</p>
            </div>
            <div>
              <p className="text-xs text-[#778196]">Stage</p>
              <Badge>{lead.status}</Badge>
            </div>
          </div>

          <label className="block pt-3 border-t border-[#E1E5ED]">
            <span className="text-xs font-medium text-[#778196]">
              Assigned employee {isCaller && '(Admin only)'}
            </span>
            <select
              data-testid="lead-assign-select"
              disabled={isCaller}
              className={cn(inputCls, 'mt-1', isCaller && 'bg-slate-100 cursor-not-allowed opacity-80')}
              value={lead.owner || ''}
              onChange={(e) => {
                const oldOwner = lead.owner || 'Unassigned';
                const newOwner = e.target.value;
                const history = [
                  ...(lead.assignmentHistory || []),
                  {
                    from: oldOwner,
                    to: newOwner,
                    at: new Date().toISOString(),
                    by: state.session?.name || 'Admin',
                  },
                ];
                store.update('leads', lead.id, { owner: newOwner, assignmentHistory: history });
                store.notify('Lead reassigned', `${lead.name} assigned to ${newOwner}`, 'lead');
                toast.success(`Assigned to ${newOwner}`);
              }}
            >
              <option value="">Unassigned</option>
              {(state.employees || []).map((e: any) => (
                <option key={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead title="Activity & tracking" sub="Every touchpoint with this lead" />
          <div className="px-5 pb-5">
            <form
              className="flex gap-2 mb-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) return;
                store.add('notes', {
                  title: 'Lead note',
                  body: note,
                  type: 'Lead',
                  related: lead.name,
                  author: state.session?.name || 'You',
                  date: todayIso,
                  pinned: false,
                });
                setNote('');
                toast.success('Note added');
              }}
            >
              <input
                data-testid="lead-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this lead…"
                className={inputCls}
              />
              <Button data-testid="lead-note-submit">Add</Button>
            </form>

            <ol className="relative border-l border-[#E1E5ED] ml-2 space-y-4">
              {timeline.map((t: any, i: number) => (
                <li key={i} className="ml-5">
                  <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-brand mt-1.5" />
                  <p className="text-sm text-slate-700">{t.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.k} · {fmtDate(t.t)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </Card>
      </div>

      <FormModal
        open={edit}
        onClose={() => setEdit(false)}
        title="Edit lead"
        fields={FIELDS.leads(state)}
        initial={lead}
        onSubmit={(v: any) => {
          store.update('leads', lead.id, v);
          toast.success('Lead updated');
        }}
      />

      <ConfirmModal
        open={del}
        onClose={() => setDel(false)}
        title="Delete lead?"
        text={`Are you sure you want to delete ${lead.name} (${lead.company})?`}
        onConfirm={() => {
          store.remove('leads', lead.id);
          toast.success('Lead deleted');
          router.push('/app/leads');
        }}
      />
    </div>
  );
}
