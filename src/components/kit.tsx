'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-[#E1E5ED]/70', className)} />;
}

export function Card({ variant = 'neu', className, children, ...p }: any) {
  const base = variant === 'clean' ? 'neu-card-clean' : variant === 'surface' ? 'neu-surface' : 'neu-card';
  return (
    <div className={cn(base, 'rounded-2xl', className)} {...p}>
      {children}
    </div>
  );
}

export function CardHead({ title, sub, right }: any) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-[#1C2433] tracking-tight">{title}</h3>
        {sub && <p className="text-xs text-[#778196] mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6"
    >
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[26px] font-semibold tracking-tight text-[#1C2433] leading-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#778196] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 items-center">{actions}</div>}
    </motion.div>
  );
}

export function Button({ variant = 'primary', size = 'md', className, loading, children, ...p }: any) {
  const v =
    {
      primary: 'neu-btn-primary',
      secondary: 'neu-btn text-[#1C2433]',
      ghost: 'text-[#778196] hover:text-[#1C2433] hover:bg-[#E1E5ED]/50 active:scale-[0.98]',
      danger: 'bg-[#E15B63] text-white hover:bg-[#cf4c54] shadow-sm active:scale-[0.98]',
      dark: 'bg-[#171C2C] text-white hover:bg-[#232A40] shadow-sm active:scale-[0.98]',
    }[variant as 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'] || 'neu-btn-primary';

  const sz =
    {
      sm: 'h-8 px-3 text-xs rounded-xl',
      md: 'h-9 px-4 text-sm rounded-xl',
      lg: 'h-11 px-5 text-sm rounded-xl',
    }[size as 'sm' | 'md' | 'lg'] || 'h-9 px-4 text-sm rounded-xl';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap min-h-[36px]',
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
  success: 'bg-[#26A879]/12 text-[#1d855f] ring-[#26A879]/25',
  warning: 'bg-[#E7A23A]/14 text-[#b3781e] ring-[#E7A23A]/30',
  danger: 'bg-[#E15B63]/12 text-[#bf3f47] ring-[#E15B63]/25',
  brand: 'bg-[#6965ED]/12 text-[#524ed6] ring-[#6965ED]/25',
  info: 'bg-sky-500/12 text-sky-700 ring-sky-500/25',
  neutral: 'bg-[#E1E5ED]/70 text-[#4c566a] ring-[#778196]/20',
  violet: 'bg-[#8B83F6]/14 text-[#6359d9] ring-[#8B83F6]/25',
};

const AUTO: Record<string, string> = {
  Won: 'success',
  Paid: 'success',
  Active: 'success',
  Done: 'success',
  Completed: 'success',
  Resolved: 'success',
  Success: 'success',
  Converted: 'success',
  Interested: 'success',
  Connected: 'success',
  'Answered/Connected': 'success',
  Pending: 'warning',
  'In Progress': 'warning',
  Medium: 'warning',
  Callback: 'warning',
  'Call Back Required': 'warning',
  'Follow-up Scheduled': 'warning',
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
  Rejected: 'danger',
  Suspended: 'danger',
  'Not Interested': 'danger',
  'Do Not Call': 'danger',
  New: 'brand',
  Open: 'brand',
  Assigned: 'brand',
  Qualified: 'info',
  Contacted: 'info',
  Attempted: 'info',
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
        'inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap',
        TONE[t] || TONE.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

const COLORS = ['#6965ED', '#8B83F6', '#26A879', '#E7A23A', '#0EA5E9', '#EC4899', '#14B8A6', '#E15B63'];

export function Avatar({ name = '?', size = 32, color }: any) {
  const c =
    color ||
    COLORS[[...String(name || '?')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % COLORS.length];
  const ini = String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none shadow-sm"
      style={{ width: size, height: size, background: c, fontSize: Math.max(10, size * 0.38) }}
    >
      {ini || '?'}
    </span>
  );
}

export function Stat({ label, value, delta, icon: Icon, testid, hint }: any) {
  const up = delta && !String(delta).startsWith('-');
  return (
    <Card className="p-4 sm:p-5 hover-lift" data-testid={testid}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-[#778196] uppercase tracking-wider truncate">{label}</span>
        {Icon && (
          <span className="w-9 h-9 rounded-xl neu-surface text-brand flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="mt-3 text-xl sm:text-2xl font-semibold tracking-tight text-[#1C2433] tabular-nums">{value}</div>
      {(delta || hint) && (
        <div className="mt-1.5 text-xs flex items-center gap-1.5 flex-wrap">
          {delta && (
            <span
              className={cn(
                'font-semibold px-1.5 py-0.5 rounded-md text-[11px]',
                up ? 'bg-[#26A879]/12 text-[#26A879]' : 'bg-[#E15B63]/12 text-[#E15B63]'
              )}
            >
              {up ? '+' : '-'}
              {String(delta).replace('-', '')}
            </span>
          )}
          <span className="text-[#778196] truncate">{hint || 'vs last month'}</span>
        </div>
      )}
    </Card>
  );
}

export function Empty({ icon: Icon = Inbox, title, text, action }: any) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6" data-testid="empty-state">
      <span className="w-14 h-14 rounded-2xl neu-surface flex items-center justify-center text-[#778196] mb-3">
        <Icon className="w-6 h-6" />
      </span>
      <p className="font-semibold text-[#1C2433]">{title}</p>
      {text && <p className="text-sm text-[#778196] mt-1 max-w-sm">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Segmented({ options, value, onChange, testid }: any) {
  return (
    <div
      className="inline-flex p-1 rounded-xl neu-inset overflow-x-auto max-w-full no-scrollbar"
      data-testid={testid}
    >
      {options.map((o: any) => {
        const val = o.value ?? o;
        const lab = o.label ?? o;
        const active = value === val;
        return (
          <button
            key={String(val)}
            type="button"
            data-testid={`${testid}-${slug(String(val))}`}
            onClick={() => onChange(val)}
            className={cn(
              'px-3 h-7 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 min-h-[28px]',
              active ? 'bg-white text-[#1C2433] shadow-sm font-semibold' : 'text-[#778196] hover:text-[#1C2433]'
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-[#171C2C]/45 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'bg-[#F5F6FA] border border-white/80 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden pb-safe',
              wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
            )}
            data-testid={testid}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3.5 border-b border-[#E1E5ED] shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#1C2433] truncate">{title}</h3>
                {description && <p className="text-xs text-[#778196] mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl neu-btn text-[#778196] hover:text-[#1C2433] shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 thin-scroll">{children}</div>
            {footer && (
              <div className="px-5 sm:px-6 py-4 bg-[#EEF1F6]/70 border-t border-[#E1E5ED] flex justify-end gap-2 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export const inputCls =
  'w-full h-10 rounded-xl neu-inset px-3.5 text-sm text-[#1C2433] placeholder:text-[#778196]/80 outline-none transition-all duration-150 min-h-[40px]';

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
        className={cn(inputCls, 'h-24 py-2.5')}
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
        className="h-10 w-full rounded-xl border border-[#E1E5ED] cursor-pointer bg-white p-1"
        value={value || '#6965ED'}
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
      <span className="block text-xs font-semibold text-[#778196] mb-1.5">
        {f.label}
        {f.required && <span className="text-[#E15B63]"> *</span>}
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
    }, 180);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} wide={fields.length > 5} testid="form-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((f: any) => (
            <Field key={f.key} f={f} value={vals[f.key]} onChange={(v: any) => setVals((x: any) => ({ ...x, [f.key]: v }))} />
          ))}
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-[#E1E5ED]">
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
      <Search className="w-4 h-4 text-[#778196] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, 'pl-10')}
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
      const matchQ = !q || searchKeys.some((k: string) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()));
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
    <Card variant="clean" className="overflow-hidden" data-testid={`${testid}-table`}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-4 sm:p-5 border-b border-[#E1E5ED] bg-[#F5F6FA]/60">
        {title && (
          <h3 className="font-semibold text-[15px] text-[#1C2433] mr-auto">
            {title} <span className="text-[#778196] font-normal">· {filtered.length}</span>
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
              className={cn(inputCls, 'w-full sm:w-auto')}
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
          text={
            q || Object.values(f).some(Boolean)
              ? 'Try clearing search or filters.'
              : `Click "${addLabel}" to add the first ${entity.toLowerCase()}.`
          }
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
        <>
          {/* Desktop Clean Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-[#778196] bg-[#F0F2F7]/70 border-b border-[#E1E5ED]">
                  {columns.map((c: any) => (
                    <th key={c.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {view.map((r: any) => (
                  <tr
                    key={r.id}
                    data-testid={`${testid}-row-${r.id}`}
                    onClick={() => onRowClick?.(r)}
                    className={cn(
                      'border-t border-[#E1E5ED]/70 hover:bg-[#EEF1F6]/60 transition-colors duration-150',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {columns.map((c: any) => (
                      <td key={c.key} className="px-4 py-3.5 whitespace-nowrap text-[#1C2433]">
                        {c.render ? c.render(r) : r[c.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {rowActions?.(r)}
                      {fields && (
                        <button
                          data-testid={`${testid}-edit-${r.id}`}
                          onClick={() => setEdit(r)}
                          className="p-1.5 rounded-lg text-[#778196] hover:text-[#1C2433] hover:bg-[#E1E5ED]/60 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {fields && (
                        <button
                          data-testid={`${testid}-delete-${r.id}`}
                          onClick={() => setDel(r)}
                          className="p-1.5 rounded-lg text-[#778196] hover:text-[#E15B63] hover:bg-[#E15B63]/10 ml-1 transition-colors"
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

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-[#E1E5ED]">
            {view.map((r: any) => (
              <div
                key={r.id}
                onClick={() => onRowClick?.(r)}
                className={cn('p-4 space-y-2.5 bg-white active:bg-[#F5F6FA] transition-colors', onRowClick && 'cursor-pointer')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">{columns[0]?.render ? columns[0].render(r) : <p className="font-semibold text-[#1C2433]">{r[columns[0]?.key]}</p>}</div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {rowActions?.(r)}
                    {fields && (
                      <button
                        onClick={() => setEdit(r)}
                        className="p-2 rounded-xl neu-btn text-[#778196]"
                        aria-label="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {fields && (
                      <button
                        onClick={() => setDel(r)}
                        className="p-2 rounded-xl neu-btn text-[#E15B63]"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {columns.length > 1 && (
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 pt-1 text-xs">
                    {columns.slice(1).map((c: any) => (
                      <div key={c.key} className="min-w-0">
                        <span className="block text-[10px] uppercase tracking-wider text-[#778196] font-medium">{c.label}</span>
                        <div className="text-[#1C2433] mt-0.5 truncate">{c.render ? c.render(r) : r[c.key] || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E1E5ED] bg-[#F5F6FA]/50 text-xs text-[#778196]">
          <span>
            Showing {p * pageSize + 1}–{Math.min(filtered.length, (p + 1) * pageSize)} of {filtered.length}
          </span>
          <div className="flex gap-1.5">
            <button
              data-testid={`${testid}-prev`}
              disabled={p === 0}
              onClick={() => setPage(p - 1)}
              className="p-1.5 rounded-lg neu-btn disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid={`${testid}-next`}
              disabled={p >= pages - 1}
              onClick={() => setPage(p + 1)}
              className="p-1.5 rounded-lg neu-btn disabled:opacity-40"
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
    <div className="h-2 rounded-full neu-inset overflow-hidden p-0.5">
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
        'relative w-10 h-6 rounded-full transition-colors duration-200 shrink-0 p-0.5',
        checked ? 'bg-brand shadow-inner' : 'neu-inset'
      )}
    >
      <span
        className={cn(
          'block w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
          checked && 'translate-x-4'
        )}
      />
    </button>
  );
}

export function Tabs({ tabs = [], value, onChange, testid = 'tabs' }: any) {
  return (
    <div className="flex gap-1.5 border-b border-[#E1E5ED] mb-6 overflow-x-auto no-scrollbar pb-1" data-testid={testid}>
      {tabs.map((t: string) => {
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            data-testid={`${testid}-${slug(t)}`}
            onClick={() => onChange(t)}
            className={cn(
              'relative px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 min-h-[36px]',
              active ? 'neu-btn text-[#1C2433] font-semibold' : 'text-[#778196] hover:text-[#1C2433] hover:bg-white/40'
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

export const CHART = {
  grid: '#E1E5ED',
  axis: { fontSize: 11, fill: '#778196' },
  tooltip: {
    contentStyle: {
      borderRadius: 14,
      border: '1px solid #E1E5ED',
      backgroundColor: '#F5F6FA',
      fontSize: 12,
      color: '#1C2433',
      boxShadow: '6px 6px 16px rgba(163, 177, 198, 0.25), -4px -4px 12px rgba(255, 255, 255, 0.85)',
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
    ...rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')),
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
