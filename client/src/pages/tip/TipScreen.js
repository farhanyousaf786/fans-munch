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

const TipScreen = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTipPercentage, setSelectedTipPercentage] = useState(10); // Default to 10%
  const [tipAmount, setTipAmount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [customTipController, setCustomTipController] = useState('');
  const customInputRef = useRef(null);
  
  const tipPercentages = [6, 10, 14, 18];

  useEffect(() => {
    // Get order total from cart and compute tip whenever selected percentage changes
    const total = cartUtils.getTotalPrice();
    setOrderTotal(total);
    const tipInAmount = (total * selectedTipPercentage / 100);
    setTipAmount(Math.round(tipInAmount * 100) / 100);
  }, [selectedTipPercentage]);

  const calculateTip = (percentage, total = orderTotal) => {
    // Calculate tip amount (matches Flutter _calculateTip)
    const tipInAmount = (total * percentage / 100);
    setTipAmount(Math.round(tipInAmount * 100) / 100); // Round to 2 decimal places
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

  const updateTip = (percentage) => {
    setSelectedTipPercentage(percentage);
    setCustomTipController('');
    calculateTip(percentage);
  };

  const handleCustomTipChange = (value) => {
    setCustomTipController(value);
    const customPercentage = parseFloat(value) || 0;
    if (customPercentage >= 0) {
      setSelectedTipPercentage(customPercentage);
      calculateTip(customPercentage);
    }
  };

  const handleAddTip = () => {
    console.log('💰 Adding tip:', tipAmount, `(${selectedTipPercentage}%)`);
    
    // Save tip amount to storage or context (matches Flutter UpdateTipEvent)
    localStorage.setItem('selectedTip', JSON.stringify({
      percentage: selectedTipPercentage,
      amount: tipAmount
    }));
    
    // Navigate to order confirmation (matches Flutter navigation)
    navigate('/order/confirm');
  };

  const handleSkipTip = () => {
    console.log('⏭️ Skipping tip');
    
    // Set tip to 0 (matches Flutter skip button)
    localStorage.setItem('selectedTip', JSON.stringify({
      percentage: 0,
      amount: 0
    }));
    
    // Navigate to order confirmation
    navigate('/order/confirm');
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="tip-screen">
      <div className="tip-container">
        {/* Header */}
        <TipHeader onBack={handleBack} />

        {/* Title */}
        <h1 className="tip-title">{t('tip.title')}</h1>
        <p className="tip-description">
          {t('tip.supports_runner')} {t('tip.order_total_is')}{' '}
          <span className="order-total">${orderTotal.toFixed(2)}</span>.
        </p>

        {/* Illustration */}
        <div className="delivery-illustration">
          <img src={process.env.PUBLIC_URL + '/assets/images/tipimage.png'} alt={t('tip.illustration_alt')} className="tip-illustration-img" />
        </div>

        {/* Tip amount summary */}
        <TipSummary tipAmount={tipAmount} onCustomTip={focusCustomTip} />

        {/* Presets */}
        <TipPresets options={tipPercentages} selected={selectedTipPercentage} onChange={updateTip} />

        {/* Custom input */}
        <TipCustomInput value={customTipController} onChange={handleCustomTipChange} inputRef={customInputRef} />

        {/* Actions */}
        <TipActions onAddTip={handleAddTip} onSkipTip={handleSkipTip} tipAmount={tipAmount} />
      </div>
    </div>
  );
};

export default TipScreen;
