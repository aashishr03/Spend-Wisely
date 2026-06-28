// Local, deterministic parser for voice transactions.
// Never depends on previous state — every call is independent.

export type ParsedVoiceTx = {
  amount: number | null;
  type: 'income' | 'expense' | null;
  category: string | null;
  description: string;
  raw: string;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'lunch', 'dinner', 'breakfast', 'snack', 'restaurant', 'cafe', 'coffee', 'tea', 'pizza', 'burger', 'meal', 'zomato', 'swiggy'],
  Groceries: ['grocery', 'groceries', 'vegetables', 'fruits', 'supermarket', 'bigbasket', 'dmart'],
  Shopping: ['shopping', 'clothes', 'clothing', 'shirt', 'shoes', 'amazon', 'flipkart', 'myntra', 'dress'],
  Travel: ['travel', 'uber', 'ola', 'taxi', 'cab', 'auto', 'bus', 'train', 'flight', 'petrol', 'fuel', 'metro'],
  Entertainment: ['movie', 'netflix', 'spotify', 'concert', 'game', 'entertainment', 'subscription'],
  Health: ['medicine', 'doctor', 'hospital', 'pharmacy', 'medical', 'health', 'gym'],
  Education: ['education', 'course', 'book', 'books', 'tuition', 'fees', 'fee', 'college', 'school', 'udemy', 'coursera'],
  Bills: ['bill', 'bills', 'electricity', 'water', 'internet', 'wifi', 'recharge', 'mobile', 'rent', 'gas'],
  Salary: ['salary', 'paycheck'],
  Freelance: ['freelance', 'freelancing', 'gig', 'client'],
  Other: [],
};

const INCOME_KEYWORDS = ['earned', 'received', 'got', 'income', 'salary', 'freelance', 'pocket money', 'bonus', 'refund', 'credited', 'gift'];
const EXPENSE_KEYWORDS = ['spent', 'paid', 'bought', 'purchased', 'gave', 'debited', 'expense'];

const WORD_NUMBERS: Record<string, number> = {
  hundred: 100, thousand: 1000, lakh: 100000, lac: 100000, crore: 10000000,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function extractAmount(text: string): number | null {
  // 1) Numeric with optional ₹/rs/inr and k/thousand suffix
  const numRegex = /(?:₹|rs\.?|inr|rupees?)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(k|thousand|lakh|lac|crore)?/gi;
  let best: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = numRegex.exec(text)) !== null) {
    const raw = m[1].replace(/,/g, '');
    let val = parseFloat(raw);
    if (isNaN(val)) continue;
    const suffix = m[2]?.toLowerCase();
    if (suffix === 'k' || suffix === 'thousand') val *= 1000;
    else if (suffix === 'lakh' || suffix === 'lac') val *= 100000;
    else if (suffix === 'crore') val *= 10000000;
    if (val > 0 && (best === null || val > best)) best = val;
  }
  if (best !== null) return best;

  // 2) Word-based fallback ("five hundred")
  const lower = text.toLowerCase();
  const tokens = lower.split(/\s+/);
  let acc = 0, current = 0;
  for (const t of tokens) {
    const n = WORD_NUMBERS[t];
    if (n === undefined) continue;
    if (n >= 100) current = (current || 1) * n;
    else current += n;
  }
  acc = current;
  return acc > 0 ? acc : null;
}

function detectType(text: string): 'income' | 'expense' | null {
  const lower = text.toLowerCase();
  for (const w of INCOME_KEYWORDS) if (lower.includes(w)) return 'income';
  for (const w of EXPENSE_KEYWORDS) if (lower.includes(w)) return 'expense';
  return null;
}

function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw)) return cat;
    }
  }
  return null;
}

export function parseVoiceTransaction(rawInput: string): ParsedVoiceTx {
  const raw = (rawInput || '').trim();
  console.log('[VoiceParser] Raw transcript:', raw);

  const amount = extractAmount(raw);
  let type = detectType(raw);
  const category = detectCategory(raw);

  // If category implies income (Salary/Freelance) and type missing, default to income
  if (!type && (category === 'Salary' || category === 'Freelance')) type = 'income';
  // If amount present and still no type, default to expense
  if (!type && amount !== null) type = 'expense';

  const description = category || (raw.length > 0 ? raw.slice(0, 40) : '');

  const parsed: ParsedVoiceTx = { amount, type, category, description, raw };
  console.log('[VoiceParser] Parsed:', parsed);
  return parsed;
}
