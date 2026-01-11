import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/i18n';
import { 
  getPreferredCurrency, 
  setPreferredCurrency, 
  getAvailableCurrencies,
  getCurrencyInfo 
} from '../../services/currencyPreferenceService';
import { getCachedRates } from '../../services/currencyInitService';
import './settings.css';

const CurrencySettingsScreen = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [rates, setRates] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Get current preference
    const current = getPreferredCurrency();
    setSelectedCurrency(current);
    
    // Get cached rates for display
    const cachedRates = getCachedRates();
    setRates(cachedRates);
    
    console.log('💱 [CURRENCY SETTINGS] Current preference:', current);
    console.log('💱 [CURRENCY SETTINGS] Available rates:', cachedRates);
  }, []);

  const handleCurrencySelect = (currencyCode) => {
    setPreferredCurrency(currencyCode);
    setSelectedCurrency(currencyCode);
  };

  const availableCurrencies = getAvailableCurrencies();

  return (
    <div className="screen static-screen">
      <h1>{t('settings.select_currency') || 'Select Currency'}</h1>
      
      <div className="section-card">
        <h2>{t('settings.app_currency') || 'App Currency'}</h2>
        <p className="helper-text">
          {t('settings.currency_description') || 'Choose your preferred currency for displaying prices'}
        </p>

        <div className="currency-options">
          {availableCurrencies.map((currency) => {
            const isSelected = selectedCurrency === currency.code;
            const rate = rates ? rates[currency.code] : null;
            
            return (
              <button
                key={currency.code}
                className={`currency-option ${isSelected ? 'active' : ''}`}
                onClick={() => handleCurrencySelect(currency.code)}
              >
                <div className="currency-header">
                  <span className="currency-symbol">{currency.symbol}</span>
                  <div className="currency-info">
                    <span className="currency-code">{currency.code}</span>
                    <span className="currency-name">{currency.name}</span>
                  </div>
                </div>
                
                {rate && (
                  <div className="currency-rate">
                    <span className="rate-label">Rate:</span>
                    <span className="rate-value">1 USD = {rate.toFixed(2)} {currency.code}</span>
                  </div>
                )}
                
                {isSelected && (
                  <div className="currency-check">✓</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="current-selection">
          <p>
            <strong>{t('settings.current') || 'Current'}:</strong> {' '}
            {selectedCurrency && getCurrencyInfo(selectedCurrency)?.name}
          </p>
        </div>
      </div>

      <div className="info-box">
        <p>
          💡 {t('settings.currency_info') || 'Your selected currency will be used to display all prices in the app. Exchange rates are updated every 8 hours.'}
        </p>
      </div>
    </div>
  );
};

export default CurrencySettingsScreen;
