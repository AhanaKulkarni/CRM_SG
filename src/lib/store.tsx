'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { MotionConfig } from 'framer-motion';

const Ctx = createContext<any>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<any>({
    session: null,
    brand: {
      name: 'StartAppGuru CRM',
      short: 'StartAppGuru',
      logo: '/logo.png',
      favicon: '/logo.png',
      primary: '#1E2B6D',
      secondary: '#22C55E',
      loginHeadline: 'Accelerate your entire revenue engine',
      loginSub: 'Manage leads, run telecalling campaigns, record calls and grow your business — all in one platform.',
      company: {
        legal: 'Start App Guru Pvt. Ltd.',
        gst: '',
        email: 'hello@startappguru.com',
        phone: '',
        website: 'https://startappguru.com',
        address: '',
      },
    },
    bot: {
      name: 'Nexa',
      greeting: 'Namaste! I am Nexa, your AI assistant. How can I help you today?',
      qualify: true,
      booking: true,
      handoff: true,
    },
    orgs: [],
    employees: [],
    leads: [],
    customers: [],
    tasks: [],
    todos: [],
    events: [],
    reminders: [],
    notifications: [],
    campaigns: [],
    calls: [],
    notes: [],
    invoices: [],
    channels: [],
    messages: [],
    tickets: [],
    workflows: [],
    runs: [],
    integrations: [],
    activity: [],
    enquiries: [],
    subscription: { plan: 'Pro', seats: 4, renews: '2026-12-31' },
    billing: [],
    formFields: [],
    kb: [],
    permissions: {},
    system: { maintenance: false, signups: false, twoFactor: false, region: 'Mumbai (ap-south-1)' },
    features: {},
  });

  const [loading, setLoading] = useState(true);

  const fetchCrmData = async () => {
    try {
      const res = await fetch('/api/crm/data');
      if (res.ok) {
        const data = await res.json();
        setState((prev: any) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (e) {
      console.error('Failed to load CRM data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  // Update brand CSS variables whenever brand colors change
  useEffect(() => {
    if (state.brand) {
      const b = state.brand;
      const root = document.documentElement;
      root.style.setProperty('--brand', b.primary || '#6965ED');
      root.style.setProperty('--brand2', b.secondary || '#8B83F6');
      document.title = `${b.name || 'AetherX'} · Business Platform`;
    }
  }, [state.brand]);

  const api = useMemo(() => {
    const add = async (col: string, item: any) => {
      const tempId = item.id || crypto.randomUUID();
      const rec = { id: tempId, ...item };

      // Optimistic update
      setState((s: any) => ({
        ...s,
        [col]: [rec, ...(s[col] || [])],
      }));

      try {
        const res = await fetch(`/api/crm/${col}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const { item: created } = await res.json();
          setState((s: any) => ({
            ...s,
            [col]: (s[col] || []).map((x: any) => (x.id === tempId ? created : x)),
          }));
          return created;
        }
      } catch (err) {
        console.error(`Failed to add item to ${col}`, err);
      }
      return rec;
    };

    const update = async (col: string, id: string, patch: any) => {
      // Optimistic update
      setState((s: any) => ({
        ...s,
        [col]: (s[col] || []).map((x: any) => (x.id === id ? { ...x, ...patch } : x)),
      }));

      try {
        await fetch(`/api/crm/${col}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch (err) {
        console.error(`Failed to update ${col} item ${id}`, err);
      }
    };

    const remove = async (col: string, id: string) => {
      // Optimistic removal
      setState((s: any) => ({
        ...s,
        [col]: (s[col] || []).filter((x: any) => x.id !== id),
      }));

      try {
        await fetch(`/api/crm/${col}/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error(`Failed to delete ${col} item ${id}`, err);
      }
    };

    const notify = async (title: string, body: string, type = 'system') => {
      const notif = {
        title,
        body,
        type,
        time: new Date().toISOString(),
        read: false,
      };
      await add('notifications', notif);
    };

    const log = async (who: string, what: string, target: string, type = 'system') => {
      const act = {
        who,
        what,
        target,
        type,
        time: new Date().toISOString(),
      };
      await add('activity', act);
    };

    const set = (key: string, val: any) => {
      setState((s: any) => ({
        ...s,
        [key]: typeof val === 'function' ? val(s[key]) : val,
      }));
    };

    const reset = async () => {
      try {
        await fetch('/api/crm/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' }),
        });
        await fetchCrmData();
      } catch (e) {
        console.error('Reset failed', e);
      }
    };

    return {
      state,
      loading,
      add,
      update,
      remove,
      set,
      notify,
      log,
      reset,
      refresh: fetchCrmData,
    };
  }, [state, loading]);

  return (
    <MotionConfig reducedMotion="user">
      <Ctx.Provider value={api}>{children}</Ctx.Provider>
    </MotionConfig>
  );
}

export const useStore = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
