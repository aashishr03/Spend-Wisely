import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Transaction {
  date: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  categories?: { name: string } | null;
}

interface ReportData {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  dateFrom: string;
  dateTo: string;
}

// jsPDF default fonts only support basic ASCII/Latin-1.
// toLocaleString('en-IN') can produce non-breaking spaces and
// the rupee sign is outside Latin-1. Use plain formatting instead.
const formatAmount = (v: number): string => {
  const abs = Math.abs(v);
  const str = abs.toFixed(0);
  // Indian grouping: last 3 digits, then groups of 2
  if (str.length <= 3) return `Rs.${str}`;
  const last3 = str.slice(-3);
  let rest = str.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `Rs.${parts.join(',')},${last3}`;
};

export const downloadReportPDF = ({ transactions, totalIncome, totalExpense, dateFrom, dateTo }: ReportData) => {
  const doc = new jsPDF();
  const netBalance = totalIncome - totalExpense;

  // Header
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Spend Wisely', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Report: ' + dateFrom + ' to ' + dateTo, 14, 28);
  doc.text('Generated: ' + format(new Date(), 'PPP'), 210 - 14, 28, { align: 'right' });

  // Summary cards
  doc.setTextColor(0, 0, 0);
  const summaryY = 45;

  const drawSummaryBox = (x: number, label: string, value: string, color: [number, number, number]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, summaryY, 55, 22, 3, 3);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x + 5, summaryY + 8);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(value, x + 5, summaryY + 18);
    doc.setFont('helvetica', 'normal');
  };

  drawSummaryBox(14, 'Total Income', formatAmount(totalIncome), [34, 197, 94]);
  drawSummaryBox(77, 'Total Expenses', formatAmount(totalExpense), [239, 68, 68]);
  const netLabel = (netBalance >= 0 ? '+' : '-') + formatAmount(netBalance);
  drawSummaryBox(140, 'Net Balance', netLabel, netBalance >= 0 ? [34, 197, 94] : [239, 68, 68]);

  // Transaction table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transactions', 14, 80);
  doc.setFont('helvetica', 'normal');

  const tableData = transactions.map(tx => [
    tx.date,
    tx.description || tx.categories?.name || '-',
    tx.categories?.name || '-',
    tx.type === 'income' ? 'Income' : 'Expense',
    (tx.type === 'income' ? '+' : '-') + formatAmount(Number(tx.amount)),
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Page ' + i + ' of ' + pageCount, 105, 290, { align: 'center' });
    doc.text('Spend Wisely - AI Powered Finance', 14, 290);
  }

  doc.save('SpendWisely_Report_' + dateFrom + '_to_' + dateTo + '.pdf');
};
