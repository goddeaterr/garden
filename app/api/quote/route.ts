import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getIP } from '@/lib/rateLimit';

interface QuoteItem {
  treeName: string; treeHeight: string;
  treePrice: number; treeCategory: string; quantity: number;
}
interface QuotePayload {
  name: string; email: string; phone?: string; notes?: string;
  items: QuoteItem[];
  _hp?: string;   // honeypot — must be empty
  _t?: number;    // form-open timestamp — must be > 1800 ms ago
}

const CAT_COLOR: Record<string, string> = {
  trees:    '#166534',
  shrubs:   '#6d3bb5',
  perennial:'#be185d',
  annual:   '#c2410c',
  conifer:  '#0f766e',
  climbing: '#4d7c0f',
  hedge:    '#15803d',
  potted:   '#b45309',
  grass:    '#a16207',
};

// ─── PDF Generator ────────────────────────────────────────────────────────────
async function generatePDF(data: QuotePayload): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 595, M = 50, CW = W - M * 2;
    const darkGreen = '#0c1a0e', accent = '#2d6e35';
    const textDark = '#1a2e1c', textMid = '#4a6a4c', textLight = '#7a9e7c';
    const refNum = `#${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000) + 1000}`;
    const dateStr = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const subtotal = data.items.reduce((s, i) => s + i.treePrice * i.quantity, 0);

    // ── Header band ──
    doc.rect(0, 0, W, 105).fill(darkGreen);
    doc.font('Helvetica').fontSize(9).fillColor('#4a9e56')
       .text('MB PLANT HOUSE', M, 26, { characterSpacing: 3 });
    doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff')
       .text('Quote Request', M, 40);
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.4)')
       .text(refNum, M, 74);
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.4)')
       .text(dateStr, W - M - 180, 74, { width: 180, align: 'right' });

    let y = 122;

    // ── Customer info ──
    doc.font('Helvetica-Bold').fontSize(8).fillColor(textLight)
       .text('FROM', M, y, { characterSpacing: 2 });
    y += 14;
    doc.font('Helvetica-Bold').fontSize(15).fillColor(textDark).text(data.name, M, y);
    y += 20;
    doc.font('Helvetica').fontSize(11).fillColor(accent).text(data.email, M, y);
    y += 16;
    if (data.phone) {
      doc.font('Helvetica').fontSize(11).fillColor(textMid).text(data.phone, M, y);
      y += 16;
    }

    // ── Divider ──
    y += 6;
    doc.moveTo(M, y).lineTo(W - M, y).strokeColor('#d4e8d4').lineWidth(0.75).stroke();
    y += 18;

    // ── Items table ──
    doc.font('Helvetica-Bold').fontSize(8).fillColor(textLight)
       .text('TREES REQUESTED', M, y, { characterSpacing: 2 });
    y += 14;

    // Table header
    const cols = [0, CW * 0.38, CW * 0.60, CW * 0.73, CW * 0.86];
    const hdrs = ['Tree', 'Category', 'Unit Price', 'Qty', 'Subtotal'];
    doc.rect(M, y, CW, 26).fill(darkGreen);
    hdrs.forEach((h, i) => {
      const x = M + cols[i] + 8;
      const w = (cols[i + 1] ?? CW) - cols[i] - 16;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
         .text(h, x, y + 8, { width: w, align: i > 1 ? 'right' : 'left' });
    });
    y += 26;

    // Item rows
    data.items.forEach((item, idx) => {
      doc.rect(M, y, CW, 30).fill(idx % 2 === 0 ? '#ffffff' : '#f4faf4');
      const cat = item.treeCategory.charAt(0).toUpperCase() + item.treeCategory.slice(1);
      const vals = [item.treeName, cat, `€${item.treePrice}`, `×${item.quantity}`, `€${item.treePrice * item.quantity}`];
      vals.forEach((v, i) => {
        const x = M + cols[i] + 8;
        const w = (cols[i + 1] ?? CW) - cols[i] - 16;
        doc.font(i === 4 ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
           .fillColor(i === 4 ? textDark : textMid)
           .text(v, x, y + 10, { width: w, align: i > 1 ? 'right' : 'left' });
      });
      y += 30;
    });

    // Total row
    doc.rect(M, y, CW, 36).fill(darkGreen);
    doc.font('Helvetica').fontSize(10).fillColor('rgba(255,255,255,0.6)')
       .text('ESTIMATED TOTAL', M + 10, y + 12);
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#ffffff')
       .text(`€${subtotal}`, M, y + 10, { width: CW - 10, align: 'right' });
    y += 36;

    // Notes
    if (data.notes) {
      y += 18;
      doc.font('Helvetica-Bold').fontSize(8).fillColor(textLight)
         .text('NOTES', M, y, { characterSpacing: 2 });
      y += 12;
      doc.rect(M, y, CW, 44).fill('#f0faf0');
      doc.font('Helvetica').fontSize(11).fillColor(textDark)
         .text(data.notes, M + 10, y + 12, { width: CW - 20 });
      y += 52;
    }

    // Footer (absolute position)
    const fY = 790;
    doc.moveTo(M, fY).lineTo(W - M, fY).strokeColor('#d4e8d4').lineWidth(0.75).stroke();
    doc.font('Helvetica').fontSize(9).fillColor(textLight)
       .text('MB Plant House · Užuovėjos g. 6, Piktožių k., LT-96164 Klaipėdos r., Lithuania', M, fY + 10, { align: 'center', width: CW });
    doc.font('Helvetica').fontSize(9).fillColor(textLight)
       .text('+370 618 54758 · info@planthouse.lt · planthouse.lt', M, fY + 23, { align: 'center', width: CW });
    doc.font('Helvetica').fontSize(8).fillColor('#a0baa2')
       .text('Informal quote request — final pricing may vary by availability and delivery location.', M, fY + 38, { align: 'center', width: CW });

    doc.end();
  });
}

// ─── Seller HTML ──────────────────────────────────────────────────────────────
function sellerHtml(data: QuotePayload): string {
  const subtotal = data.items.reduce((s, i) => s + i.treePrice * i.quantity, 0);
  const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = data.items.map((item, i) => {
    const cat = item.treeCategory.charAt(0).toUpperCase() + item.treeCategory.slice(1);
    const c = CAT_COLOR[item.treeCategory] || '#4a7c3f';
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f4faf4'};">
      <td style="padding:12px 16px;border-bottom:1px solid #e8f0e8;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:8px;vertical-align:middle;"></span>
        <strong style="color:#1a2e1c;font-size:14px;">${item.treeName}</strong>
        ${item.treeHeight ? `<span style="color:#8aa88c;font-size:12px;margin-left:6px;">${item.treeHeight}</span>` : ''}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8f0e8;color:#6a8a6c;font-size:13px;">${cat}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8f0e8;color:#1a2e1c;font-size:13px;text-align:right;">€${item.treePrice}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8f0e8;color:#1a2e1c;font-size:13px;text-align:right;">×${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e8f0e8;color:#1a2e1c;font-size:14px;font-weight:700;text-align:right;">€${item.treePrice * item.quantity}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quote Request</title></head>
<body style="margin:0;padding:0;background:#edf4ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf4ee;padding:40px 20px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;">

  <tr><td style="padding:0 0 24px;text-align:center;">
    <span style="display:inline-block;background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.9);border-radius:50px;padding:8px 18px 8px 14px;color:#1a3a1c;font-size:13px;font-weight:600;">🌿 MB Plant House</span>
  </td></tr>

  <tr><td style="background:#0c1a0e;border-radius:20px 20px 0 0;padding:36px 44px 32px;text-align:center;">
    <p style="margin:0 0 10px;display:inline-block;background:rgba(90,158,98,0.2);color:#6dbc77;font-size:10px;letter-spacing:3px;text-transform:uppercase;font-weight:700;padding:5px 14px;border-radius:50px;border:1px solid rgba(90,158,98,0.3);">New Enquiry</p>
    <h1 style="margin:10px 0 0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.04em;">${data.items.length === 1 ? `${data.items[0].treeName}` : `${data.items.length} Trees Requested`}</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.35);font-size:13px;">${date} · ${data.name}</p>
  </td></tr>

  <tr><td style="background:#fff;padding:28px 44px 0;">
    <p style="margin:0 0 20px;color:#7a9e7c;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Customer</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:10px 0;border-bottom:1px solid #eaf3ea;">
        <p style="margin:0 0 2px;color:#a0baa2;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Name</p>
        <p style="margin:0;color:#1a2e1c;font-size:15px;font-weight:600;">${data.name}</p>
      </td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #eaf3ea;">
        <p style="margin:0 0 2px;color:#a0baa2;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Email</p>
        <a href="mailto:${data.email}" style="color:#2d6e35;font-size:15px;font-weight:600;text-decoration:none;">${data.email}</a>
      </td></tr>
      ${data.phone ? `<tr><td style="padding:10px 0;">
        <p style="margin:0 0 2px;color:#a0baa2;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Phone</p>
        <a href="tel:${data.phone}" style="color:#1a2e1c;font-size:15px;font-weight:600;text-decoration:none;">${data.phone}</a>
      </td></tr>` : ''}
    </table>
  </td></tr>

  <tr><td style="background:#fff;padding:24px 44px 0;">
    <p style="margin:0 0 14px;color:#7a9e7c;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Trees Requested</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e8f0e8;">
      <thead><tr style="background:#0c1a0e;">
        <th style="padding:10px 16px;text-align:left;color:#fff;font-size:11px;font-weight:700;">Tree</th>
        <th style="padding:10px 16px;text-align:left;color:#fff;font-size:11px;font-weight:700;">Category</th>
        <th style="padding:10px 16px;text-align:right;color:#fff;font-size:11px;font-weight:700;">Price</th>
        <th style="padding:10px 16px;text-align:right;color:#fff;font-size:11px;font-weight:700;">Qty</th>
        <th style="padding:10px 16px;text-align:right;color:#fff;font-size:11px;font-weight:700;">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#0c1a0e;">
        <td colspan="4" style="padding:12px 16px;color:rgba(255,255,255,0.6);font-size:11px;">ESTIMATED TOTAL</td>
        <td style="padding:12px 16px;color:#fff;font-size:18px;font-weight:800;text-align:right;">€${subtotal}</td>
      </tr></tfoot>
    </table>
  </td></tr>

  ${data.notes ? `<tr><td style="background:#fff;padding:20px 44px 0;">
    <div style="background:#f2faf2;border-left:3px solid #2d6e35;border-radius:0 10px 10px 0;padding:14px 18px;">
      <p style="margin:0 0 5px;color:#7a9e7c;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Notes</p>
      <p style="margin:0;color:#2a4a2c;font-size:14px;line-height:1.7;">${data.notes}</p>
    </div>
  </td></tr>` : ''}

  <tr><td style="background:#fff;padding:24px 44px 32px;text-align:center;border-radius:0 0 20px 20px;">
    <div style="border-top:1px solid #eaf3ea;padding-top:24px;">
      <a href="mailto:${data.email}?subject=${encodeURIComponent(`Re: Your Quote Request — ${data.name}`)}"
         style="display:inline-block;background:#0c1a0e;color:#fff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:50px;text-decoration:none;">
        Reply to ${data.name} →
      </a>
    </div>
  </td></tr>

  <tr><td style="padding:24px 20px 0;text-align:center;">
    <p style="margin:0 0 4px;color:#8aa88c;font-size:12px;">MB Plant House · Užuovėjos g. 6, Piktožių k., LT-96164 Klaipėdos r.</p>
    <p style="margin:0;color:#8aa88c;font-size:12px;">
      <a href="tel:+37061854758" style="color:#8aa88c;text-decoration:none;">+370 618 54758</a> ·
      <a href="mailto:info@planthouse.lt" style="color:#8aa88c;text-decoration:none;">info@planthouse.lt</a>
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

// ─── Customer confirmation HTML ───────────────────────────────────────────────
function customerHtml(data: QuotePayload): string {
  const subtotal = data.items.reduce((s, i) => s + i.treePrice * i.quantity, 0);
  const rows = data.items.map((item, i) => {
    const c = CAT_COLOR[item.treeCategory] || '#4a7c3f';
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f4faf4'};">
      <td style="padding:11px 16px;border-bottom:1px solid #e8f0e8;">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};margin-right:7px;vertical-align:middle;"></span>
        <span style="color:#1a2e1c;font-size:14px;font-weight:600;">${item.treeName}</span>
      </td>
      <td style="padding:11px 16px;border-bottom:1px solid #e8f0e8;text-align:right;color:#6a8a6c;font-size:13px;">×${item.quantity}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #e8f0e8;text-align:right;color:#1a2e1c;font-size:14px;font-weight:700;">€${item.treePrice * item.quantity}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Quote Request</title></head>
<body style="margin:0;padding:0;background:#edf4ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#edf4ee;padding:40px 20px;"><tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;">

  <tr><td style="padding:0 0 24px;text-align:center;">
    <span style="display:inline-block;background:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.9);border-radius:50px;padding:8px 18px 8px 14px;color:#1a3a1c;font-size:13px;font-weight:600;">🌿 MB Plant House</span>
  </td></tr>

  <tr><td style="background:linear-gradient(135deg,#1a3a1e,#0c1a0e);border-radius:20px 20px 0 0;padding:40px 40px 36px;text-align:center;">
    <div style="width:64px;height:64px;border-radius:50%;background:rgba(45,110,53,0.3);border:2px solid rgba(45,110,53,0.5);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
    <h1 style="margin:0 0 8px;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.03em;">Request Received!</h1>
    <p style="margin:0;color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;">Hi ${data.name}, thank you for your quote request.<br>We'll get back to you within <strong style="color:rgba(255,255,255,0.8);">24 hours</strong>.</p>
  </td></tr>

  <tr><td style="background:#fff;padding:28px 40px 0;">
    <p style="margin:0 0 14px;color:#7a9e7c;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;font-weight:700;">Your Request Summary</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #e8f0e8;">
      <thead><tr style="background:#0c1a0e;">
        <th style="padding:10px 16px;text-align:left;color:#fff;font-size:11px;">Tree</th>
        <th style="padding:10px 16px;text-align:right;color:#fff;font-size:11px;">Qty</th>
        <th style="padding:10px 16px;text-align:right;color:#fff;font-size:11px;">Est. Price</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr style="background:#f0faf0;">
        <td colspan="2" style="padding:12px 16px;color:#4a6a4c;font-size:12px;font-weight:600;">Estimated Total</td>
        <td style="padding:12px 16px;color:#1a2e1c;font-size:16px;font-weight:800;text-align:right;">€${subtotal}</td>
      </tfoot>
    </table>
    <p style="margin:14px 0 0;color:#7a9e7c;font-size:11px;font-style:italic;">* Prices are estimates. Final quote confirmed by our team.</p>
  </td></tr>

  <tr><td style="background:#fff;padding:20px 40px 32px;text-align:center;border-radius:0 0 20px 20px;">
    <div style="border-top:1px solid #eaf3ea;padding-top:20px;">
      <p style="margin:0 0 16px;color:#4a6a4c;font-size:13px;line-height:1.6;">Questions? We're happy to help.</p>
      <a href="mailto:info@planthouse.lt" style="display:inline-block;background:#0c1a0e;color:#fff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;margin-right:8px;">Email us</a>
      <a href="tel:+37061854758" style="display:inline-block;background:#f0faf0;color:#1a2e1c;font-size:13px;font-weight:700;padding:12px 28px;border-radius:50px;text-decoration:none;border:1px solid #d4e8d4;">Call us</a>
    </div>
  </td></tr>

  <tr><td style="padding:24px 20px 0;text-align:center;">
    <p style="margin:0 0 4px;color:#8aa88c;font-size:12px;">MB Plant House · Užuovėjos g. 6, Piktožių k., LT-96164 Klaipėdos r., Lithuania</p>
    <p style="margin:0;color:#8aa88c;font-size:12px;">+370 618 54758 · info@planthouse.lt</p>
    <p style="margin:10px 0 0;color:#b0c8b2;font-size:11px;">You received this because you submitted a quote request on planthouse.lt</p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Rate limit: 4 quote requests per IP per hour ──
  const ip = getIP(req);
  const { ok, retryAfter } = rateLimit('quote', ip, 4, 60 * 60_000);
  if (!ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // ── Reject oversized payloads (> 64 KB) ──
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > 65_536) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  try {
    const data: QuotePayload = await req.json();
    const { name, email, items, _hp, _t } = data;

    // ── Honeypot — bots fill hidden fields, humans don't ──
    if (_hp) {
      // Silently accept but do nothing (don't reveal the check to bots)
      return NextResponse.json({ ok: true });
    }

    // ── Time gate — reject if form was submitted faster than 1.8 s ──
    if (_t && Date.now() - _t < 1800) {
      return NextResponse.json({ error: 'Submission too fast' }, { status: 400 });
    }

    if (!name?.trim() || !email?.trim() || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── Basic email format check ──
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // ── Cap items to prevent payload abuse ──
    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many items' }, { status: 400 });
    }

    // ── Sanitise strings ──
    data.name  = String(name).slice(0, 120).replace(/[<>]/g, '');
    data.notes = data.notes ? String(data.notes).slice(0, 1000).replace(/<script/gi, '') : undefined;
    data.phone = data.phone ? String(data.phone).slice(0, 30).replace(/[^+\d\s\-()]/g, '') : undefined;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.log('[quote] No RESEND_API_KEY — skipping email send');
      return NextResponse.json({ ok: true, fallback: true });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const from      = process.env.RESEND_FROM || 'MB Plant House <onboarding@resend.dev>';
    const toSeller  = process.env.CONTACT_EMAIL || 'info@planthouse.lt';
    const ownerEmail = process.env.OWNER_EMAIL?.trim() || null;
    const subtotal  = items.reduce((s, i) => s + i.treePrice * i.quantity, 0);
    const treeList  = items.length === 1 ? items[0].treeName : `${items.length} trees`;
    const pdfSubject = `Quote_${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // Generate PDF once, reuse for all recipients
    const pdfBuffer = await generatePDF(data);
    const pdfBase64 = pdfBuffer.toString('base64');

    const attachment = { filename: pdfSubject, content: pdfBase64 };
    const quoteSubject = `🌿 Quote: ${treeList} ×${items.reduce((s, i) => s + i.quantity, 0)} — ${name} (€${subtotal})`;

    // Send to main contact
    await resend.emails.send({
      from,
      to: toSeller,
      replyTo: email,
      subject: quoteSubject,
      html: sellerHtml(data),
      attachments: [attachment],
    });

    // Send copy to owner if OWNER_EMAIL is configured
    if (ownerEmail && ownerEmail !== toSeller) {
      await resend.emails.send({
        from,
        to: ownerEmail,
        replyTo: email,
        subject: quoteSubject,
        html: sellerHtml(data),
        attachments: [attachment],
      });
    }

    // Send confirmation to customer
    await resend.emails.send({
      from,
      to: email,
      subject: `✅ Quote Request Received — MB Plant House`,
      html: customerHtml(data),
      attachments: [attachment],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[quote]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
