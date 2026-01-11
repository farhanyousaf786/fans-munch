const axios = require('axios');
const admin = require('firebase-admin');

// Initialize Firebase Admin (assumes it's already initialized in index.js or elsewhere)
const db = admin.firestore();

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const CURRENCIES = [
  'ILS', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR',
  'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'AED'
];
const CACHE_COLLECTION = 'currency_rates';
const UPDATE_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/**
 * Fetch current exchange rates from ExchangeRate-API
 */
async function fetchExchangeRates() {
  try {
    console.log('💱 [CURRENCY] Fetching exchange rates from API...');
    const response = await axios.get(EXCHANGE_RATE_API, {
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || !response.data.rates) {
      throw new Error('Invalid API response');
    }

    const rates = {};
    CURRENCIES.forEach(currency => {
      if (response.data.rates[currency]) {
        rates[currency] = response.data.rates[currency];
      }
    });

    console.log('✅ [CURRENCY] Exchange rates fetched:', rates);
    return rates;
  } catch (error) {
    console.error('❌ [CURRENCY] Error fetching exchange rates:', error.message);
    return null;
  }
}

/**
 * Store rates in Firestore
 */
async function storeRates(rates) {
  try {
    const timestamp = new Date();
    const docRef = db.collection(CACHE_COLLECTION).doc('latest');

    await docRef.set({
      rates: rates,
      timestamp: timestamp,
      expiresAt: new Date(timestamp.getTime() + UPDATE_INTERVAL),
      currencies: CURRENCIES
    });

    console.log('💾 [CURRENCY] Rates stored in Firestore');
    return true;
  } catch (error) {
    console.error('❌ [CURRENCY] Error storing rates:', error.message);
    return false;
  }
}

/**
 * Get cached rates from Firestore
 */
async function getCachedRates() {
  try {
    const docRef = db.collection(CACHE_COLLECTION).doc('latest');
    const doc = await docRef.get();

    if (!doc.exists) {
      console.log('⚠️ [CURRENCY] No cached rates found');
      return null;
    }

    const data = doc.data();
    const now = new Date();

    // Check if cache is expired
    if (data.expiresAt && data.expiresAt.toDate() < now) {
      console.log('⏰ [CURRENCY] Cache expired, will fetch new rates');
      return null;
    }

    console.log('✅ [CURRENCY] Using cached rates from', data.timestamp.toDate());
    return data.rates;
  } catch (error) {
    console.error('❌ [CURRENCY] Error retrieving cached rates:', error.message);
    return null;
  }
}

/**
 * Update rates (fetch from API and store) - only if cache is expired
 */
async function updateRates() {
  console.log('🔄 [CURRENCY] Checking if rates need updating...');
  
  // Check if we have recent cached rates
  const cachedRates = await getCachedRates();
  if (cachedRates) {
    console.log('✅ [CURRENCY] Rates are still fresh, skipping update');
    return true;
  }

  console.log('⏰ [CURRENCY] Cache expired or missing, fetching new rates...');
  const rates = await fetchExchangeRates();
  if (rates) {
    await storeRates(rates);
    console.log('✅ [CURRENCY] Update completed successfully');
    return true;
  } else {
    console.log('⚠️ [CURRENCY] Update failed, will retry next cycle');
    return false;
  }
}

/**
 * Initialize the currency update scheduler
 */
function initializeCurrencyScheduler() {
  try {
    const cron = require('node-cron');

    // Run immediately on startup
    console.log('🚀 [CURRENCY] Initializing currency scheduler...');
    updateRates();

    // Schedule to run every 8 hours (0 */8 * * *)
    cron.schedule('0 */8 * * *', () => {
      console.log('⏰ [CURRENCY] Running scheduled currency update (every 8 hours)');
      updateRates();
    });

    console.log('✅ [CURRENCY] Scheduler initialized - will update every 8 hours');
    return true;
  } catch (error) {
    console.error('❌ [CURRENCY] Error initializing scheduler:', error.message);
    return false;
  }
}

module.exports = {
  fetchExchangeRates,
  storeRates,
  getCachedRates,
  updateRates,
  initializeCurrencyScheduler
};
