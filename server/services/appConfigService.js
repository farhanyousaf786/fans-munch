const admin = require('firebase-admin');

const CACHE_TTL_MS = 10000;
let cachedConfig = null;
let cacheTimestamp = 0;

const isTestSecretKey = (key) => typeof key === 'string' && key.startsWith('sk_test_');
const isLiveSecretKey = (key) => typeof key === 'string' && key.startsWith('sk_live_');
const isTestPublishableKey = (key) => typeof key === 'string' && key.startsWith('pk_test_');
const isLivePublishableKey = (key) => typeof key === 'string' && key.startsWith('pk_live_');

const pickFirstMatching = (candidates, predicate) =>
  candidates.find((value) => value && predicate(value)) || null;

const ensureFirebase = () => {
  if (admin.apps.length) return;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
};

async function getAppConfig() {
  const now = Date.now();
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    ensureFirebase();
    const doc = await admin.firestore().doc('appConfig/global').get();
    const data = doc.exists ? doc.data() : {};
    cachedConfig = { useTestApis: !!data.useTestApis };
  } catch (error) {
    console.warn('[AppConfig] Failed to read Firestore config, defaulting to live:', error.message);
    cachedConfig = { useTestApis: false };
  }

  cacheTimestamp = now;
  return cachedConfig;
}

function getStripeKeys(useTestApis) {
  if (useTestApis) {
    return {
      secretKey: pickFirstMatching(
        [
          process.env.STRIPE_SECRET_KEY_TEST,
          process.env.Test,
          process.env.STRIPE_SECRET_KEY,
        ],
        isTestSecretKey
      ),
      publishableKey: pickFirstMatching(
        [
          process.env.STRIPE_PUBLISHABLE_KEY_TEST,
          process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY_TEST,
          process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
        ],
        isTestPublishableKey
      ),
      webhookSecret:
        process.env.STRIPE_WEBHOOK_SECRET_TEST ||
        process.env.STRIPE_WEBHOOK_SECRET,
    };
  }

  return {
    secretKey: pickFirstMatching(
      [
        process.env.STRIPE_SECRET_KEY_LIVE,
        process.env.STRIPE_SECRET_KEY,
        process.env.Live,
      ],
      isLiveSecretKey
    ),
    publishableKey: pickFirstMatching(
      [
        process.env.STRIPE_PUBLISHABLE_KEY_LIVE,
        process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
      ],
      isLivePublishableKey
    ),
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  };
}

function clearCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}

module.exports = {
  getAppConfig,
  getStripeKeys,
  clearCache,
};
