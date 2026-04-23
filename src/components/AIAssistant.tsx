import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hi! 👋 I'm your Spend Wisely AI assistant. Ask me anything about your finances — spending, budgets, saving tips, or investments!" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history for context (last 10 messages)
      const history = [...messages, userMessage]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: history },
      });

      if (error) {
        console.error('AI chat invoke error:', error);
        throw error;
      }

      if (data?.error) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${data.error}`,
        }]);
        return;
      }

      const reply = data?.reply || "Sorry, I couldn't process that. Try again!";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      }]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errorMsg = err?.message?.includes('non-2xx')
        ? "The AI service is temporarily unavailable. Please try again in a moment."
        : "I'm having trouble connecting right now. Please try again in a moment! 🙏";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setOpen(!open)}
          className={cn(
            'h-14 w-14 rounded-full shadow-glow',
            open ? 'bg-muted text-foreground' : 'gradient-primary'
          )}
          size="icon"
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] md:bottom-24 md:right-8 md:w-[380px]"
          >
            <div className="glass-card rounded-2xl overflow-hidden shadow-[var(--shadow-xl)]">
              <div className="gradient-primary p-4">
                <h3 className="font-heading font-semibold text-primary-foreground">Spend Wisely AI</h3>
                <p className="text-xs text-primary-foreground/70">Your personal finance assistant</p>
              </div>
              <ScrollArea className="h-[300px] md:h-[350px] p-4">
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      )}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <Input
                    placeholder="Ask about your finances..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={loading}
                  />
                  <Button type="submit" size="icon" className="gradient-primary shrink-0" disabled={loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
