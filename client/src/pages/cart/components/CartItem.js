import React from 'react';
import { MdAdd, MdRemove, MdDelete, MdShoppingCart } from 'react-icons/md';
import './CartItem.css';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';

const CartItem = ({ item, onUpdateQuantity, onAddToCart, onRemoveFromCart }) => {
  const { t } = useTranslation();

  return (
    <div className="cart-item-wrapper">
      {/* Cart Item (matches Flutter CartItem widget) */}
      <div className="cart-item">
        {/* Item Info Section */}
        <div className="item-info">
          <div className="item-header">
            <h4 className="item-name">{item.name}</h4>
            <div className="quantity-controls">
              <button 
                className="quantity-btn remove"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              >
                <MdRemove size={16} />
              </button>
              <span className="quantity-display">{item.quantity}</span>
              <button 
                className="quantity-btn add"
                onClick={() => onAddToCart(item.id)}
              >
                <MdAdd size={16} />
              </button>
            </div>
          </div>
          

          
          <div className="item-price-section">
            <span style={{ color: '#444', fontWeight: '500' }}>{t('cart.price')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="item-price" style={{ fontWeight: '700' }}>
                {formatPriceWithCurrency(item.price * item.quantity, item.currency)}
              </span>
              {item.quantity > 1 && (
                <span style={{ fontSize: '11px', color: '#666' }}>
                  ({formatPriceWithCurrency(item.price, item.currency)} x {item.quantity})
                </span>
              )}
            </div>
          </div>

          {/* Extras / Selected Options */}
          {item.selectedSauces && item.selectedSauces.length > 0 && (
            <div className="item-extras-section" style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>{t('food.extras')}:</div>
              {item.selectedSauces.map((extra, idx) => {
                const priceVal = Number(extra.price);
                const priceDisplay = (!isNaN(priceVal) && priceVal > 0) 
                  ? `+ ${formatPriceWithCurrency(priceVal, item.currency || 'ILS')}`
                  : '(Free)';
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>- {extra.name}</span>
                    <span style={{ color: priceDisplay === '(Free)' ? '#10b981' : '#666' }}>{priceDisplay}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Combo Breakdown - Always show if it's a combo */}
          {(item.isCombo || (item.comboItemInfo && Object.keys(item.comboItemInfo).length > 0)) && (
            <div className="item-extras-section" style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🍱</span> {t('food.combo_includes')}
              </div>
              
              {Object.entries(item.comboItemInfo).map(([instanceKey, itemName], groupIdx) => {
                const selections = item.comboSelections?.[instanceKey] || [];
                
                return (
                  <div key={groupIdx} className="combo-selection-group" style={{ marginBottom: '8px', borderLeft: '2px solid #3b82f6', paddingLeft: '8px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px', marginBottom: '2px' }}>
                      {itemName}
                    </div>
                    {selections.length > 0 ? (
                      selections.map((option, optIdx) => {
                        const priceVal = Number(option.price);
                        const priceDisplay = (!isNaN(priceVal) && priceVal > 0) 
                          ? `+ ${formatPriceWithCurrency(priceVal, item.currency || 'ILS')}`
                          : `(${t('common.free') || 'Free'})`;
                        
                        return (
                          <div key={optIdx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
                            <span style={{ color: '#64748b' }}>• {option.name}</span>
                            <span style={{ fontWeight: '500', color: priceDisplay.includes('+') ? '#2563eb' : '#10b981' }}>{priceDisplay}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                        {t('food.standard_prep') || 'Standard Preparation'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Item Image */}
        <div className="item-image-container">
          {item.images && item.images.length > 0 ? (
            <img 
              src={item.images[0]} 
              alt={item.name}
              className="item-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="image-placeholder" style={{ display: item.images && item.images.length > 0 ? 'none' : 'flex' }}>
            <MdShoppingCart size={40} />
          </div>
        </div>
      </div>
      
      {/* Swipe to delete functionality (matches Flutter Dismissible) */}
      <button 
        className="delete-button"
        onClick={() => onRemoveFromCart(item.id)}
        title="Remove item"
      >
        <MdDelete size={20} />
      </button>
    </div>
  );
};

export default CartItem;
