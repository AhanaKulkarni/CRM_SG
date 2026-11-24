'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Hash, Paperclip, Send, FileText, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';
import { Card, Avatar, cn } from '@/components/kit';

const REPLIES = [
  'Got it, thanks!',
  'On it right now.',
  'Sounds good — I will update the CRM.',
  'Can we discuss this in the stand-up?',
  'Great work team!',
];

export default function ChatView() {
  const store = useStore();
  const { state } = store;
  const [ch, setCh] = useState('general');
  const [txt, setTxt] = useState('');
  const [mobileList, setMobileList] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  const me = state.session?.name || 'Aisha Khan';
  const defaultChannels = [
    { id: 'general', name: 'general', type: 'channel' },
    { id: 'sales', name: 'sales', type: 'channel' },
    { id: 'marketing', name: 'marketing', type: 'channel' },
    { id: 'support', name: 'support', type: 'channel' },
  ];

  const channels = (state.channels && state.channels.length > 0) ? state.channels : defaultChannels;
  const channel = channels.find((c: any) => c.id === ch) || channels[0] || defaultChannels[0];
  const msgs = (state.messages || []).filter((m: any) => m.channelId === ch || m.channel === ch);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, ch]);

  const post = (text: string, file?: string) => {
    const newMsg = {
      channelId: ch,
      channel: ch,
      author: me,
      text,
      file: file || '',
      time: new Date().toISOString(),
    };
    store.add('messages', newMsg);

    // Simulated reply if channel or DM
    setTimeout(() => {
      const author =
        channel.type === 'dm'
          ? channel.name
          : (state.employees || [])[0]?.name || 'Rohan Mehta';
      store.add('messages', {
        channelId: ch,
        channel: ch,
        author,
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        time: new Date().toISOString(),
      });
    }, 1200);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txt.trim()) return;
    post(txt);
    setTxt('');
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    post('', f.name);
    toast.success(`${f.name} shared`);
    e.target.value = '';
  };

  const List = ({ type, title }: { type: string; title: string }) => (
    <div className="mb-5">
      <p className="px-3 mb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
        {title}
      </p>
      {channels
        .filter((c: any) => c.type === type)
        .map((c: any) => (
          <button
            key={c.id}
            data-testid={`chat-channel-${c.id}`}
            onClick={() => {
              setCh(c.id);
              setMobileList(false);
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 h-9 rounded-lg text-sm transition-colors text-left',
              ch === c.id
                ? 'bg-brand-soft text-[#111827] font-semibold'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            {type === 'channel' ? (
              <Hash className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <Avatar name={c.name} size={20} />
            )}
            <span className="truncate">{c.name}</span>
          </button>
        ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight mb-1 text-[#111827]">
        Internal Chat
      </h1>
      <p className="text-sm text-slate-500 mb-6">Department channels and direct messages for your team.</p>

      <Card className="flex h-[calc(100vh-230px)] min-h-[480px] overflow-hidden">
        {/* Left Channels List */}
        <aside
          className={cn(
            'w-full md:w-64 border-r border-[#E5E7EB] p-3 overflow-y-auto thin-scroll',
            !mobileList && 'hidden md:block'
          )}
        >
          <List type="channel" title="Department channels" />
          <List type="dm" title="Direct messages" />
        </aside>

        {/* Right Messages Area */}
        <section className={cn('flex-1 flex flex-col min-w-0 bg-white', mobileList && 'hidden md:flex')}>
          <div className="h-14 flex items-center gap-2 px-4 border-b border-[#E5E7EB]">
            <button
              className="md:hidden p-1 mr-1 text-slate-500 hover:text-slate-800"
              onClick={() => setMobileList(true)}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {channel?.type === 'channel' ? (
              <Hash className="w-4 h-4 text-slate-400" />
            ) : (
              <Avatar name={channel?.name || 'General'} size={24} />
            )}
            <span className="font-semibold text-sm text-[#111827]" data-testid="chat-channel-title">
              {channel?.name || 'general'}
            </span>
            {channel?.type === 'channel' && (
              <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {(state.employees || []).length || 4} members
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-4" data-testid="chat-messages">
            {msgs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <p>No messages yet in #{channel?.name || 'general'}.</p>
                <p className="text-xs text-slate-400 mt-1">Start the conversation below.</p>
              </div>
            ) : (
              msgs.map((m: any) => (
                <div key={m.id} className="flex gap-3 fade-up">
                  <Avatar name={m.author} size={34} />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold text-[#111827]">{m.author}</span>{' '}
                      <span className="text-xs text-slate-400 ml-1">
                        {new Date(m.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                    {m.text && <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{m.text}</p>}
                    {m.file && (
                      <div
                        className="mt-1.5 inline-flex items-center gap-3 rounded-lg border border-[#E5E7EB] px-3 py-2 bg-slate-50"
                        data-testid="chat-file"
                      >
                        <FileText className="w-5 h-5 text-brand" />
                        <div>
                          <p className="text-sm font-medium text-[#111827]">{m.file}</p>
                          <p className="text-xs text-slate-400">Attached file</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={end} />
          </div>

          <form onSubmit={send} className="flex gap-2 p-3 border-t border-[#E5E7EB]">
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              onChange={onFile}
              data-testid="chat-file-input"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-10 w-10 shrink-0 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
              data-testid="chat-attach-btn"
              title="Attach File"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              data-testid="chat-message-input"
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder={`Message ${channel.type === 'channel' ? '#' : ''}${channel.name}`}
              className="flex-1 min-w-0 h-10 rounded-lg border border-[#E5E7EB] px-3 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              data-testid="chat-send-btn"
              disabled={!txt.trim()}
              className="h-10 px-4 rounded-lg bg-brand text-white flex items-center gap-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>
      </Card>
    </div>
  );
}
