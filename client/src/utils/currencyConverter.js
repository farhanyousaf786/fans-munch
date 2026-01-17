/**
 * Currency Converter Utility
 * Converts prices from any Firebase currency to user's preferred currency
 */

import { getCachedRates } from '../services/currencyInitService';
import { getPreferredCurrency, getCurrencyInfo } from '../services/currencyPreferenceService';

// Map alternative currency codes to standard codes
const CURRENCY_ALIASES = {
  'NIS': 'ILS',  // Israeli Shekel (alternative code)
};

/**
 * Normalize currency code (handle aliases)
 */
function normalizeCurrency(currency) {
  return CURRENCY_ALIASES[currency] || currency;
}

/**
 * Convert price from Firebase currency to user's preferred currency
 * @param {number} price - Price stored in Firebase
 * @param {string} firebaseCurrency - Currency stored in Firebase (e.g., 'ILS', 'USD', 'EUR', 'NIS')
 * @returns {object} { convertedPrice, symbol, currencyCode, originalPrice, firebaseCurrency }
 */
export function convertPrice(price, firebaseCurrency = 'USD') {
  try {
    // Normalize currency code
    const normalizedFirebaseCurrency = normalizeCurrency(firebaseCurrency);
    
    // Get user's preferred currency
    const userCurrency = getPreferredCurrency();

    if (!price || price <= 0) {
      const currencyInfo = getCurrencyInfo(userCurrency);
      return {
        convertedPrice: 0,
        symbol: currencyInfo?.symbol || '$',
        currencyCode: userCurrency,
        originalPrice: price,
        firebaseCurrency: normalizedFirebaseCurrency
      };
    }
    
    console.log(`💱 [CONVERTER] DB: ${price} ${firebaseCurrency}(${normalizedFirebaseCurrency}) → User wants: ${userCurrency}`);
    
    // If user prefers the same currency as Firebase, no conversion needed
    if (userCurrency === normalizedFirebaseCurrency) {
      const currencyInfo = getCurrencyInfo(userCurrency);
      console.log(`✅ [CONVERTER] Same currency - no conversion needed`);
      return {
        convertedPrice: price,
        symbol: currencyInfo?.symbol || '$',
        currencyCode: userCurrency,
        originalPrice: price,
        firebaseCurrency: normalizedFirebaseCurrency
      };
    }

    // Get exchange rates (all rates are relative to USD)
    const rates = getCachedRates();
    if (!rates) {
      console.warn('⚠️ [CONVERTER] No rates available, using original price');
      const currencyInfo = getCurrencyInfo(userCurrency);
      return {
        convertedPrice: price,
        symbol: currencyInfo?.symbol || '$',
        currencyCode: userCurrency,
        originalPrice: price,
        firebaseCurrency: normalizedFirebaseCurrency
      };
    }

    // Convert from Firebase currency to USD first (as base)
    const firebaseRate = rates[normalizedFirebaseCurrency] || 1;
    const userRate = rates[userCurrency] || 1;

    // Step 1: Convert from Firebase currency to USD
    const priceInUSD = price / firebaseRate;
    
    // Step 2: Convert from USD to user's currency
    const convertedPrice = priceInUSD * userRate;

    const currencyInfo = getCurrencyInfo(userCurrency);

    console.log(`💱 [CONVERTER] ${price} ${normalizedFirebaseCurrency} (rate: ${firebaseRate}) → ${priceInUSD.toFixed(2)} USD → ${convertedPrice.toFixed(2)} ${userCurrency} (rate: ${userRate})`);

    return {
      convertedPrice: convertedPrice,
      symbol: currencyInfo?.symbol || '$',
      currencyCode: userCurrency,
      originalPrice: price,
      firebaseCurrency: normalizedFirebaseCurrency
    };
  } catch (error) {
    console.error('❌ [CONVERTER] Error converting price:', error.message);
    const normalizedCurrency = normalizeCurrency(firebaseCurrency);
    const currencyInfo = getCurrencyInfo(normalizedCurrency);
    return {
      convertedPrice: price,
      symbol: currencyInfo?.symbol || '$',
      currencyCode: normalizedCurrency,
      originalPrice: price,
      firebaseCurrency: normalizedCurrency
    };
  }
}

/**
 * Format price with currency symbol
 * @param {number} price - Price to format
 * @param {string} firebaseCurrency - Currency in Firebase (default: USD)
 * @returns {string} Formatted price string (e.g., "₪35.50")
 */
export function formatPriceWithCurrency(price, firebaseCurrency = 'USD') {
  const { convertedPrice, symbol } = convertPrice(price, firebaseCurrency);
  return `${symbol}${convertedPrice.toFixed(2)}`;
}

/**
 * Get conversion info for display
 * @param {number} price - Price in Firebase currency
 * @param {string} firebaseCurrency - Currency in Firebase (default: USD)
 * @returns {object} { displayPrice, symbol, currencyCode, originalPrice, firebaseCurrency }
 */
export function getPriceInfo(price, firebaseCurrency = 'USD') {
  const conversion = convertPrice(price, firebaseCurrency);
  return {
    displayPrice: conversion.convertedPrice.toFixed(2),
    symbol: conversion.symbol,
    currencyCode: conversion.currencyCode,
    originalPrice: conversion.originalPrice,
    firebaseCurrency: conversion.firebaseCurrency
  };
}
