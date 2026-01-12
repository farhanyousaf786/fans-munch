/**
 * Currency Initialization Service
 * Runs on app startup to fetch and cache currency rates
 * Only fetches if cache is missing or expired (> 12 hours)
 */

const CACHE_KEY = 'currency_rates_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Initialize currency rates on app startup
 * Fetches from server only if cache is missing or expired
 */
export async function initializeCurrencyRates() {
  try {
    console.log('💱 [CURRENCY INIT] Starting currency rates initialization...');
    
    // Check if cache exists and is valid
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      const now = Date.now();
      const age = now - timestamp;
      const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
      
      if (age < CACHE_DURATION) {
        console.log(`✅ [CURRENCY INIT] Using cached rates (${ageHours} hours old)`);
        console.log('📊 [CURRENCY INIT] Cached rates:', rates);
        console.log('⏰ [CURRENCY INIT] Cache expires in:', ((CACHE_DURATION - age) / (1000 * 60 * 60)).toFixed(1), 'hours');
        return rates;
      } else {
        console.log(`⏰ [CURRENCY INIT] Cache expired (${ageHours} hours old), fetching fresh rates...`);
      }
    } else {
      console.log('🆕 [CURRENCY INIT] No cached rates found, fetching from server...');
    }

    // Fetch fresh rates from server
    console.log('🔄 [CURRENCY INIT] Fetching from /api/currency/rates');
    
    let data;
    try {
      const response = await fetch('/api/currency/rates', { timeout: 5000 });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      data = await response.json();
    } catch (serverError) {
      console.warn('⚠️ [CURRENCY INIT] Server unavailable, fetching directly from API:', serverError.message);
      
      // Fallback: Fetch directly from ExchangeRate API
      try {
        const directResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const directData = await directResponse.json();
        
        if (directData && directData.rates) {
          // Extract only the currencies we need
          const currencies = ['ILS', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'AED'];
          const rates = {};
          currencies.forEach(currency => {
            if (directData.rates[currency]) {
              rates[currency] = directData.rates[currency];
            }
          });
          
          data = { success: true, rates };
          console.log('✅ [CURRENCY INIT] Fetched directly from ExchangeRate API');
        }
      } catch (fallbackError) {
        console.error('❌ [CURRENCY INIT] Fallback also failed:', fallbackError.message);
        throw new Error('Both server and direct API failed');
      }
    }

    if (data && data.success && data.rates) {
      // Store in localStorage
      const cacheData = {
        rates: data.rates,
        timestamp: Date.now()
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      console.log('✅ [CURRENCY INIT] Fresh rates fetched and cached');
      console.log('📊 [CURRENCY INIT] Rates:', data.rates);
      console.log('💾 [CURRENCY INIT] Stored in localStorage');
      console.log('⏰ [CURRENCY INIT] Next refresh in 12 hours');
      
      return data.rates;
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('❌ [CURRENCY INIT] Error initializing currency rates:', error.message);
    
    // Try to use stale cache as fallback
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates } = JSON.parse(cached);
      console.log('⚠️ [CURRENCY INIT] Using stale cached rates as fallback');
      console.log('📊 [CURRENCY INIT] Fallback rates:', rates);
      return rates;
    }
    
    return null;
  }
}

/**
 * Get current cached rates without fetching
 */
export function getCachedRates() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
      
      console.log(`📊 [CURRENCY] Current cached rates (${ageHours} hours old):`, rates);
      return rates;
    }
    console.log('⚠️ [CURRENCY] No cached rates available');
    return null;
  } catch (error) {
    console.error('❌ [CURRENCY] Error getting cached rates:', error.message);
    return null;
  }
}

/**
 * Get cache status
 */
export function getCacheStatus() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return {
        exists: false,
        message: 'No cache found'
      };
    }

    const { timestamp } = JSON.parse(cached);
    const now = Date.now();
    const age = now - timestamp;
    const ageHours = (age / (1000 * 60 * 60)).toFixed(1);
    const expiresIn = ((CACHE_DURATION - age) / (1000 * 60 * 60)).toFixed(1);
    const isExpired = age > CACHE_DURATION;

    return {
      exists: true,
      ageHours: parseFloat(ageHours),
      expiresInHours: parseFloat(expiresIn),
      isExpired: isExpired,
      message: isExpired 
        ? `Cache expired (${ageHours} hours old)` 
        : `Cache valid (${ageHours} hours old, expires in ${expiresIn} hours)`
    };
  } catch (error) {
    console.error('❌ [CURRENCY] Error getting cache status:', error.message);
    return null;
  }
}
