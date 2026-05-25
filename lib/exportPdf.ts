import type { Tree } from '@/types';
import { formatPrice } from './utils';

// jsPDF's built-in Helvetica only covers Latin-1. Lithuanian characters
// (ą č ę ė į š ų ū ž and capitals) get rendered as boxes.
// Transliterate them to ASCII equivalents so the PDF renders cleanly.
function lt(text: string): string {
  return text
    .replace(/[Ą]/g, 'A').replace(/[ą]/g, 'a')
    .replace(/[Č]/g, 'C').replace(/[č]/g, 'c')
    .replace(/[Ę]/g, 'E').replace(/[ę]/g, 'e')
    .replace(/[Ė]/g, 'E').replace(/[ė]/g, 'e')
    .replace(/[Į]/g, 'I').replace(/[į]/g, 'i')
    .replace(/[Š]/g, 'S').replace(/[š]/g, 's')
    .replace(/[Ų]/g, 'U').replace(/[ų]/g, 'u')
    .replace(/[Ū]/g, 'U').replace(/[ū]/g, 'u')
    .replace(/[Ž]/g, 'Z').replace(/[ž]/g, 'z')
    // strip remaining non-Latin-1 characters that Helvetica can't encode
    .replace(/[^\x00-\xFF]/g, '?');
}

// Extract a short display name from a verbose Lithuanian canonical name.
// e.g. "Levanda (lot. Lavandula 'Hidcote Blue')" → "Lavandula 'Hidcote Blue'"
// Falls back to original name if no "lot." parenthetical is found.
function shortName(name: string): string {
  const lot = name.match(/\(lot\.\s*([^)]+)\)/i);
  if (lot) return lt(lot[1].trim());
  // strip parenthetical block and apply transliteration
  return lt(name.replace(/\s*\([^)]*\)/g, '').trim());
}

export async function generateGardenImageBase64(canvasEl: HTMLElement): Promise<string> {
  const html2canvas = (await import('html2canvas')).default;
  const snapshot = await html2canvas(canvasEl, {
    useCORS: true, allowTaint: true, scale: 2,
    backgroundColor: null, logging: false,
    ignoreElements: (el: Element) => el.hasAttribute('data-builder-ui'),
  });
  return snapshot.toDataURL('image/jpeg', 0.92);
}

export async function exportGardenPDF(
  items: Tree[],
  total: number,
  canvasEl: HTMLElement | null
): Promise<string> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297; const PH = 210; const margin = 14;

  const forestDark  = [36, 56, 38] as const;
  const forestMid   = [80, 129, 83] as const;
  const forestLight = [200, 218, 201] as const;
  const white       = [255, 255, 255] as const;
  const textDark    = [22, 35, 24] as const;
  const textMuted   = [100, 120, 102] as const;

  const header = (pageW: number) => {
    doc.setFillColor(...forestDark); doc.rect(0, 0, pageW, 18, 'F');
    doc.setFillColor(...forestMid); doc.rect(0, 16, pageW, 2, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('MB PLANT HOUSE', margin, 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 225, 202);
    doc.text(lt('Sodo planas ir kainų įvertis'), margin + 42, 11);
    const d = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(d, pageW - margin, 11, { align: 'right' });
  };

  const footer = (pageW: number, pageH: number) => {
    doc.setFillColor(...forestDark); doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setTextColor(...white); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    // footer address — transliterated
    doc.text(lt('MB Plant House · Uzuovejos g. 6, Piktoziu k., LT-96164 Klaipedos r. · +370 618 54758'), margin, pageH - 3.5);
    doc.setTextColor(180, 210, 182);
    doc.text('Reg. 306370600 · PVM LT100016663713', pageW - margin, pageH - 3.5, { align: 'right' });
  };

  // ── PAGE 1: Garden image ─────────────────────────────────────────────
  header(PW); footer(PW, PH);
  if (canvasEl) {
    const imgData = await generateGardenImageBase64(canvasEl);
    const canvasW = PW - margin * 2; const canvasH = PH - 28 - 14;
    const tmp = document.createElement('img'); tmp.src = imgData;
    await new Promise(r => { tmp.onload = r; tmp.onerror = r; });
    const imgAspect = tmp.naturalWidth / tmp.naturalHeight;
    const boxAspect = canvasW / canvasH;
    let drawW = canvasW, drawH = canvasH;
    if (imgAspect > boxAspect) drawH = drawW / imgAspect; else drawW = drawH * imgAspect;
    const imgX = margin + (canvasW - drawW) / 2; const imgY = 22;
    doc.addImage(imgData, 'JPEG', imgX, imgY, drawW, drawH);
    doc.setDrawColor(...forestLight); doc.setLineWidth(0.4);
    doc.rect(imgX, imgY, drawW, drawH);
  }

  // ── PAGE 2: Price list ───────────────────────────────────────────────
  doc.addPage('a4', 'portrait');
  const P2W = 210; const P2H = 297;
  header(P2W); footer(P2W, P2H);
  let y = 28; const cW = P2W - margin * 2;

  const countMap: Record<string, number> = {};
  items.forEach(t => { countMap[t.id] = (countMap[t.id] || 0) + 1; });
  const unique = items.filter((t, i, a) => a.findIndex(x => x.id === t.id) === i);

  doc.setFillColor(...forestLight);
  doc.roundedRect(margin, y, cW, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...textMuted);
  doc.text(lt('AUGALAS'), margin + 4, y + 6);
  doc.text(lt('BOTANINIS PAVADINIMAS'), margin + 72, y + 6);
  doc.text(lt('AUKŠTIS'), margin + 130, y + 6);
  doc.text(lt('KIEKIS'), margin + 152, y + 6);
  doc.text(lt('KAINA'), P2W - margin - 2, y + 6, { align: 'right' });
  y += 12;

  unique.forEach((tree, idx) => {
    const qty = countMap[tree.id] || 1;
    const rowH = 13;
    if (idx % 2 === 0) { doc.setFillColor(248, 252, 248); doc.rect(margin, y - 1.5, cW, rowH, 'F'); }
    const dot: readonly [number,number,number] =
      tree.category === 'fruit' ? [200, 80, 45] :
      tree.category === 'evergreen' ? [29, 158, 117] :
      tree.category === 'shrub' ? [127, 119, 221] : forestMid;
    doc.setFillColor(...dot); doc.circle(margin + 3, y + 4, 2.2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textDark);
    // Use shortName to strip verbose parentheticals and transliterate
    const display = shortName(tree.name);
    doc.text(display, margin + 8, y + 5.5);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...textMuted);
    doc.text(lt(tree.latin), margin + 72, y + 5.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...textDark);
    doc.text(lt(tree.height || '-'), margin + 130, y + 5.5);
    doc.text(String(qty), margin + 156, y + 5.5, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...forestDark);
    doc.text(formatPrice(tree.price * qty), P2W - margin - 2, y + 5.5, { align: 'right' });
    doc.setDrawColor(...forestLight); doc.setLineWidth(0.3);
    doc.line(margin, y + rowH - 1.5, P2W - margin, y + rowH - 1.5);
    y += rowH;
  });

  y += 5;
  doc.setFillColor(...forestDark); doc.roundedRect(margin, y, cW, 16, 2.5, 2.5, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(lt('Apytikslė suma'), margin + 5, y + 6.5);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text(formatPrice(total), P2W - margin - 5, y + 11, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 225, 202);
  doc.text(lt('Neįskaitin. pristatymas ir sodinimas. Galioja 30 dienų.'), margin + 5, y + 13);
  y += 24;

  doc.setFillColor(248, 252, 248); doc.setDrawColor(...forestLight); doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, cW, 26, 2.5, 2.5, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...forestDark);
  doc.text(lt('Kiti žingsniai'), margin + 5, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textDark);
  doc.text(lt('1. Rašykite mums patvirtinti užsakymą'), margin + 5, y + 15);
  doc.text(lt('2. Mūsų komanda suplanuos pristatymą ir sodinimą'), margin + 5, y + 21);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('+370 618 54758', P2W - margin - 4, y + 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('info@planthouse.lt', P2W - margin - 4, y + 21, { align: 'right' });

  // ── PAGE 3+: Care guides ─────────────────────────────────────────────
  const careFields: { key: keyof Tree['care']; label: string }[] = [
    { key: 'watering',   label: 'Laistymas' },
    { key: 'sunlight',   label: 'Apsvietimas' },
    { key: 'soil',       label: 'Dirvozemis' },
    { key: 'pruning',    label: 'Gnejimas' },
    { key: 'hardiness',  label: 'Atsparumas salciui' },
    { key: 'spacing',    label: 'Tarpai' },
    { key: 'growthRate', label: 'Augimo greitis' },
    // Notes intentionally excluded — contains internal supplier data
  ];

  const treesPerPage = 2;
  for (let i = 0; i < unique.length; i += treesPerPage) {
    const batch = unique.slice(i, i + treesPerPage);
    doc.addPage('a4', 'landscape');
    header(PW); footer(PW, PH);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textMuted);
    doc.text('PRIEZUROS GIDAS', margin, 28);
    doc.setDrawColor(...forestLight); doc.setLineWidth(0.3);
    doc.line(margin, 30, PW - margin, 30);

    const colW = (PW - margin * 2 - 8) / 2;

    batch.forEach((tree, bi) => {
      const colX = margin + bi * (colW + 8);
      let cy = 36;

      const dot: readonly [number,number,number] =
        tree.category === 'fruit' ? [200, 80, 45] :
        tree.category === 'evergreen' ? [29, 158, 117] :
        tree.category === 'shrub' ? [127, 119, 221] : forestMid;

      doc.setFillColor(...dot);
      doc.roundedRect(colX, cy, colW, 16, 2, 2, 'F');
      doc.setTextColor(...white);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(shortName(tree.name), colX + 5, cy + 7);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5);
      doc.setTextColor(220, 240, 220);
      doc.text(lt(tree.latin), colX + 5, cy + 13);
      cy += 20;

      careFields.forEach(({ key, label }) => {
        const val = lt(tree.care[key] || '');
        if (!val) return;
        const labelH = 5;
        const valLines = doc.splitTextToSize(val, colW - 4);
        const valH = valLines.length * 4.5;
        const boxH = labelH + valH + 3;

        if (cy + boxH > PH - 16) return;

        doc.setFillColor(248, 252, 248); doc.setDrawColor(...forestLight); doc.setLineWidth(0.2);
        doc.roundedRect(colX, cy, colW, boxH, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...forestDark);
        doc.text(label.toUpperCase(), colX + 3, cy + 4.5);

        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...textDark);
        doc.text(valLines, colX + 3, cy + labelH + 3.5);

        cy += boxH + 2;
      });
    });
  }

  doc.save(`plantHouse-garden-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
  return doc.output('datauristring');
}
