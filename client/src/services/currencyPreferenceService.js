/**
 * Currency Preference Service
 * Manages user's preferred currency selection
 */

const CURRENCY_PREFERENCE_KEY = 'user_currency_preference';
const DEFAULT_CURRENCY = 'USD';
const AVAILABLE_CURRENCIES = [
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' }
];

/**
 * Get user's preferred currency
 */
export function getPreferredCurrency() {
  try {
    const saved = localStorage.getItem(CURRENCY_PREFERENCE_KEY);
    if (saved && AVAILABLE_CURRENCIES.find(c => c.code === saved)) {
      console.log(`💱 [CURRENCY PREF] Using preferred currency: ${saved}`);
      return saved;
    }
    console.log(`💱 [CURRENCY PREF] No preference saved, using default: ${DEFAULT_CURRENCY}`);
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error('❌ [CURRENCY PREF] Error getting preferred currency:', error.message);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Set user's preferred currency
 */
export function setPreferredCurrency(currencyCode) {
  try {
    if (!AVAILABLE_CURRENCIES.find(c => c.code === currencyCode)) {
      throw new Error(`Invalid currency code: ${currencyCode}`);
    }
    
    localStorage.setItem(CURRENCY_PREFERENCE_KEY, currencyCode);
    console.log(`✅ [CURRENCY PREF] Preferred currency set to: ${currencyCode}`);
    
    // Dispatch event so components can update
    window.dispatchEvent(new CustomEvent('currency-preference-changed', { 
      detail: currencyCode 
    }));
    
    return true;
  } catch (error) {
    console.error('❌ [CURRENCY PREF] Error setting preferred currency:', error.message);
    return false;
  }
}

/**
 * Get all available currencies
 */
export function getAvailableCurrencies() {
  return AVAILABLE_CURRENCIES;
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code) {
  return AVAILABLE_CURRENCIES.find(c => c.code === code) || 
         AVAILABLE_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY);
}

/**
 * Get current currency symbol
 */
export function getCurrencySymbol(code) {
  const currency = getCurrencyInfo(code);
  return currency ? currency.symbol : DEFAULT_CURRENCY;
}
