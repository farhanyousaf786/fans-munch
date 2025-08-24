import React from 'react';
import { IoCard, IoWallet } from 'react-icons/io5';

const PaymentMethods = ({ selected, onSelect }) => {
  return (
    <div className="payment-method-section">
      <h2 className="section-title">Payment Method</h2>

      <div className="payment-options">
        <button
          className={`payment-option ${selected === 'visa' ? 'selected' : ''}`}
          onClick={() => onSelect('visa')}
        >
          <IoCard size={24} />
          <span>Visa</span>
        </button>

        <button
          className={`payment-option ${selected === 'paypal' ? 'selected' : ''}`}
          onClick={() => onSelect('paypal')}
        >
          <IoWallet size={24} />
          <span>PayPal</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethods;
