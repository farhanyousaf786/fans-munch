import React, { useState, useEffect } from 'react';
import { cartUtils } from '../../../utils/cartUtils';
import './PriceInfoWidget.css';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency, convertPrice } from '../../../utils/currencyConverter';
import { getPreferredCurrency } from '../../../services/currencyPreferenceService';

const PriceInfoWidget = ({ 
  cartItems, 
  calculateSubtotal, 
  calculateDeliveryFee, 
  calculateTip, 
  calculateDiscount, 
  calculateTotal, 
  onPlaceOrder,
  onContinueAsGuest,
  onCancel,
  isLoggedIn
}) => {
  const { t } = useTranslation();
  const [hasMixedShops, setHasMixedShops] = useState(false);
  const [cartShops, setCartShops] = useState([]);
  const [preferredCurrency, setPreferredCurrency] = useState('ILS');
  
  // Check if cart has items from different shops (only considering available shops)
  useEffect(() => {
    const checkMixedShops = async () => {
      try {
        const mixed = await cartUtils.hasMixedShops();
        const shops = await cartUtils.getCartShops();
        setHasMixedShops(mixed);
        setCartShops(shops);
      } catch (error) {
        console.error('Error checking mixed shops:', error);
        setHasMixedShops(false);
        setCartShops([]);
      }
    };
    
    checkMixedShops();
  }, [cartItems]);

  // Get preferred currency
  useEffect(() => {
    const currency = getPreferredCurrency();
    setPreferredCurrency(currency);
  }, []);
  
  if (cartItems.length === 0) {
    return null;
  }

  // Get the currency of the first cart item for conversion
  const getCartCurrency = () => {
    if (cartItems.length > 0) {
      return cartItems[0].currency || 'ILS';
    }
    return 'ILS';
  };

  return (
    <div className="price-info-widget">
      <div className="price-info-content">
        {/* Mixed Shops Warning */}
        {hasMixedShops && (
          <div className="mixed-shops-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-message">
              <strong>{t('cart.mixed_shops_detected')}</strong>
              <p>{t('cart.mixed_shops_error')}</p>
            </div>
          </div>
        )}
        
        {/* Price breakdown */}
        <div className="price-row">
          <span>{t('cart.subtotal')}</span>
          <span>{formatPriceWithCurrency(calculateSubtotal(), getCartCurrency())}</span>
        </div>
        
        <div className="price-row total">
          <span>{t('cart.total')}</span>
          <span>{formatPriceWithCurrency(calculateSubtotal(), getCartCurrency())}</span>
        </div>

        {/* Converted totals row - show in preferred currency if different from cart currency */}
        {preferredCurrency !== getCartCurrency() && (
          <div className="currency-row">
            <span className="currency-badge converted">
              {formatPriceWithCurrency(calculateTotal(), preferredCurrency)}
            </span>
            <span className="currency-label">({preferredCurrency})</span>
          </div>
        )}
        
        {/* Place Order Button - Disable if mixed shops */}
        <button 
          className={`place-order-button ${hasMixedShops ? 'disabled' : ''}`} 
          onClick={onPlaceOrder}
          disabled={hasMixedShops}
        >
          {hasMixedShops ? 'Cannot Place Order' : t('cart.place_order')}
        </button>

        {/* Guest & Cancel Options: Only show if NOT logged in */}
        {!isLoggedIn && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              className="guest-option-button"
              onClick={onContinueAsGuest}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#f3f4f6',
                color: '#111827',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('auth.continue_as_guest')}
            </button>
            <button 
              className="cancel-option-button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '10px 16px',
                background: '#fff',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceInfoWidget;
