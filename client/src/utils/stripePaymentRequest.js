// Utility to create a Stripe Payment Request (Apple Pay / Google Pay)
// Works on:
// - Safari (macOS/iOS): Apple Pay
// - Chrome (desktop/Android): Google Pay
// - Chrome iOS: Apple Pay when available via Payment Request
//
// Requirements for live wallets:
// - HTTPS production domain
// - Live Stripe keys (pk_live / sk_live)
// - Apple Pay domain verified in Stripe Dashboard for the live domain
// - Stripe account country must match `country` below (Fan Munch uses IL)

export async function buildPaymentRequest(stripe, {
  amount,
  currency = 'ils',
  // Must match Stripe account country (IL) for wallets to work
  country = 'IL',
  label = 'Fan Munch Order',
  requestPayerName = true,
  requestPayerEmail = true,
  // Phone can break wallet availability on some Android Chrome builds
  requestPayerPhone = false,
} = {}) {
  try {
    if (!stripe || !amount || amount <= 0) {
      console.log('[DEBUG] buildPaymentRequest validation failed - stripe:', !!stripe, 'amount:', amount);
      return null;
    }

    const normalizedCurrency = (currency || 'ils').toLowerCase();
    const minorAmount = Math.round(Number(amount) * 100) || 0;
    if (minorAmount < 1) {
      console.log('[DEBUG] buildPaymentRequest amount too small:', minorAmount);
      return null;
    }

    console.log('[DEBUG] paymentRequest config:', {
      country,
      currency: normalizedCurrency,
      amount: minorAmount,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a',
    });

    const paymentRequest = stripe.paymentRequest({
      country,
      currency: normalizedCurrency,
      // Stripe PaymentRequest expects amount in the smallest currency unit
      total: { label, amount: minorAmount },
      requestPayerName,
      requestPayerEmail,
      requestPayerPhone,
      // Explicitly allow both wallets when the browser supports them
      disableWallets: [],
    });

    const result = await paymentRequest.canMakePayment();
    console.log('[DEBUG] canMakePayment result:', result);
    if (!result) {
      console.log('[DEBUG] Payment Request not available - no Apple Pay/Google Pay support in this browser/device');
      return null;
    }

    // Prefer logging which wallet is available for debugging Safari vs Chrome/Android
    console.log('[DEBUG] Wallets available:', {
      applePay: !!result.applePay,
      googlePay: !!result.googlePay,
      link: !!result.link,
    });

    return paymentRequest;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[stripePaymentRequest] Failed to build payment request:', e?.message || e);
    return null;
  }
}
