import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartUtils } from '../../utils/cartUtils';
import TipHeader from './components/TipHeader';
import TipPresets from './components/TipPresets';
import TipCustomInput from './components/TipCustomInput';
import TipSummary from './components/TipSummary';
import TipActions from './components/TipActions';
import './TipScreen.css';

const TipScreen = () => {
  const navigate = useNavigate();
  const [selectedTipPercentage, setSelectedTipPercentage] = useState(10); // Default to 10%
  const [tipAmount, setTipAmount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);
  const [customTipController, setCustomTipController] = useState('');
  
  const tipPercentages = [6, 10, 14, 18];

  useEffect(() => {
    // Get order total from cart (matches Flutter initState)
    const total = cartUtils.getTotalPrice();
    setOrderTotal(total);
    calculateTip(selectedTipPercentage, total);
  }, [selectedTipPercentage]);

  const calculateTip = (percentage, total = orderTotal) => {
    // Calculate tip amount (matches Flutter _calculateTip)
    const tipInAmount = (total * percentage / 100);
    setTipAmount(Math.round(tipInAmount * 100) / 100); // Round to 2 decimal places
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
        <h1 className="tip-title">Add Tip</h1>
        <p className="tip-description">
          Your entire tip supports the runner. Order total is{' '}
          <span className="order-total">${orderTotal.toFixed(2)}</span>.
        </p>

        {/* Tip amount summary */}
        <TipSummary tipAmount={tipAmount} />

        {/* Presets */}
        <TipPresets options={tipPercentages} selected={selectedTipPercentage} onChange={updateTip} />

        {/* Custom input */}
        <TipCustomInput value={customTipController} onChange={handleCustomTipChange} />

        {/* Actions */}
        <TipActions onAddTip={handleAddTip} onSkipTip={handleSkipTip} tipAmount={tipAmount} />
      </div>
    </div>
  );
};

export default TipScreen;
