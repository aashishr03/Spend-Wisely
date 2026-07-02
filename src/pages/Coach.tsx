import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Loader2, Sparkles, MessageSquare, Clock, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';
import { CoachMessageBody } from '@/components/CoachMiniBars';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };
type SavedConvo = { id: string; title: string; updatedAt: number; messages: Msg[] };

const STORAGE_KEY = 'spend-wisely:coach-conversation';
const HISTORY_KEY = 'spend-wisely:coach-history';

const STUDENT_SUGGESTIONS = [
  'Where did my pocket money go this month?',
  'How much should I save from my stipend?',
  'Am I overspending on food?',
  'How do I start a placement savings goal?',
  'What SIP amount fits a student budget?',
  'Give me 3 ways to cut spending this week.',
];

const PRO_SUGGESTIONS = [
  'Where did my money go this month?',
  'Am I saving enough for my age?',
  'Can I afford my current goal?',
  'What category am I overspending in?',
  'How much should I invest every month?',
  'How do I improve my financial score?',
];

const DEFAULT_SUGGESTIONS = [
  'Where did my money go this month?',
  'Am I saving enough?',
  'Can I afford my goal?',
  'What category am I overspending in?',
  'How can I improve my financial score?',
  'How much should I invest every month?',
];

const Coach = () => {
  const { data: profile } = useProfile();
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [{
      id: 'welcome', role: 'assistant',
      content: "Hi! I'm your **AI Financial Coach** 🤝\n\nAsk me about your spending, savings, goals, or how to make smarter money decisions. Every answer will explain the *why*.",
    }];
  });
  const [history, setHistory] = useState<SavedConvo[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const ask = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const hist = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages: hist } });
      if (error) throw error;
      if (data?.error) {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: `⚠️ ${data.error}` }]);
        return;
      }
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data?.reply || "Sorry, I couldn't generate a response." }]);
    } catch {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: "I'm having trouble connecting right now. Try again in a moment. 🙏" }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const archiveAndReset = () => {
    const userMsgs = messages.filter(m => m.role === 'user');
    if (userMsgs.length > 0) {
      const title = userMsgs[0].content.slice(0, 60);
      const convo: SavedConvo = { id: `c-${Date.now()}`, title, updatedAt: Date.now(), messages };
      const next = [convo, ...history].slice(0, 10);
      setHistory(next);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
    }
    setMessages([{
      id: 'welcome', role: 'assistant',
      content: "Fresh start 🌱 — what would you like to figure out?",
    }]);
  };

  const restoreConvo = (c: SavedConvo) => {
    setMessages(c.messages);
  };

  const deleteHistoryItem = (id: string) => {
    const next = history.filter(h => h.id !== id);
    setHistory(next);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
  };

  const suggestions = DEFAULT_SUGGESTIONS;
  const recentTopics = useMemo(
    () => messages.filter(m => m.role === 'user').slice(-5).reverse(),
    [messages]
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-4 h-[calc(100dvh-11rem)] md:h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> AI Coach
            </h1>
            <p className="text-sm text-muted-foreground">
              Conversational financial mentor — explains spending, suggests savings, answers questions.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={archiveAndReset}>New conversation</Button>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-4 flex-1 min-h-0">
          {/* Sidebar — Suggested + Recent + History */}
          <div className="hidden md:flex flex-col gap-3 min-h-0">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="w-full text-left text-xs rounded-md border border-border px-2.5 py-1.5 hover:bg-primary/10 hover:border-primary/40 transition leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </CardContent>
            </Card>

            {recentTopics.length > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Recent in this chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {recentTopics.map(m => (
                    <p key={m.id} className="text-xs text-muted-foreground truncate" title={m.content}>
                      • {m.content}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {history.length > 0 && (
              <Card className="glass-card flex-1 min-h-0 flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> Conversation History
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-2">
                  <ScrollArea className="h-full pr-1">
                    <div className="space-y-1">
                      {history.map(c => (
                        <div key={c.id} className="group flex items-start gap-1 rounded-md hover:bg-muted/40 p-1.5">
                          <button
                            onClick={() => restoreConvo(c)}
                            className="flex-1 min-w-0 text-left text-xs"
                          >
                            <p className="truncate font-medium">{c.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(c.updatedAt).toLocaleDateString()}
                            </p>
                          </button>
                          <button
                            onClick={() => deleteHistoryItem(c.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat panel */}
          <Card className="glass-card flex flex-col overflow-hidden min-h-0">
            <ScrollArea className="flex-1">
              <div ref={scrollRef} className="p-4 md:p-6 space-y-4">
                {messages.map(m => (
                  <motion.div
                    key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'text-foreground'
                    )}>
                      {m.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Mobile suggestion chips (since sidebar is hidden) */}
            <div className="md:hidden px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map(s => (
                <Badge
                  key={s} variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition py-1.5"
                  onClick={() => ask(s)}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> {s}
                </Badge>
              ))}
            </div>

            <CardContent className="border-t border-border p-3">
              <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
                <Input
                  ref={inputRef} placeholder="Ask your Coach anything…"
                  value={input} onChange={e => setInput(e.target.value)} disabled={loading}
                />
                <Button type="submit" size="icon" className="gradient-primary shrink-0" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Coach;
