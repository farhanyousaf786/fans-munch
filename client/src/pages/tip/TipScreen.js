import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { cartUtils } from '../../utils/cartUtils';
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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="tip-screen">
      <div className="tip-container">
        {/* Header with Back Button */}
        <div className="tip-header">
          <button className="back-button" onClick={handleBack}>
            <IoArrowBack size={24} />
          </button>
        </div>

        {/* Title */}
        <h1 className="tip-title">Add Tip</h1>

        {/* Description */}
        <p className="tip-description">
          The entire tip will go to your delivery partner. Order total is{' '}
          <span className="order-total">${orderTotal.toFixed(2)}</span> before discounts.
        </p>

        {/* Delivery Illustration */}
        <div className="delivery-illustration">
          <div className="delivery-icon">🚚</div>
          <p className="delivery-text">Support your delivery partner</p>
        </div>

        {/* Tip Amount Display */}
        <div className="tip-amount-section">
          <div className="tip-amount-row">
            <span className="tip-label">Tip Amount</span>
            <span className="tip-amount">${tipAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Tip Percentage Options */}
        <div className="tip-options">
          {tipPercentages.map((percentage) => (
            <button
              key={percentage}
              className={`tip-option ${selectedTipPercentage === percentage ? 'selected' : ''}`}
              onClick={() => updateTip(percentage)}
            >
              {percentage}%
            </button>
          ))}
        </div>

        {/* Custom Tip Input */}
        <div className="custom-tip-section">
          <label className="custom-tip-label">Custom tip (%)</label>
          <input
            type="number"
            className="custom-tip-input"
            placeholder="Enter custom percentage"
            value={customTipController}
            onChange={(e) => handleCustomTipChange(e.target.value)}
            min="0"
            max="100"
          />
        </div>

        {/* Action Buttons */}
        <div className="tip-actions">
          <button className="add-tip-button" onClick={handleAddTip}>
            Add Tip (${tipAmount.toFixed(2)})
          </button>
          <button className="skip-tip-button" onClick={handleSkipTip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipScreen;
