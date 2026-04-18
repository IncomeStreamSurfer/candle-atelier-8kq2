const RESEND_URL = 'https://api.resend.com/emails';

export async function sendOrderConfirmation(opts: {
  to: string;
  name?: string | null;
  orderId: string;
  amountPence: number;
  currency: string;
  lineItems: Array<{ name: string; quantity: number; amount_pence: number }>;
}) {
  const apiKey = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing, skipping');
    return;
  }
  const fmt = (p: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: opts.currency.toUpperCase() }).format(p / 100);

  const rows = opts.lineItems
    .map(
      (li) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#e8e4dc;">${li.name}</td>
        <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#736c61;text-align:center;">× ${li.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #1a1a1a;color:#e8e4dc;text-align:right;">${fmt(li.amount_pence)}</td>
      </tr>`,
    )
    .join('');

  const html = `
  <!doctype html>
  <html><body style="margin:0;background:#050505;font-family:Inter,Arial,sans-serif;color:#e8e4dc;">
    <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
      <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:0.02em;color:#c9a96a;">Candle Atelier</div>
      <div style="height:1px;background:#1a1a1a;margin:24px 0;"></div>
      <h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 12px;color:#e8e4dc;">
        Thank you${opts.name ? `, ${opts.name.split(' ')[0]}` : ''}.
      </h1>
      <p style="color:#9a9189;line-height:1.7;">Your candles are being hand-poured and will ship within two working days. A tracking note will follow.</p>
      <table width="100%" style="border-collapse:collapse;margin-top:28px;font-size:15px;">
        ${rows}
        <tr>
          <td style="padding:14px 0;color:#736c61;">Total</td>
          <td></td>
          <td style="padding:14px 0;color:#c9a96a;text-align:right;font-size:18px;">${fmt(opts.amountPence)}</td>
        </tr>
      </table>
      <p style="margin-top:40px;color:#736c61;font-size:13px;">Order ref · ${opts.orderId}</p>
      <p style="margin-top:8px;color:#736c61;font-size:13px;">Candle Atelier · hand-poured in small batches.</p>
    </div>
  </body></html>`;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Candle Atelier <onboarding@resend.dev>',
      to: [opts.to],
      subject: `Your Candle Atelier order · ${opts.orderId.slice(0, 8)}`,
      html,
    }),
  });

  if (!res.ok) {
    console.error('[email] resend failed', res.status, await res.text());
  }
}
