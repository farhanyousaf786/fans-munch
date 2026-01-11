import React from 'react';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';

const TipPresets = ({ options = [2, 4, 6, 8], selected, onChange }) => {
  
  return (
    <div className="tip-options">
      {options.map((amount) => (
        <button
          key={amount}
          className={`tip-option ${selected === amount ? 'selected' : ''}`}
          onClick={() => onChange(amount)}
        >
          {formatPriceWithCurrency(amount, 'ILS')}
        </button>
      ))}
    </div>
  );
};

export default TipPresets;
