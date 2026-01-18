// Utility to create a Stripe Payment Request (Apple Pay / Google Pay)
// Usage:
//   import { buildPaymentRequest } from '../utils/stripePaymentRequest';
//   const pr = await buildPaymentRequest(stripe, { amount: 500, currency: 'ils', country: 'IL', label: 'Fan Munch Order' });
//   if (pr) { /* render PaymentRequestButtonElement with { options: { paymentRequest: pr } } */ }

export async function buildPaymentRequest(stripe, {
  amount,
  currency = 'ils',
  country = 'US',
  label = 'Order',
  requestPayerName = true,
  requestPayerEmail = true,
  requestPayerPhone = true,
} = {}) {
  try {
    console.log('[DEBUG] buildPaymentRequest called with:', { amount, currency, country, label });
    if (!stripe || !amount || amount <= 0) {
      console.log('[DEBUG] buildPaymentRequest failed - stripe:', !!stripe, 'amount:', amount);
      return null;
    }

    const normalizedCurrency = (currency || 'ils').toLowerCase();
    const finalCountry = (normalizedCurrency === 'ils' && country === 'US') ? 'IL' : country;

    const paymentRequest = stripe.paymentRequest({
      country: finalCountry,
      currency: normalizedCurrency,
      // IMPORTANT: Stripe PaymentRequest expects amount in the smallest currency unit (e.g., cents/agorot)
      // Our UI passes amount in major units (e.g., 41.00 ILS), so convert to minor units here.
      total: { label, amount: Math.round(Number(amount) * 100) || 0 },
      requestPayerName,
      requestPayerEmail,
      requestPayerPhone,
    });

    const result = await paymentRequest.canMakePayment();
    console.log('[DEBUG] canMakePayment result:', result);
    if (!result) {
      console.log('[DEBUG] Payment Request not available - no Apple Pay/Google Pay support');
      return null;
    }

    console.log('[DEBUG] Payment Request created successfully');
    return paymentRequest;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[stripePaymentRequest] Failed to build payment request:', e?.message || e);
    return null;
  }
}
