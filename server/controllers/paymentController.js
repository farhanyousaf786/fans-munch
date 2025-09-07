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

// Environment configuration - use AIRWALLEX_ENV to control everything
const MODE = process.env.AIRWALLEX_ENV || 'demo'; // 'demo', 'production', or 'mock'

const ENV = MODE === 'production' ? 'production' : 'demo';
const USE_MOCK = MODE === 'mock';

// Auto-configure credentials and URLs based on mode
const getConfig = () => {
  if (USE_MOCK) {
    return { env: 'demo', baseUrl: null, clientId: null, apiKey: null };
  }
  
  if (MODE === 'production') {
    return {
      env: 'production',
      baseUrl: process.env.AIRWALLEX_BASE_URL || 'https://api.airwallex.com/api/v1',
      clientId: process.env.AIRWALLEX_CLIENT_ID,
      apiKey: process.env.AIRWALLEX_API_KEY
    };
  }
  
  // Demo mode
  return {
    env: 'demo',
    baseUrl: process.env.AIRWALLEX_BASE_URL || 'https://api-demo.airwallex.com/api/v1',
    clientId: process.env.AIRWALLEX_CLIENT_ID_DEMO || process.env.AIRWALLEX_CLIENT_ID,
    apiKey: process.env.AIRWALLEX_API_KEY_DEMO || process.env.AIRWALLEX_API_KEY
  };
};

const config = getConfig();

// Debug logging to see what's actually loaded
console.log('[DEBUG] Environment variables loaded:', {
  AIRWALLEX_ENV: process.env.AIRWALLEX_ENV,
  AIRWALLEX_CLIENT_ID: process.env.AIRWALLEX_CLIENT_ID?.slice(0, 6) + '...',
  AIRWALLEX_API_KEY: process.env.AIRWALLEX_API_KEY?.slice(0, 6) + '...',
  AIRWALLEX_BASE_URL: process.env.AIRWALLEX_BASE_URL,
  computed_MODE: MODE,
  computed_config: {
    env: config.env,
    baseUrl: config.baseUrl,
    hasClientId: !!config.clientId,
    hasApiKey: !!config.apiKey
  }
});

exports.createPaymentIntent = async (req, res) => {
  try {
    console.log('[Payments] MODE:', MODE, '| ENV:', config.env, '| MOCK:', USE_MOCK ? 'on' : 'off');

    // Explicit mock mode: short-circuit for local testing
    if (USE_MOCK) {
      return res.json({
        success: true,
        intentId: 'mock_' + Date.now(),
        clientSecret: 'mock_secret_' + Math.random().toString(36).slice(2),
        mode: 'mock',
      });
    }
    // Use the actual cart total from the request for real charges
    const currency = (req.body && req.body.currency) || 'USD';
    const amount = (req.body && req.body.amount) || 11.0; // Default to $11 if not provided

    if (AirwallexCtor && config.clientId && config.apiKey) {
      const airwallex = new AirwallexCtor({
        clientId: config.clientId,
        apiKey: config.apiKey,
        env: config.env,
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

    // REST fallback
    const base = config.baseUrl;
    if (typeof _fetch !== 'function') {
      throw new Error('fetch is not available on this Node version; please upgrade Node to >=18 or install node-fetch');
    }
    const authUrl = `${base}/authentication/login`;
    console.log('[Payments] Auth URL:', authUrl);
    const authResp = await _fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': config.clientId || '',
        'x-api-key': config.apiKey || '',
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
    console.error('[Payments] Full error details:', err);
    // When not in explicit mock mode, surface the error so the client can fix credentials
    return res.status(500).json({ success: false, error: err?.message || 'Payment intent failed' });
  }
};
