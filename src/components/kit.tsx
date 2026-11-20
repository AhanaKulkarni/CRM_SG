'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search, Plus, Pencil, Trash2, Inbox, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { useStore } from '@/lib/store';

export const cn = (...a: any[]) => a.filter(Boolean).join(' ');

export const inr = (n: number | string) => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');

export const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ago = (t: any) => {
  if (!t) return '—';
  const m = Math.round((Date.now() - new Date(t).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

export const invTotal = (iv: any) =>
  (iv.items || []).reduce((a: number, i: any) => a + (Number(i.qty) || 1) * (Number(i.rate) || 0), 0) *
  (1 + (Number(iv.tax) || 0) / 100);

export const slug = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

export function Card({ className, children, ...p }: any) {
  return (
    <div className={cn('bg-white border border-[#E5E7EB] rounded-xl', className)} {...p}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }: any) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-[#111827]">{title}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 fade-up">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#111827]">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className, loading, children, ...p }: any) {
  const v = {
    primary: 'bg-brand text-white hover:opacity-90 shadow-sm',
    secondary: 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-[#EF4444] text-white hover:bg-red-600',
    dark: 'bg-[#111827] text-white hover:bg-black',
  }[variant as 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'] || 'bg-brand text-white';

  const sz = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  }[size as 'sm' | 'md' | 'lg'] || 'h-9 px-4 text-sm';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,opacity,transform] active:scale-[0.98] disabled:opacity-50 whitespace-nowrap min-h-[36px]',
        v,
        sz,
        className
      )}
      disabled={loading || p.disabled}
      {...p}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

const TONE: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  brand: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

const AUTO: Record<string, string> = {
  Won: 'success',
  Paid: 'success',
  Active: 'success',
  Done: 'success',
  Resolved: 'success',
  Success: 'success',
  Converted: 'success',
  Interested: 'success',
  Connected: 'success',
  Pending: 'warning',
  'In Progress': 'warning',
  Medium: 'warning',
  Callback: 'warning',
  Proposal: 'warning',
  Paused: 'warning',
  Trial: 'warning',
  'On Leave': 'warning',
  Review: 'violet',
  Negotiation: 'violet',
  Overdue: 'danger',
  Lost: 'danger',
  High: 'danger',
  Urgent: 'danger',
  Failed: 'danger',
  Suspended: 'danger',
  'Not Interested': 'danger',
  New: 'brand',
  Open: 'brand',
  Qualified: 'info',
  Contacted: 'info',
  Scheduled: 'info',
  Pro: 'violet',
  Basic: 'neutral',
  Enterprise: 'violet',
  SMB: 'info',
  Startup: 'brand',
};

export function Badge({ children, tone, className }: any) {
  const t = tone || AUTO[children] || 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap',
        TONE[t] || TONE.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#EC4899', '#14B8A6', '#EF4444'];

export function Avatar({ name = '?', size = 32, color }: any) {
  const c =
    color ||
    COLORS[
      [...String(name || '?')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length
    ];
  const ini = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none"
      style={{ width: size, height: size, background: c, fontSize: Math.max(10, size * 0.38) }}
    >
      {ini || '?'}
    </span>
  );
}

export function Stat({ label, value, delta, icon: Icon, testid, hint }: any) {
  const up = delta && !String(delta).startsWith('-');
  return (
    <Card className="p-5 hover-lift" data-testid={testid}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#111827] tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="mt-1 text-xs">
          {delta && (
            <span className={up ? 'text-emerald-600' : 'text-red-500'}>
              {up ? '↑' : '↓'} {String(delta).replace('-', '')}
            </span>
          )}{' '}
          <span className="text-slate-400">{hint || 'vs last month'}</span>
        </div>
      )}
    </Card>
  );
}

export function Empty({ icon: Icon = Inbox, title, text, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6" data-testid="empty-state">
      <span className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-5 h-5" />
      </span>
      <p className="font-medium text-[#111827]">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Segmented({ options, value, onChange, testid }: any) {
  return (
    <div className="inline-flex p-1 rounded-lg bg-slate-100 overflow-x-auto max-w-full no-scrollbar" data-testid={testid}>
      {options.map((o: any) => {
        const val = o.value ?? o;
        const lab = o.label ?? o;
        return (
          <button
            key={String(val)}
            data-testid={`${testid}-${slug(String(val))}`}
            onClick={() => onChange(val)}
            className={cn(
              'px-3 h-7 rounded-md text-xs font-medium whitespace-nowrap transition-colors min-h-[28px]',
              value === val ? 'bg-white text-[#111827] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {lab}
          </button>
        );
      })}
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, wide, testid }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm fade-up">
      <div
        className={cn(
          'bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-h-[92vh] flex flex-col overflow-hidden',
          wide ? 'max-w-3xl' : 'max-w-lg'
        )}
        data-testid={testid}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 thin-scroll">{children}</div>
        {footer && <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export const inputCls =
  'w-full h-10 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[color:var(--brand-ring)] transition-shadow min-h-[40px]';

export function Field({ f, value, onChange }: any) {
  const id = `field-${f.key}`;
  let el;
  if (f.type === 'select') {
    el = (
      <select id={id} data-testid={id} className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {(f.options || []).map((o: any) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    );
  } else if (f.type === 'textarea') {
    el = (
      <textarea
        id={id}
        data-testid={id}
        className={cn(inputCls, 'h-24 py-2')}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else if (f.type === 'color') {
    el = (
      <input
        id={id}
        data-testid={id}
        type="color"
        className="h-10 w-full rounded-lg border border-[#E5E7EB] cursor-pointer"
        value={value || '#6366F1'}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  } else {
    el = (
      <input
        id={id}
        data-testid={id}
        type={f.type || 'text'}
        className={inputCls}
        value={value ?? ''}
        onChange={(e) => onChange(f.type === 'number' ? Number(e.target.value) : e.target.value)}
      />
    );
  }
  return (
    <label htmlFor={id} className={cn('block', f.full && 'sm:col-span-2')}>
      <span className="block text-xs font-medium text-slate-600 mb-1.5">
        {f.label}
        {f.required && <span className="text-red-500"> *</span>}
      </span>
      {el}
    </label>
  );
}

export function FormModal({ open, onClose, title, fields = [], initial, onSubmit, submitLabel = 'Save', extra }: any) {
  const [vals, setVals] = useState(initial || {});
  const [busy, setBusy] = useState(false);
  const [prevInitial, setPrevInitial] = useState(initial);

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setVals(initial || {});
  }

  const submit = (e: any) => {
    e.preventDefault();
    const miss = fields.find((f: any) => f.required && !vals[f.key]);
    if (miss) return toast.error(`${miss.label} is required`);
    setBusy(true);
    setTimeout(() => {
      onSubmit(vals);
      setBusy(false);
      onClose();
    }, 200);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} wide={fields.length > 5} testid="form-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f: any) => (
            <Field key={f.key} f={f} value={vals[f.key]} onChange={(v: any) => setVals((x: any) => ({ ...x, [f.key]: v }))} />
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          {extra && <span className="mr-auto">{extra}</span>}
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={busy} data-testid="form-submit-btn">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Delete record?', text = 'This action cannot be undone.' }: any) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={text}
      testid="confirm-modal"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            data-testid="confirm-delete-btn"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </>
      }
    />
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', testid = 'table-search-input', className }: any) {
  return (
    <div className={cn('relative', className)}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, 'pl-9')}
      />
    </div>
  );
}

export function CrudTable({
  collection,
  rows: rowsProp,
  columns,
  fields,
  filters = [],
  searchKeys = [],
  title,
  onRowClick,
  rowActions,
  addLabel = 'Add record',
  defaults = {},
  toolbar,
  pageSize = 10,
  canAdd = true,
  entity = 'Record',
  testid = 'crud',
}: any) {
  const store = useStore();
  const rows = rowsProp || store.state[collection] || [];
  const [q, setQ] = useState('');
  const [f, setF] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<any>(null);
  const [del, setDel] = useState<any>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return rows.filter((r: any) => {
      const matchQ =
        !q || searchKeys.some((k: string) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()));
      const matchF = filters.every((fl: any) => !f[fl.key] || r[fl.key] === f[fl.key]);
      return matchQ && matchF;
    });
  }, [rows, q, f, searchKeys, filters]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const p = Math.min(page, pages - 1);
  const view = filtered.slice(p * pageSize, p * pageSize + pageSize);

  const save = (vals: any) => {
    if (edit?.id) {
      store.update(collection, edit.id, vals);
      toast.success(`${entity} updated`);
    } else {
      store.add(collection, { ...defaults, ...vals });
      toast.success(`${entity} created`);
    }
  };

  return (
    <Card className="overflow-hidden" data-testid={`${testid}-table`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-b border-[#E5E7EB]">
        {title && (
          <h3 className="font-semibold text-[15px] mr-auto">
            {title} <span className="text-slate-400 font-normal">· {filtered.length}</span>
          </h3>
        )}
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto w-full lg:w-auto">
          <SearchInput
            value={q}
            onChange={(v: string) => {
              setQ(v);
              setPage(0);
            }}
            testid={`${testid}-search`}
            className="w-full sm:w-56"
          />
          {filters.map((fl: any) => (
            <select
              key={fl.key}
              data-testid={`${testid}-filter-${fl.key}`}
              className={cn(inputCls, 'w-auto')}
              value={f[fl.key] || ''}
              onChange={(e) => {
                setF((x) => ({ ...x, [fl.key]: e.target.value }));
                setPage(0);
              }}
            >
              <option value="">All {fl.label}</option>
              {(fl.options || []).map((o: any) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ))}
          {toolbar}
          {canAdd && fields && (
            <Button data-testid={`${testid}-add-btn`} onClick={() => setEdit({ ...defaults })}>
              <Plus className="w-4 h-4" />
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {view.length === 0 ? (
        <Empty
          title={`No ${entity.toLowerCase()} records yet`}
          text={q || Object.values(f).some(Boolean) ? 'Try clearing search or filters.' : `Click "${addLabel}" to add the first ${entity.toLowerCase()}.`}
          action={
            q || Object.values(f).some(Boolean) ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setF({});
                }}
              >
                Clear filters
              </Button>
            ) : canAdd && fields ? (
              <Button onClick={() => setEdit({ ...defaults })}>
                <Plus className="w-4 h-4" />
                {addLabel}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70 border-b border-slate-100">
                {columns.map((c: any) => (
                  <th key={c.key} className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {view.map((r: any) => (
                <tr
                  key={r.id}
                  data-testid={`${testid}-row-${r.id}`}
                  onClick={() => onRowClick?.(r)}
                  className={cn(
                    'border-t border-[#F1F5F9] hover:bg-slate-50/80 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((c: any) => (
                    <td key={c.key} className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {rowActions?.(r)}
                    {fields && (
                      <button
                        data-testid={`${testid}-edit-${r.id}`}
                        onClick={() => setEdit(r)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {fields && (
                      <button
                        data-testid={`${testid}-delete-${r.id}`}
                        onClick={() => setDel(r)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] text-xs text-slate-500">
          <span>
            Showing {p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              data-testid={`${testid}-prev`}
              disabled={p === 0}
              onClick={() => setPage(p - 1)}
              className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid={`${testid}-next`}
              disabled={p >= pages - 1}
              onClick={() => setPage(p + 1)}
              className="p-1.5 rounded-md border border-[#E5E7EB] disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {fields && (
        <FormModal
          open={!!edit}
          onClose={() => setEdit(null)}
          title={edit?.id ? `Edit ${entity.toLowerCase()}` : `New ${entity.toLowerCase()}`}
          fields={fields}
          initial={edit}
          onSubmit={save}
        />
      )}

      <ConfirmModal
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => {
          store.remove(collection, del.id);
          toast.success(`${entity} deleted`);
        }}
      />
    </Card>
  );
}

export function Progress({ value = 0, color }: any) {
  return (
    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color || 'var(--brand)' }}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, testid }: any) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testid}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-9 h-5 rounded-full transition-colors shrink-0',
        checked ? 'bg-brand' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-4'
        )}
      />
    </button>
  );
}

export function Tabs({ tabs = [], value, onChange, testid = 'tabs' }: any) {
  return (
    <div className="flex gap-1 border-b border-[#E5E7EB] mb-6 overflow-x-auto no-scrollbar" data-testid={testid}>
      {tabs.map((t: string) => (
        <button
          key={t}
          data-testid={`${testid}-${slug(t)}`}
          onClick={() => onChange(t)}
          className={cn(
            'px-3 pb-2.5 pt-1 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors min-h-[36px]',
            value === t ? 'border-brand text-[#111827]' : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export const CHART = {
  grid: '#EEF2F7',
  axis: { fontSize: 11, fill: '#94A3B8' },
  tooltip: {
    contentStyle: {
      borderRadius: 10,
      border: '1px solid #E5E7EB',
      fontSize: 12,
      boxShadow: '0 8px 24px rgba(15,23,42,.08)',
    },
  },
};

export function downloadCSV(name: string, rows: any[]) {
  if (!rows || !rows.length) {
    toast.error('No records to export');
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map((r) =>
      keys
        .map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${name}.csv exported`, { description: `${rows.length} rows downloaded` });
}
