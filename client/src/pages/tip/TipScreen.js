import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import TipHeader from './components/TipHeader';
import TipPresets from './components/TipPresets';
import TipCustomInput from './components/TipCustomInput';
import TipSummary from './components/TipSummary';
import TipActions from './components/TipActions';
import './TipScreen.css';
import { useTranslation } from '../../i18n/i18n';
import { formatPriceWithCurrency } from '../../utils/currencyConverter';

const TipScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTipAmount, setSelectedTipAmount] = useState(0);
  const [tipAmount, setTipAmount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [customTipController, setCustomTipController] = useState('');
  const customInputRef = useRef(null);
  
  // Fixed tip amounts in ILS
  const tipAmounts = [2, 4, 6, 8];

  useEffect(() => {
    // Get order total from cart
    const total = cartUtils.getTotalPrice();
    setOrderTotal(total);
    // Start with no tip selected (user must choose)
    setSelectedTipAmount(0);
    setTipAmount(0);
  }, []);

  const setTip = (amount) => {
    // Set tip amount directly
    setTipAmount(amount);
    setSelectedTipAmount(amount);
  };

  const focusCustomTip = () => {
    // Reveal custom tip input and focus it
    requestAnimationFrame(() => {
      if (customInputRef.current) {
        customInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        customInputRef.current.focus();
      }
    });
  };

  const updateTip = (amount) => {
    setSelectedTipAmount(amount);
    setCustomTipController('');
    setTip(amount);
  };

  const handleCustomTipChange = (value) => {
    setCustomTipController(value);
    const customAmount = parseFloat(value) || 0;
    if (customAmount >= 0) {
      setSelectedTipAmount(customAmount);
      setTip(customAmount);
    }
  };

  const handleAddTip = () => {
    console.log('💰 Adding tip:', tipAmount, 'ILS');
    
    // Save tip amount to storage or context
    localStorage.setItem('selectedTip', JSON.stringify({
      amount: tipAmount
    }));
    
    // Navigate to order confirmation
    navigate('/order/confirm');
  };

  const handleSkipTip = () => {
    console.log('⏭️ Skipping tip');
    
    // Set tip to 0
    localStorage.setItem('selectedTip', JSON.stringify({
      amount: 0
    }));
    
    // Navigate to order confirmation
    navigate('/order/confirm');
  };

  const handleBack = () => navigate(-1);

  // Get cart currency for conversion
  const getCartCurrency = () => {
    const cartItems = cartUtils.getCartItems();
    if (cartItems.length > 0) {
      return cartItems[0].currency || 'ILS';
    }
    return 'ILS';
  };

  return (
    <div className="tip-screen">
      <div className="tip-container">
        {/* Header */}
        <TipHeader onBack={handleBack} />

        {/* Title */}
        <h1 className="tip-title">{t('tip.title')}</h1>
        <p className="tip-description">
          {t('tip.supports_runner')} {t('tip.order_total_is')}{' '}
          <span className="order-total">{formatPriceWithCurrency(orderTotal, getCartCurrency())}</span>.
        </p>

        {/* Illustration */}
        <div className="delivery-illustration">
          <img src={process.env.PUBLIC_URL + '/assets/images/tipimage.png'} alt={t('tip.illustration_alt')} className="tip-illustration-img" />
        </div>

        {/* Tip amount summary */}
        <TipSummary tipAmount={tipAmount} onCustomTip={focusCustomTip} />

        {/* Presets */}
        <TipPresets options={tipAmounts} selected={selectedTipAmount} onChange={updateTip} />

        {/* Custom input */}
        <TipCustomInput value={customTipController} onChange={handleCustomTipChange} inputRef={customInputRef} />

        {/* Actions */}
        <TipActions onAddTip={handleAddTip} onSkipTip={handleSkipTip} tipAmount={tipAmount} />
      </div>
    </div>
  );
};

export default TipScreen;
