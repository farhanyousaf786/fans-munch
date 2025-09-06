// server/controllers/paymentController.js
// Creates a Payment Intent using Airwallex SDK if available; otherwise returns a mock intent (demo)

let AirwallexCtor = null;
try {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const mod = require('@airwallex/node-sdk');
  // Support either default export or named
  AirwallexCtor = mod?.Airwallex || mod?.default || null;
} catch (e) {
  console.warn('[Payments] @airwallex/node-sdk not installed; using mock intent');
}

// Ensure fetch exists for REST fallback (Node 18+ has global fetch)
let _fetch = globalThis.fetch;
if (typeof _fetch !== 'function') {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    _fetch = require('node-fetch');
    console.log('[Payments] Using node-fetch polyfill');
  } catch (e) {
    console.warn('[Payments] fetch not available and node-fetch not installed');
  }
}

const ENV = process.env.AIRWALLEX_ENV || 'demo';

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount = 100, currency = 'USD' } = req.body || {};

    if (AirwallexCtor && process.env.AIRWALLEX_CLIENT_ID && process.env.AIRWALLEX_API_KEY) {
      const airwallex = new AirwallexCtor({
        clientId: process.env.AIRWALLEX_CLIENT_ID,
        apiKey: process.env.AIRWALLEX_API_KEY,
        env: ENV,
        apiVersion: '2025-02-14',
      });

      // Some SDK versions expose payments() as a function that returns the namespace
      const paymentsNS = typeof airwallex.payments === 'function' ? airwallex.payments() : airwallex.payments;
      if (!paymentsNS || typeof paymentsNS.createPaymentIntent !== 'function') {
        console.warn('[Payments] SDK payments namespace missing; falling back to REST');
      } else {
        const paymentIntent = await paymentsNS.createPaymentIntent({
          request_id: 'req_' + Date.now(),
          amount: Number(amount),
          currency,
          merchant_order_id: 'order_' + Date.now(),
          payment_method_types: ['card'],
        });
  
        return res.json({
          success: true,
          intentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          mode: 'sdk',
        });
      }
    }

    // REST fallback (demo env)
    // Use v1 base to avoid 404s: https://api-demo.airwallex.com/api/v1
    const base = process.env.AIRWALLEX_BASE_URL || 'https://api-demo.airwallex.com/api/v1';
    if (typeof _fetch !== 'function') {
      throw new Error('fetch is not available on this Node version; please upgrade Node to >=18 or install node-fetch');
    }
    const authUrl = `${base}/authentication/login`;
    console.log('[Payments] Auth URL:', authUrl);
    const authResp = await _fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.AIRWALLEX_CLIENT_ID || '',
        'x-api-key': process.env.AIRWALLEX_API_KEY || '',
      },
      body: JSON.stringify({}),
    });
    const authText = await authResp.text();
    let authData; try { authData = JSON.parse(authText); } catch (_) {}
    if (!authResp.ok) {
      console.error('[Payments] REST auth failed:', authText);
      throw new Error('Airwallex auth failed');
    }
    const token = authData?.token || authData?.access_token;
    if (!token) throw new Error('Airwallex auth missing token');

    const intentBody = {
      request_id: 'req_' + Date.now(),
      amount: Number(amount),
      currency,
      merchant_order_id: 'order_' + Date.now(),
      capture_method: 'AUTOMATIC',
      // return_url can be added if needed
    };
    const intentUrl = `${base}/pa/payment_intents/create`;
    console.log('[Payments] Create Intent URL:', intentUrl);
    const intentResp = await _fetch(intentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(intentBody),
    });
    const intentText = await intentResp.text();
    let intentData; try { intentData = JSON.parse(intentText); } catch (_) {}
    if (!intentResp.ok) {
      console.error('[Payments] REST create intent failed:', intentText);
      throw new Error('Airwallex create intent failed');
    }
    if (!intentData?.id || !intentData?.client_secret) {
      throw new Error('Airwallex create intent missing fields');
    }

    return res.json({
      success: true,
      intentId: intentData.id,
      clientSecret: intentData.client_secret,
      mode: 'sdk',
    });
  } catch (err) {
    console.error('[Payments] createPaymentIntent error:', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Payment intent failed' });
  }
};
