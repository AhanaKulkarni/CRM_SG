'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Avatar, cn } from './kit';

export function ChatPanel({
  mode = 'team',
  greeting,
  chips = [],
  className,
  testid,
}: {
  mode?: string;
  greeting?: string;
  chips?: string[];
  className?: string;
  testid?: string;
}) {
  const { state, add, notify } = useStore();
  const [msgs, setMsgs] = useState<any[]>([
    {
      id: 'init',
      who: mode === 'team' ? 'AI' : 'Bot',
      text: greeting || 'Hello! How can I assist you with your business today?',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg = {
      id: 'u-' + Date.now(),
      who: 'You',
      text: queryText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMsgs((m) => [...m, userMsg]);
    setTxt('');
    setBusy(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, mode }),
      });

      if (res.ok) {
        const data = await res.json();
        setMsgs((m) => [
          ...m,
          {
            id: 'ai-' + Date.now(),
            who: mode === 'team' ? 'AI' : 'Bot',
            text: data.reply,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMsgs((m) => [
          ...m,
          {
            id: 'err-' + Date.now(),
            who: mode === 'team' ? 'AI' : 'Bot',
            text: 'I could not process this request right now.',
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          id: 'err-' + Date.now(),
          who: mode === 'team' ? 'AI' : 'Bot',
          text: 'Network connection error.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-slate-50/50', className)} data-testid={testid}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 thin-scroll">
        {msgs.map((m) => (
          <div key={m.id} className={cn('flex gap-3 fade-up', m.who === 'You' ? 'justify-end' : 'justify-start')}>
            {m.who !== 'You' && (
              <span className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            )}
            <div
              className={cn(
                'max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed whitespace-pre-wrap',
                m.who === 'You'
                  ? 'bg-brand text-white rounded-br-none'
                  : 'bg-white border border-[#E1E5ED] text-slate-800 rounded-bl-none'
              )}
            >
              <div className="text-[10px] font-semibold tracking-wider uppercase mb-1 opacity-60">
                {m.who} · {m.time}
              </div>
              {m.text}
            </div>
            {m.who === 'You' && <Avatar name={state.session?.name || 'You'} size={28} />}
          </div>
        ))}
        {busy && (
          <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
            <span className="w-6 h-6 rounded-lg bg-brand-soft text-brand flex items-center justify-center animate-pulse">
              <Sparkles className="w-3 h-3" />
            </span>
            <span>Thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chips.length > 0 && (
        <div className="p-2 border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar bg-white">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => sendQuery(c)}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors shrink-0"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuery(txt);
        }}
        className="p-3 bg-[#F5F6FA] border-t border-[#E1E5ED] flex gap-2"
      >
        <input
          data-testid="ai-chat-input"
          value={txt}
          onChange={(e) => setTxt(e.target.value)}
          placeholder="Ask a question or type a command…"
          className="flex-1 h-10 rounded-xl neu-inset px-3.5 text-sm text-[#1C2433] placeholder:text-[#778196] outline-none"
        />
        <button
          type="submit"
          disabled={busy || !txt.trim()}
          data-testid="ai-chat-send"
          className="h-10 px-4 rounded-xl neu-btn-primary flex items-center justify-center font-medium disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { state } = useStore();

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        data-testid="chat-widget-toggle"
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 rounded-2xl neu-btn-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="AI Copilot"
        aria-label="Toggle AI Copilot"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            data-testid="chat-widget-window"
            className="fixed bottom-36 lg:bottom-22 right-4 sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-[390px] h-[520px] max-h-[75vh] rounded-2xl bg-[#F5F6FA] border border-white/80 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="h-14 px-4 bg-[#171C2C] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{state.bot?.name || 'Nexa'} Copilot</p>
                  <p className="text-[10px] text-slate-400">Ask about leads, calls & tasks</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ChatPanel
              mode="team"
              className="flex-1"
              chips={[
                'How many open leads do we have?',
                'What tasks are pending?',
                'Book a demo',
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
