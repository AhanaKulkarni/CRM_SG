'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useStore } from '@/lib/store';
import { FIELDS } from '@/lib/fields';
import { Card, PageHeader, Button, Segmented, FormModal, cn, Empty } from '@/components/kit';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TYPE_C: Record<string, string> = {
  Meeting: '#6366F1',
  Call: '#10B981',
  Demo: '#8B5CF6',
  Internal: '#F59E0B',
};

function EventChip({ e, onClick }: any) {
  return (
    <button
      onClick={(x) => {
        x.stopPropagation();
        onClick(e);
      }}
      data-testid={`event-${e.id}`}
      className="w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white hover:opacity-90 shadow-sm transition-opacity"
      style={{ background: TYPE_C[e.type] || '#6366F1' }}
    >
      {e.time} {e.title}
    </button>
  );
}

export default function CalendarView() {
  const store = useStore();
  const { state } = store;
  const [view, setView] = useState('Month');
  const [cur, setCur] = useState(new Date());
  const [edit, setEdit] = useState<any>(null);

  const todayIso = iso(new Date());
  const events = state.events || [];

  const evOn = (d: string) =>
    events.filter((e: any) => e.date === d).sort((a: any, b: any) => String(a.time || '').localeCompare(String(b.time || '')));

  const shift = (n: number) => {
    const d = new Date(cur);
    if (view === 'Month') d.setMonth(d.getMonth() + n);
    else d.setDate(d.getDate() + n * (view === 'Week' ? 7 : 1));
    setCur(d);
  };

  const create = (date: string, time = '10:00') =>
    setEdit({
      date,
      time,
      duration: 30,
      type: 'Meeting',
      withPerson: state.employees?.[0]?.name || state.session?.name || 'Aisha Khan',
    });

  // Month grid calculation
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const monthDays = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  // Week calculation
  const ws = new Date(cur);
  ws.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws);
    d.setDate(ws.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 10 }, (_, i) => 9 + i);

  const label =
    view === 'Month'
      ? cur.toLocaleString('en-IN', { month: 'long', year: 'numeric' })
      : view === 'Week'
      ? `${weekDays[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : cur.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // Agenda list for mobile
  const selectedDayEvents = evOn(iso(cur));

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Schedule meetings, demos and calls with your team."
        actions={
          <Button onClick={() => create(iso(cur))} data-testid="calendar-new-event-btn">
            <Plus className="w-4 h-4" />
            Schedule meeting
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => shift(-1)}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              data-testid="calendar-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shift(1)}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors"
              data-testid="calendar-next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-semibold text-[#111827]" data-testid="calendar-label">
            {label}
          </h2>
          <Button size="sm" variant="secondary" onClick={() => setCur(new Date())}>
            Today
          </Button>
          <div className="ml-auto">
            <Segmented testid="calendar-view" options={['Month', 'Week', 'Day']} value={view} onChange={setView} />
          </div>
        </div>

        {/* Month View */}
        {view === 'Month' && (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 text-[11px] uppercase tracking-wider text-slate-500 border-b border-[#E5E7EB] bg-slate-50/50">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="px-3 py-2 font-medium">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((d) => {
                  const k = iso(d);
                  const evs = evOn(k);
                  const isCurrentMonth = d.getMonth() === cur.getMonth();
                  const isToday = k === todayIso;

                  return (
                    <div
                      key={k}
                      onClick={() => {
                        setCur(d);
                        create(k);
                      }}
                      data-testid={`calendar-day-${k}`}
                      className={cn(
                        'min-h-[104px] border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-slate-50 transition-colors',
                        !isCurrentMonth && 'bg-slate-50/60 text-slate-400'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium',
                          isToday && 'bg-brand text-white font-semibold'
                        )}
                      >
                        {d.getDate()}
                      </span>
                      <div className="space-y-1 mt-1">
                        {evs.slice(0, 3).map((e: any) => (
                          <EventChip key={e.id} e={e} onClick={setEdit} />
                        ))}
                        {evs.length > 3 && (
                          <p className="text-[10px] text-slate-500 px-1">+{evs.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Week / Day View */}
        {view !== 'Month' && (
          <div className="overflow-x-auto">
            <div className={view === 'Week' ? 'min-w-[760px]' : ''}>
              <div
                className="grid border-b border-[#E5E7EB] bg-slate-50/50"
                style={{ gridTemplateColumns: `64px repeat(${view === 'Week' ? 7 : 1}, 1fr)` }}
              >
                <div />
                {(view === 'Week' ? weekDays : [cur]).map((d) => (
                  <div
                    key={iso(d)}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold text-center',
                      iso(d) === todayIso ? 'text-brand' : 'text-slate-700'
                    )}
                  >
                    {d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
              {hours.map((h) => (
                <div
                  key={h}
                  className="grid border-b border-slate-100"
                  style={{ gridTemplateColumns: `64px repeat(${view === 'Week' ? 7 : 1}, 1fr)` }}
                >
                  <div className="text-[11px] text-slate-400 px-2 py-2">{String(h).padStart(2, '0')}:00</div>
                  {(view === 'Week' ? weekDays : [cur]).map((d) => {
                    const k = iso(d);
                    const evs = evOn(k).filter((e: any) => Number((e.time || '').slice(0, 2)) === h);
                    return (
                      <div
                        key={k}
                        onClick={() => create(k, `${String(h).padStart(2, '0')}:00`)}
                        className="min-h-[56px] border-l border-slate-100 p-1 space-y-0.5 cursor-pointer hover:bg-slate-50"
                      >
                        {evs.map((e: any) => (
                          <EventChip key={e.id} e={e} onClick={setEdit} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
        {Object.entries(TYPE_C).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            {k}
          </span>
        ))}
      </div>

      {/* Selected Date Agenda for Mobile Users */}
      <div className="sm:hidden mt-6">
        <h3 className="font-semibold text-sm text-[#111827] mb-2">
          Agenda · {cur.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </h3>
        {selectedDayEvents.length === 0 ? (
          <Card className="p-4">
            <p className="text-xs text-slate-400 text-center">No meetings on this day.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((e: any) => (
              <Card
                key={e.id}
                className="p-3 border-l-4 cursor-pointer"
                style={{ borderLeftColor: TYPE_C[e.type] || '#6366F1' }}
                onClick={() => setEdit(e)}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm text-[#111827]">{e.title}</p>
                  <span className="text-xs text-slate-400">{e.type}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {e.time} ({e.duration} min) · With {e.withPerson}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FormModal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit meeting' : 'Schedule meeting'}
        fields={FIELDS.events(state)}
        initial={edit}
        extra={
          edit?.id && (
            <Button
              type="button"
              variant="danger"
              data-testid="event-delete-btn"
              onClick={() => {
                store.remove('events', edit.id);
                setEdit(null);
                toast.success('Meeting deleted');
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )
        }
        onSubmit={(v: any) => {
          if (edit.id) {
            store.update('events', edit.id, v);
          } else {
            store.add('events', { ...edit, ...v });
            store.notify(
              'Meeting scheduled',
              `${v.title} on ${v.date} at ${v.time || edit.time}`,
              'meeting'
            );
          }
          toast.success(edit.id ? 'Meeting updated' : 'Meeting scheduled');
        }}
      />
    </div>
  );
}
