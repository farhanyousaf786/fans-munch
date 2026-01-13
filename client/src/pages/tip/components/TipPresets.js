import React from 'react';
import { formatPriceWithCurrency, convertPrice } from '../../../utils/currencyConverter';
import { getPreferredCurrency } from '../../../services/currencyPreferenceService';

const TipPresets = ({ options = [2, 4, 6, 8], selected, onChange }) => {
  const preferredCurrency = getPreferredCurrency();
  
  return (
    <div className="tip-options">
      {options.map((ilsAmount) => {
        // Convert ILS amount to preferred currency
        const converted = convertPrice(ilsAmount, 'ILS', preferredCurrency);
        const convertedAmount = converted.convertedPrice;
        
        return (
          <button
            key={ilsAmount}
            className={`tip-option ${selected === convertedAmount ? 'selected' : ''}`}
            onClick={() => onChange(convertedAmount)}
          >
            {formatPriceWithCurrency(convertedAmount, preferredCurrency)}
          </button>
        );
      })}
    </div>
  );
};

export default TipPresets;
