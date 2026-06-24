import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useFinance';
import { cn } from '@/lib/utils';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'spend-wisely:coach-conversation';

const buildSuggestions = (student: boolean) => student ? [
  'Where did my pocket money go this week?',
  'How can I save ₹2,000 for my certification?',
  'Am I on track for my Placement Fund?',
  'Give me 3 cuts I can make to save more.',
] : [
  'Where did my money go this month?',
  'How can I improve my savings rate?',
  'Am I overspending in any category?',
  'How should I think about an emergency fund?',
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
      const history = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-chat', { body: { messages: history } });
      if (error) throw error;
      if (data?.error) {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: `⚠️ ${data.error}` }]);
        return;
      }
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data?.reply || "Sorry, I couldn't generate a response." }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: "I'm having trouble connecting right now. Try again in a moment. 🙏" }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome', role: 'assistant',
      content: "Fresh start 🌱 — what would you like to figure out?",
    }]);
  };

  const suggestions = buildSuggestions(!!profile?.student_mode);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-4 h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" /> AI Coach
            </h1>
            <p className="text-sm text-muted-foreground">
              Conversational financial mentor — explains spending, suggests savings, answers questions.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={clearConversation}>New conversation</Button>
        </div>

        <Card className="glass-card flex-1 flex flex-col overflow-hidden">
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

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.map(s => (
                <Badge
                  key={s} variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition py-1.5"
                  onClick={() => ask(s)}
                >
                  <Sparkles className="h-3 w-3 mr-1" /> {s}
                </Badge>
              ))}
            </div>
          )}

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
    </AppLayout>
  );
};

export default Coach;
