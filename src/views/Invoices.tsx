'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Plus, Trash2, Eye, Printer, Download, CheckCircle2, IndianRupee, FileClock, AlertTriangle, Pencil } from 'lucide-react';
import { useStore } from '@/lib/store';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Stat,
  Button,
  Modal,
  inr,
  fmtDate,
  invTotal,
  CHART,
  inputCls,
  cn,
  Empty,
} from '@/components/kit';
import { BrandMark } from '@/components/Shell';

const todayIso = new Date().toISOString().slice(0, 10);
const future15Days = new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10);

function Editor({ open, onClose, initial }: any) {
  const store = useStore();
  const { state } = store;
  const customers = state.customers || [];

  const blank = {
    customer: customers[0]?.company || 'New Client',
    issue: todayIso,
    due: future15Days,
    tax: 18,
    status: 'Pending',
    items: [{ desc: 'Professional Services', qty: 1, rate: 25000 }],
  };

  const [inv, setInv] = useState(initial || blank);
  const [k, setK] = useState(initial);

  if (k !== initial) {
    setK(initial);
    setInv(initial || blank);
  }

  const setItem = (i: number, patch: any) =>
    setInv((v: any) => ({
      ...v,
      items: v.items.map((it: any, j: number) => (j === i ? { ...it, ...patch } : it)),
    }));

  const sub = (inv.items || []).reduce((a: number, i: any) => a + (Number(i.qty) || 1) * (Number(i.rate) || 0), 0);

  const save = () => {
    if (!inv.items?.length || inv.items.some((i: any) => !i.desc?.trim())) {
      return toast.error('Add at least one line item with a description');
    }
    const c = customers.find((x: any) => x.company === inv.customer);

    if (inv.id) {
      store.update('invoices', inv.id, inv);
      toast.success('Invoice updated');
    } else {
      const number = `INV-2026-${String((state.invoices || []).length + 1).padStart(3, '0')}`;
      store.add('invoices', {
        ...inv,
        number,
        contact: c?.name || '',
        email: c?.email || '',
        paidOn: '',
      });
      store.log(state.session?.name || 'You', 'created invoice', number, 'invoice');
      toast.success('Invoice created');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={inv.id ? `Edit ${inv.number}` : 'Create invoice'}
      wide
      testid="invoice-editor"
    >
      <div className="grid sm:grid-cols-4 gap-3">
        <label className="sm:col-span-2">
          <span className="text-xs font-medium text-slate-600">Customer</span>
          {customers.length === 0 ? (
            <input
              className={`${inputCls} mt-1`}
              placeholder="Customer company name"
              value={inv.customer}
              onChange={(e) => setInv({ ...inv, customer: e.target.value })}
            />
          ) : (
            <select
              data-testid="invoice-customer"
              className={`${inputCls} mt-1`}
              value={inv.customer}
              onChange={(e) => setInv({ ...inv, customer: e.target.value })}
            >
              {customers.map((c: any) => (
                <option key={c.id}>{c.company}</option>
              ))}
            </select>
          )}
        </label>
        <label>
          <span className="text-xs font-medium text-slate-600">Issue date</span>
          <input
            type="date"
            className={`${inputCls} mt-1`}
            value={inv.issue}
            onChange={(e) => setInv({ ...inv, issue: e.target.value })}
          />
        </label>
        <label>
          <span className="text-xs font-medium text-slate-600">Due date</span>
          <input
            type="date"
            className={`${inputCls} mt-1`}
            value={inv.due}
            onChange={(e) => setInv({ ...inv, due: e.target.value })}
          />
        </label>
      </div>

      <div className="rounded-lg border border-[#E5E7EB] overflow-x-auto">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 w-20 font-medium">Qty</th>
              <th className="px-3 py-2 w-32 font-medium">Rate (₹)</th>
              <th className="px-3 py-2 w-28 text-right font-medium">Amount</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {(inv.items || []).map((it: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-2">
                  <input
                    data-testid={`item-desc-${i}`}
                    className={inputCls}
                    value={it.desc}
                    onChange={(e) => setItem(i, { desc: e.target.value })}
                    placeholder="Description"
                  />
                </td>
                <td className="p-2">
                  <input
                    data-testid={`item-qty-${i}`}
                    type="number"
                    min="1"
                    className={inputCls}
                    value={it.qty}
                    onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    data-testid={`item-rate-${i}`}
                    type="number"
                    className={inputCls}
                    value={it.rate}
                    onChange={(e) => setItem(i, { rate: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2 text-right tabular-nums font-medium text-[#111827]">
                  {inr((Number(it.qty) || 1) * (Number(it.rate) || 0))}
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setInv({ ...inv, items: inv.items.filter((_: any, j: number) => j !== i) })
                    }
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-fit"
        data-testid="add-line-item-btn"
        onClick={() => setInv({ ...inv, items: [...(inv.items || []), { desc: '', qty: 1, rate: 0 }] })}
      >
        <Plus className="w-3.5 h-3.5" />
        Add line item
      </Button>

      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end pt-2">
        <label className="w-full sm:w-40">
          <span className="text-xs font-medium text-slate-600">GST / Tax (%)</span>
          <select
            data-testid="invoice-tax"
            className={`${inputCls} mt-1`}
            value={inv.tax}
            onChange={(e) => setInv({ ...inv, tax: Number(e.target.value) })}
          >
            {[0, 5, 12, 18, 28].map((t) => (
              <option key={t} value={t}>
                {t}%
              </option>
            ))}
          </select>
        </label>
        <div className="text-sm space-y-1 w-full sm:w-64" data-testid="invoice-totals">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="tabular-nums text-[#111827]">{inr(sub)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GST ({inv.tax}%)</span>
            <span className="tabular-nums text-[#111827]">{inr((sub * inv.tax) / 100)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base pt-1 border-t border-[#E5E7EB]">
            <span className="text-[#111827]">Total</span>
            <span className="tabular-nums text-brand" data-testid="invoice-total">
              {inr(sub * (1 + inv.tax / 100))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} data-testid="invoice-save-btn">
          {inv.id ? 'Save changes' : 'Create invoice'}
        </Button>
      </div>
    </Modal>
  );
}

function Preview({ inv, onClose }: any) {
  const { state } = useStore();
  const b = state.brand;

  if (!inv) return null;
  const sub = (inv.items || []).reduce((a: number, i: any) => a + (Number(i.qty) || 1) * (Number(i.rate) || 0), 0);

  return (
    <Modal open onClose={onClose} title={`Invoice ${inv.number}`} wide testid="invoice-preview">
      <div id="invoice-print" className="bg-white border border-[#E5E7EB] rounded-lg p-6 sm:p-8 text-sm">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <BrandMark brand={b} size={34} />
            <p className="text-xs text-slate-500 mt-3 max-w-xs leading-relaxed">
              {b.company.legal}
              <br />
              {b.company.address}
              <br />
              GSTIN: {b.company.gst}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-semibold tracking-tight text-[#111827]">INVOICE</p>
            <p className="text-slate-500 font-mono text-xs mt-1">{inv.number}</p>
            <div className="mt-2">
              <Badge>{inv.status}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Billed to</p>
            <p className="font-semibold text-base text-[#111827]">{inv.customer}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              {inv.contact}
              <br />
              {inv.email}
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <p className="text-slate-500">
              <span className="text-slate-400">Issued:</span> {fmtDate(inv.issue)}
            </p>
            <p className="text-slate-500">
              <span className="text-slate-400">Due:</span> {fmtDate(inv.due)}
            </p>
            {inv.paidOn && <p className="text-emerald-600 font-medium">Paid on: {fmtDate(inv.paidOn)}</p>}
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-left text-xs text-slate-500 uppercase">
                <th className="py-2.5 font-medium">Description</th>
                <th className="py-2.5 text-right font-medium">Qty</th>
                <th className="py-2.5 text-right font-medium">Rate</th>
                <th className="py-2.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((it: any, i: number) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium text-[#111827]">{it.desc}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{it.qty}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{inr(it.rate)}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-[#111827]">
                    {inr((Number(it.qty) || 1) * (Number(it.rate) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="tabular-nums font-medium">{inr(sub)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST {inv.tax}%</span>
              <span className="tabular-nums font-medium">{inr((sub * inv.tax) / 100)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-[#E5E7EB] pt-2">
              <span className="text-[#111827]">Total Due</span>
              <span className="tabular-nums text-brand">{inr(invTotal(inv))}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-8 pt-4 border-t border-slate-100">
          Payment remittance: UPI / NEFT to {b.company.legal}. Billing queries: {b.company.email}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={() => window.print()} data-testid="invoice-print-btn">
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button
          onClick={() => {
            window.print();
            toast.success('Use "Save as PDF" in the browser print dialog');
          }}
          data-testid="invoice-download-btn"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
    </Modal>
  );
}

export default function InvoicesView() {
  const store = useStore();
  const { state } = store;
  const searchParams = useSearchParams();

  const [edit, setEdit] = useState<any>(searchParams?.get('new') ? {} : null);
  const [prev, setPrev] = useState<any>(null);
  const [pay, setPay] = useState<any>(null);
  const [mode, setMode] = useState('UPI');

  const invoices = state.invoices || [];

  const sum = (st?: string) =>
    invoices
      .filter((i: any) => !st || i.status === st)
      .reduce((a: number, i: any) => a + invTotal(i), 0);

  const pendingList = invoices.filter((i: any) => i.status === 'Pending');
  const overdueList = invoices.filter((i: any) => i.status === 'Overdue');

  // 6 month revenue summary
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const prefix = d.toISOString().slice(0, 7);
    const rev = invoices
      .filter((iv: any) => iv.status === 'Paid' && (iv.paidOn || iv.issue || '').startsWith(prefix))
      .reduce((a: number, iv: any) => a + invTotal(iv), 0);

    return {
      m: d.toLocaleString('en-IN', { month: 'short' }),
      Revenue: rev,
    };
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle="Create GST invoices, track payments and monitor revenue."
        actions={
          <Button onClick={() => setEdit({})} data-testid="invoice-create-btn">
            <Plus className="w-4 h-4" />
            Create invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat label="Total billed" value={inr(sum())} icon={IndianRupee} />
        <Stat label="Collected" value={inr(sum('Paid'))} icon={CheckCircle2} />
        <Stat
          label="Pending"
          value={inr(sum('Pending'))}
          icon={FileClock}
          hint={`${pendingList.length} invoices`}
        />
        <Stat
          label="Overdue"
          value={inr(sum('Overdue'))}
          icon={AlertTriangle}
          hint={`${overdueList.length} invoices`}
        />
      </div>

      <Card className="mb-4" data-testid="invoice-revenue-chart">
        <CardHead title="Revenue summary" sub="Monthly collected revenue" />
        {sum('Paid') === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <Empty
              title="No paid revenue yet"
              text="Invoices marked as paid will generate the monthly revenue graph."
            />
          </div>
        ) : (
          <div className="h-56 px-2 pb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="ir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="m" tick={CHART.axis} axisLine={false} tickLine={false} />
                <YAxis
                  tick={CHART.axis}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                />
                <Tooltip {...CHART.tooltip} formatter={(v: any) => inr(v)} />
                <Area dataKey="Revenue" stroke="var(--brand)" strokeWidth={2} fill="url(#ir)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <CrudTable
        testid="invoices"
        collection="invoices"
        entity="Invoice"
        canAdd={false}
        searchKeys={['number', 'customer', 'contact']}
        filters={[{ key: 'status', label: 'statuses', options: ['Paid', 'Pending', 'Overdue'] }]}
        toolbar={
          <Button onClick={() => setEdit({})}>
            <Plus className="w-4 h-4" />
            New
          </Button>
        }
        rowActions={(iv: any) => (
          <span className="inline-flex items-center gap-1">
            <button
              title="Preview"
              data-testid={`invoice-preview-${iv.id}`}
              onClick={() => setPrev(iv)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              title="Edit"
              data-testid={`invoice-edit-${iv.id}`}
              onClick={() => setEdit(iv)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {iv.status !== 'Paid' && (
              <button
                title="Record payment"
                data-testid={`invoice-pay-${iv.id}`}
                onClick={() => setPay(iv)}
                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              title="Delete"
              data-testid={`invoice-delete-${iv.id}`}
              onClick={() => {
                store.remove('invoices', iv.id);
                toast.success('Invoice deleted');
              }}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
        onRowClick={setPrev}
        columns={[
          {
            key: 'number',
            label: 'Invoice',
            render: (i: any) => <span className="font-semibold text-[#111827]">{i.number}</span>,
          },
          { key: 'customer', label: 'Customer' },
          { key: 'issue', label: 'Issued', render: (i: any) => fmtDate(i.issue) },
          {
            key: 'due',
            label: 'Due',
            render: (i: any) => (
              <span className={cn(i.status === 'Overdue' && 'text-red-500 font-semibold')}>
                {fmtDate(i.due)}
              </span>
            ),
          },
          {
            key: 'amount',
            label: 'Amount',
            render: (i: any) => <span className="tabular-nums font-semibold text-[#111827]">{inr(invTotal(i))}</span>,
          },
          { key: 'status', label: 'Status', render: (i: any) => <Badge>{i.status}</Badge> },
          {
            key: 'paidOn',
            label: 'Payment',
            render: (i: any) => (i.paidOn ? `${i.mode || 'UPI'} · ${fmtDate(i.paidOn)}` : '—'),
          },
        ]}
      />

      <Editor open={edit !== null} onClose={() => setEdit(null)} initial={edit?.id ? edit : null} />
      <Preview inv={prev} onClose={() => setPrev(null)} />

      <Modal
        open={!!pay}
        onClose={() => setPay(null)}
        title="Record payment"
        description={pay ? `${pay.number} · ${inr(invTotal(pay))}` : ''}
        testid="payment-modal"
      >
        <div className="grid grid-cols-3 gap-2">
          {['UPI', 'Bank transfer', 'Card'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'h-10 rounded-lg border text-sm font-medium transition-colors',
                mode === m ? 'border-brand bg-brand-soft text-[#111827]' : 'border-[#E5E7EB] hover:bg-slate-50'
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Button
          data-testid="confirm-payment-btn"
          className="w-full mt-4"
          onClick={() => {
            store.update('invoices', pay.id, { status: 'Paid', paidOn: todayIso, mode });
            store.notify(
              'Payment received',
              `${inr(invTotal(pay))} received from ${pay.customer}`,
              'invoice'
            );
            toast.success('Payment recorded successfully');
            setPay(null);
          }}
        >
          Mark as paid
        </Button>
      </Modal>
    </div>
  );
}
