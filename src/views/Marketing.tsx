'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Megaphone, IndianRupee, Target, TrendingUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import {
  Card,
  CardHead,
  PageHeader,
  CrudTable,
  Badge,
  Stat,
  inr,
  CHART,
  fmtDate,
  Progress,
  Empty,
} from '@/components/kit';
import { SOURCE_COLORS } from './Overview';

const todayIso = new Date().toISOString().slice(0, 10);
const future30Days = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

export default function MarketingView() {
  const { state } = useStore();
  const campaigns = state.campaigns || [];
  const leads = state.leads || [];

  const spend = campaigns.reduce((a: number, x: any) => a + Number(x.spend || 0), 0);
  const rev = campaigns.reduce((a: number, x: any) => a + Number(x.revenue || 0), 0);
  const totalLeadsGen = campaigns.reduce((a: number, x: any) => a + Number(x.leads || 0), 0);
  const roiPct = spend > 0 ? Math.round(((rev - spend) / spend) * 100) : 0;

  const roi = campaigns.map((x: any) => ({
    name: x.name.split(' ').slice(0, 2).join(' '),
    ROI: Math.round(((Number(x.revenue || 0) - Number(x.spend || 0)) / Math.max(1, Number(x.spend || 1))) * 100),
    Spend: Number(x.spend || 0),
    Revenue: Number(x.revenue || 0),
  }));

  const channels: { name: string; value: number }[] = Array.from(
    new Set<string>(campaigns.map((x: any) => String(x.channel || '')).filter(Boolean))
  ).map((ch) => ({
    name: ch,
    value: campaigns
      .filter((x: any) => x.channel === ch)
      .reduce((a: number, x: any) => a + Number(x.leads || 0), 0),
  }));

  const srcRows = ['Facebook', 'Instagram', 'Website', 'Referral', 'Google Ads', 'LinkedIn', 'Walk-in'].map(
    (s) => {
      const l = leads.filter((x: any) => x.source === s);
      const won = l.filter((x: any) => x.status === 'Won').length;
      return {
        s,
        n: l.length,
        won,
        rate: l.length ? Math.round((won / l.length) * 100) : 0,
        value: l.reduce((a: number, x: any) => a + Number(x.value || 0), 0),
      };
    }
  );

  return (
    <div>
      <PageHeader title="Marketing" subtitle="Plan campaigns, track channels and measure ROI." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 stagger">
        <Stat
          label="Active campaigns"
          value={campaigns.filter((x: any) => x.status === 'Active').length.toString()}
          icon={Megaphone}
        />
        <Stat label="Total spend" value={inr(spend)} icon={IndianRupee} />
        <Stat label="Leads generated" value={totalLeadsGen.toLocaleString('en-IN')} icon={Target} />
        <Stat label="Campaign ROI" value={`${roiPct}%`} icon={TrendingUp} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2" data-testid="campaign-roi-chart">
          <CardHead title="Campaign ROI dashboard" sub="Spend vs. attributed revenue" />
          {campaigns.length === 0 ? (
            <div className="h-72 flex items-center justify-center">
              <Empty
                title="No campaigns running"
                text="Create your first marketing campaign below to start tracking spend vs. revenue."
              />
            </div>
          ) : (
            <div className="h-72 px-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roi}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={CHART.axis}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-12}
                    height={40}
                  />
                  <YAxis
                    tick={CHART.axis}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  />
                  <Tooltip {...CHART.tooltip} formatter={(v: any) => inr(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Spend" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card data-testid="marketing-channels">
          <CardHead title="Marketing channels" sub="Leads by channel" />
          {channels.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs text-slate-400">No channel data available</p>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={channels} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={2}>
                      {channels.map((x, i) => (
                        <Cell key={x.name} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...CHART.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="px-5 pb-5 space-y-2">
                {channels.map((x, i) => (
                  <div key={x.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}
                    />
                    <span className="flex-1 text-slate-600 truncate">{x.name}</span>
                    <span className="font-semibold text-[#1C2433]">{x.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <CrudTable
        testid="campaigns"
        collection="campaigns"
        entity="Campaign"
        addLabel="New campaign"
        title="Campaigns"
        fields={FIELDS.campaigns()}
        defaults={{
          status: 'Scheduled',
          budget: 100000,
          spend: 0,
          leads: 0,
          conversions: 0,
          revenue: 0,
          start: todayIso,
          end: future30Days,
        }}
        searchKeys={['name', 'channel']}
        filters={[
          {
            key: 'channel',
            label: 'channels',
            options: ['Facebook', 'Instagram', 'Google Ads', 'Email', 'WhatsApp', 'LinkedIn'],
          },
          {
            key: 'status',
            label: 'statuses',
            options: ['Active', 'Paused', 'Scheduled', 'Completed'],
          },
        ]}
        columns={[
          {
            key: 'name',
            label: 'Campaign',
            render: (x: any) => (
              <div>
                <p className="font-semibold text-[#1C2433]">{x.name}</p>
                <p className="text-xs text-[#778196]">
                  {fmtDate(x.start)} – {fmtDate(x.end)}
                </p>
              </div>
            ),
          },
          { key: 'channel', label: 'Channel' },
          {
            key: 'status',
            label: 'Status',
            render: (x: any) => <Badge>{x.status}</Badge>,
          },
          {
            key: 'spend',
            label: 'Budget used',
            render: (x: any) => (
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span>{inr(x.spend)}</span>
                  <span className="text-slate-400">
                    {Math.round((Number(x.spend || 0) / Math.max(1, Number(x.budget || 1))) * 100)}%
                  </span>
                </div>
                <Progress value={(Number(x.spend || 0) / Math.max(1, Number(x.budget || 1))) * 100} />
              </div>
            ),
          },
          { key: 'leads', label: 'Leads', render: (x: any) => x.leads || 0 },
          { key: 'conversions', label: 'Conv.', render: (x: any) => x.conversions || 0 },
          { key: 'revenue', label: 'Revenue', render: (x: any) => inr(x.revenue) },
          {
            key: 'roi',
            label: 'ROI',
            render: (x: any) => {
              const r = Math.round(
                ((Number(x.revenue || 0) - Number(x.spend || 0)) / Math.max(1, Number(x.spend || 1))) * 100
              );
              return (
                <span className={r >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
                  {r}%
                </span>
              );
            },
          },
        ]}
      />

      <Card className="mt-4" data-testid="lead-source-tracking">
        <CardHead title="Lead source tracking" sub="Conversion rate by acquisition channel" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[#778196] bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-2.5 font-medium">Source</th>
                <th className="px-5 py-2.5 font-medium">Leads</th>
                <th className="px-5 py-2.5 font-medium">Won</th>
                <th className="px-5 py-2.5 font-medium">Win rate</th>
                <th className="px-5 py-2.5 font-medium text-right">Pipeline value</th>
              </tr>
            </thead>
            <tbody>
              {srcRows.map((r) => (
                <tr key={r.s} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-semibold text-[#1C2433]">{r.s}</td>
                  <td className="px-5 py-3 text-slate-700">{r.n}</td>
                  <td className="px-5 py-3 text-slate-700">{r.won}</td>
                  <td className="px-5 py-3 w-48">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Progress value={r.rate} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-[#1C2433]">{r.rate}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[#1C2433]">{inr(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
