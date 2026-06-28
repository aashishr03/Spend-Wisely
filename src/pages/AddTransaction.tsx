import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Mic, MicOff, Camera, CalendarIcon, IndianRupee, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AppLayout } from '@/components/AppLayout';
import { useCategories, useAccounts, useAddTransaction, useUsageLimits, useIncrementUsage, useProfile } from '@/hooks/useFinance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { parseVoiceTransaction, type ParsedVoiceTx } from '@/lib/parseVoiceTransaction';

const formatAmountDisplay = (val: string) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-IN');
};

const AddTransaction = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: usage } = useUsageLimits();
  const { data: profile } = useProfile();
  const addTx = useAddTransaction();
  const incrementUsage = useIncrementUsage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Voice state — transcript kept in a ref so each recording is independent (no stale closure).
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [voiceParsing, setVoiceParsing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  // Voice confirmation
  const [voiceConfirm, setVoiceConfirm] = useState<ParsedVoiceTx | null>(null);

  // Receipt state
  const [receiptParsing, setReceiptParsing] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const isPremium = profile?.plan_type === 'premium';
  const filteredCategories = categories.filter((c) => c.type === type);
  const defaultAccount = accounts.find((a) => a.is_default) || accounts[0];

  const applyParsedResult = (result: any) => {
    if (result.amount) setAmount(String(result.amount));
    if (result.description) setDescription(result.description);
    if (result.type) setType(result.type);
    if (result.category) {
      const cat = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
      if (cat) setSelectedCategory(cat.id);
    }
    if (result.date) {
      try {
        setDate(new Date(result.date + 'T00:00:00'));
      } catch {}
    }
  };

  const handleSubmit = async () => {
    if (!amount || !selectedCategory || !defaultAccount) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await addTx.mutateAsync({
        account_id: defaultAccount.id,
        category_id: selectedCategory,
        amount: parseFloat(amount),
        type,
        description,
        notes,
        date: format(date, 'yyyy-MM-dd'),
      });
      toast.success('Transaction added!');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to add transaction');
    }
  };

  // ─── Voice Entry ───
  const handleVoice = () => {
    if (!isPremium && (usage?.voice_entries_used ?? 0) >= 5) {
      setShowUpgradeModal(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Hard reset all previous voice state before every new recording.
    finalTranscriptRef.current = '';
    setVoiceText('');
    setVoiceConfirm(null);

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      finalTranscriptRef.current = '';
      setVoiceText('');
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      // Always overwrite — never accumulate across recordings.
      finalTranscriptRef.current = finalText;
      setVoiceText(finalText || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      const text = (finalTranscriptRef.current || '').trim();
      // Clear ref so a follow-up retry without speech doesn't reuse it.
      finalTranscriptRef.current = '';
      if (!text) {
        toast.error('No speech detected. Please try again.');
        setVoiceText('');
        return;
      }
      handleParsedVoice(text);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      finalTranscriptRef.current = '';
      setVoiceText('');
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        toast.error('Voice recognition error. Please try again.');
      }
    };

    recognition.start();
  };

  const handleParsedVoice = (text: string) => {
    const parsed = parseVoiceTransaction(text);
    console.log('[VoiceEntry] Parsed amount:', parsed.amount);
    console.log('[VoiceEntry] Parsed category:', parsed.category);
    console.log('[VoiceEntry] Parsed type:', parsed.type);

    if (!parsed.amount || !parsed.type || !parsed.category) {
      const missing = [
        !parsed.amount && 'amount',
        !parsed.type && 'type',
        !parsed.category && 'category',
      ].filter(Boolean).join(', ');
      toast.error(`Could not detect ${missing}. Please try again — say something like "spent 500 on food".`);
      setVoiceText('');
      return;
    }
    setVoiceConfirm(parsed);
  };

  const confirmVoice = () => {
    if (!voiceConfirm) return;
    const { amount: amt, type: t, category, description: desc } = voiceConfirm;
    setAmount(String(amt));
    setType(t!);
    setDescription(desc);
    const cat = categories.find(c => c.name.toLowerCase() === category!.toLowerCase() && c.type === t);
    if (cat) setSelectedCategory(cat.id);
    incrementUsage.mutate('voice_entries_used');
    toast.success('Voice entry applied — review and save.');
    console.log('[VoiceEntry] Final object applied:', { amount: amt, type: t, category, description: desc });
    setVoiceConfirm(null);
    setVoiceText('');
  };

  const editVoice = () => {
    if (!voiceConfirm) return;
    const { amount: amt, type: t, category, description: desc } = voiceConfirm;
    if (amt) setAmount(String(amt));
    if (t) setType(t);
    if (desc) setDescription(desc);
    if (category) {
      const cat = categories.find(c => c.name.toLowerCase() === category.toLowerCase() && c.type === (t ?? type));
      if (cat) setSelectedCategory(cat.id);
    }
    setVoiceConfirm(null);
    setVoiceText('');
  };

  const cancelVoice = () => {
    setVoiceConfirm(null);
    setVoiceText('');
  };

  // ─── Receipt Scan ───
  const handleReceipt = () => {
    if (!isPremium && (usage?.receipt_scans_used ?? 0) >= 5) {
      setShowUpgradeModal(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Please use an image under 5MB.');
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setReceiptPreview(previewUrl);
    setReceiptParsing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('parse-transaction', {
        body: { mode: 'receipt', imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.result) {
        applyParsedResult(data.result);
        incrementUsage.mutate('receipt_scans_used');
        toast.success('Receipt scanned successfully!');
      }
    } catch (err) {
      console.error('Receipt parse error:', err);
      toast.error('Failed to scan receipt. Please enter manually.');
    } finally {
      setReceiptParsing(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type toggle */}
              <Tabs value={type} onValueChange={(v) => { setType(v as 'income' | 'expense'); setSelectedCategory(''); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">Expense</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button
                  variant={isListening ? 'default' : 'outline'}
                  className={cn('flex-1', isListening && 'gradient-primary animate-pulse')}
                  onClick={handleVoice}
                  disabled={voiceParsing}
                >
                  {voiceParsing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
                  ) : isListening ? (
                    <><MicOff className="mr-2 h-4 w-4" /> Stop</>
                  ) : (
                    <><Mic className="mr-2 h-4 w-4" /> Voice Entry</>
                  )}
                  {!isPremium && !isListening && !voiceParsing && (
                    <span className="ml-1 text-xs text-muted-foreground">({usage?.voice_entries_used ?? 0}/5)</span>
                  )}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleReceipt} disabled={receiptParsing}>
                  {receiptParsing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...</>
                  ) : (
                    <><Camera className="mr-2 h-4 w-4" /> Scan Receipt</>
                  )}
                  {!isPremium && !receiptParsing && (
                    <span className="ml-1 text-xs text-muted-foreground">({usage?.receipt_scans_used ?? 0}/5)</span>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              {/* Voice listening indicator */}
              <AnimatePresence>
                {isListening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm font-medium">Listening...</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {voiceText || 'Say something like "Spent 500 rupees on groceries"'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Receipt preview */}
              <AnimatePresence>
                {receiptPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative rounded-lg border border-border overflow-hidden"
                  >
                    <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-cover" />
                    {receiptParsing && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span>Analyzing receipt...</span>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7 bg-background/50"
                      onClick={() => setReceiptPreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-2xl font-heading font-bold h-14 pl-10"
                  />
                </div>
                {amount && (
                  <p className="text-xs text-muted-foreground">Rs.{formatAmountDisplay(amount)}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="What was this for?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category chips */}
              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all text-xs',
                        selectedCategory === cat.id
                          ? 'border-primary bg-accent shadow-sm scale-[1.02]'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      )}
                    >
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-medium truncate w-full text-center">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>

              <Button onClick={handleSubmit} className="w-full gradient-primary h-12 text-base" disabled={addTx.isPending}>
                {addTx.isPending ? 'Saving...' : 'Save Transaction'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade Modal */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Upgrade to Premium</DialogTitle>
              <DialogDescription>
                You've reached your free monthly limit. Upgrade to Premium for unlimited access to voice entries, receipt scans, and AI features.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpgradeModal(false)}>Maybe Later</Button>
              <Button className="gradient-primary" onClick={() => { setShowUpgradeModal(false); navigate('/settings'); }}>
                Upgrade Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voice confirmation modal */}
        <Dialog open={!!voiceConfirm} onOpenChange={(o) => !o && cancelVoice()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Confirm voice entry</DialogTitle>
              <DialogDescription>Review the detected transaction before saving.</DialogDescription>
            </DialogHeader>
            {voiceConfirm && (
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Type</span>
                  <span className={cn('text-sm font-semibold', voiceConfirm.type === 'income' ? 'text-success' : 'text-destructive')}>
                    {voiceConfirm.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Category</span>
                  <span className="text-sm font-medium">{voiceConfirm.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Amount</span>
                  <span className="font-heading text-xl font-bold">₹{voiceConfirm.amount?.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">"{voiceConfirm.raw}"</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={cancelVoice}>Cancel</Button>
              <Button variant="outline" onClick={editVoice}>Edit</Button>
              <Button className="gradient-primary" onClick={confirmVoice}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
};

export default AddTransaction;
