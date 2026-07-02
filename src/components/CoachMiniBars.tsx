// Detects markdown list lines shaped like "- Label: ₹1234" (with optional bold)
// and renders a compact horizontal bar chart. Non-matching content renders as-is via ReactMarkdown.
import ReactMarkdown from 'react-markdown';

type Row = { label: string; value: number };

const LINE_RE = /^\s*[-*•]\s*\*{0,2}([^:*]+?)\*{0,2}\s*[:\-–]\s*(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)\s*(k|thousand|lakh|crore)?/i;

function parseRows(text: string): { rows: Row[]; matchedLines: Set<number> } {
  const rows: Row[] = [];
  const matched = new Set<number>();
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    const m = LINE_RE.exec(ln);
    if (!m) return;
    let val = parseFloat(m[2].replace(/,/g, ''));
    if (isNaN(val)) return;
    const suf = m[3]?.toLowerCase();
    if (suf === 'k' || suf === 'thousand') val *= 1000;
    else if (suf === 'lakh') val *= 100000;
    else if (suf === 'crore') val *= 10000000;
    rows.push({ label: m[1].trim(), value: val });
    matched.add(i);
  });
  return { rows, matchedLines: matched };
}

export function CoachMessageBody({ content }: { content: string }) {
  const { rows, matchedLines } = parseRows(content);

  // Need ≥2 numeric rows to justify a chart; otherwise plain markdown.
  if (rows.length < 2) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Split content into pre-list, list block, post-list.
  const lines = content.split('\n');
  const firstMatch = Math.min(...matchedLines);
  const lastMatch = Math.max(...matchedLines);
  const pre = lines.slice(0, firstMatch).join('\n').trim();
  const post = lines.slice(lastMatch + 1).join('\n').trim();

  const max = Math.max(...rows.map(r => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-3">
      {pre && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{pre}</ReactMarkdown>
        </div>
      )}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
        {rows.map((r, i) => {
          const pct = max > 0 ? (r.value / max) * 100 : 0;
          const share = total > 0 ? Math.round((r.value / total) * 100) : 0;
          return (
            <div key={i} className="text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-medium truncate pr-2">{r.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  ₹{r.value.toLocaleString('en-IN')} <span className="opacity-60">· {share}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-background overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {post && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{post}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
