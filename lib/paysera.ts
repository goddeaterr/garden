export function buildPayseraUrl(params: {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  description: string;
}): string {
  const PAYSERA_PROJECT_ID = process.env.NEXT_PUBLIC_PAYSERA_PROJECT_ID || 'YOUR_PROJECT_ID';
  const PAYSERA_SIGN_PASSWORD = process.env.NEXT_PUBLIC_PAYSERA_SIGN_PASSWORD || '';

  const amountCents = Math.round(params.amount * 100);
  const baseUrl = 'https://www.paysera.com/pay/';

  const data: Record<string, string> = {
    projectid: PAYSERA_PROJECT_ID,
    orderid: params.orderId,
    lang: 'LIT',
    amount: String(amountCents),
    currency: 'EUR',
    accepturl: `${window.location.origin}/order/success`,
    cancelurl: `${window.location.origin}/order/cancel`,
    callbackurl: `${window.location.origin}/api/paysera/callback`,
    payment: '',
    country: 'LT',
    p_firstname: params.customerName.split(' ')[0] || '',
    p_lastname: params.customerName.split(' ').slice(1).join(' ') || '',
    p_email: params.customerEmail,
    test: process.env.NODE_ENV === 'production' ? '0' : '1',
    version: '1.6',
  };

  const queryString = Object.entries(data)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  return `${baseUrl}?${queryString}`;
}

export function generateOrderId(): string {
  return `PH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
