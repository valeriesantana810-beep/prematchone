import jsPDF from 'jspdf';
import type { PickItem } from '@/lib/supabase';

interface SlipData {
  reference: string;
  items: PickItem[];
  stake: number;
  totalOdds: number;
}

export function generatePdfSlip({ reference, items, stake, totalOdds }: SlipData) {
  const doc = new jsPDF({ unit: 'pt', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 28;
  let y = 30;

  doc.setFillColor(11, 7, 48);
  doc.rect(0, 0, pageWidth, 70, 'F');

  doc.setTextColor(245, 243, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Prematch.Bet', marginX, 35);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(144, 137, 184);
  doc.text('Your picks receipt', marginX, 50);

  doc.setTextColor(217, 200, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(reference, pageWidth - marginX, 35, { align: 'right' });
  doc.setTextColor(144, 137, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }), pageWidth - marginX, 50, { align: 'right' });

  y = 90;
  doc.setDrawColor(42, 36, 112);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 16;

  doc.setTextColor(144, 137, 184);
  doc.setFontSize(8);
  doc.text('MATCH', marginX, y);
  doc.text('SELECTION', marginX + 180, y);
  doc.text('ODDS', pageWidth - marginX, y, { align: 'right' });
  y += 8;
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 16;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  items.forEach((item, i) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. ${item.match}`, marginX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(item.selection, marginX + 180, y);
    doc.setTextColor(27, 14, 134);
    doc.setFont('helvetica', 'bold');
    doc.text(item.odds.toFixed(2), pageWidth - marginX, y, { align: 'right' });
    y += 20;
    doc.setTextColor(40, 40, 40);
  });

  y += 4;
  doc.setDrawColor(42, 36, 112);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  const colW = (pageWidth - marginX * 2) / 3;
  const stats = [
    { label: 'COMBINED', value: totalOdds.toFixed(2) },
    { label: 'STAKE', value: `N${stake.toFixed(2)}` },
    { label: 'POTENTIAL', value: `N${(stake * totalOdds).toFixed(2)}` },
  ];
  stats.forEach((stat, i) => {
    const cx = marginX + colW * i + colW / 2;
    doc.setTextColor(144, 137, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(stat.label, cx, y, { align: 'center' });
    doc.setTextColor(11, 7, 48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(stat.value, cx, y + 16, { align: 'center' });
  });
  y += 40;

  doc.setDrawColor(42, 36, 112);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 16;

  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const disclaimer = 'This is a confirmation request, not a payment receipt. Send your reference to Prematch.Bet on WhatsApp to confirm your picks.';
  const lines = doc.splitTextToSize(disclaimer, pageWidth - marginX * 2);
  doc.text(lines, marginX, y);

  doc.save(`prematch-picks-${reference}.pdf`);
}
