import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ComboItemsList.css';
import { useTranslation } from '../../../i18n/i18n';
import { formatPriceWithCurrency } from '../../../utils/currencyConverter';
import { getFoodImageUrl, getLocalizedName, getLocalizedDescription } from '../../../utils/localization';

const ComboItemsList = ({ 
  comboItems, 
  isCombo, 
  comboPrice, 
  foodCurrency = 'ILS',
  comboSelections = {},
  onOptionToggle
}) => {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  if (!isCombo || !comboItems || comboItems.length === 0) return null;

  const handleItemClick = (item) => {
    navigate(`/food/${item.id}`);
  };

  const calculateTotalIndividualPrice = () => {
    return comboItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const totalIndividualPrice = calculateTotalIndividualPrice();
  const savings = totalIndividualPrice - (comboPrice || 0);

  return (
    <div className="section">
      <h2 className="section-title">{t('food.combo_includes')}</h2>
      
      <div className="combo-price-comparison">
        <div className="price-row">
          <span className="price-label">{t('food.individual_items_total')}</span>
          <span className="price-value individual-price">{formatPriceWithCurrency(totalIndividualPrice, foodCurrency)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">{t('food.combo_price')}</span>
          <span className="price-value combo-price">{formatPriceWithCurrency(comboPrice || 0, foodCurrency)}</span>
        </div>
        {savings > 0 && (
          <div className="price-row savings">
            <span className="price-label">{t('food.you_save')}</span>
            <span className="price-value savings-amount">{formatPriceWithCurrency(savings, foodCurrency)}</span>
          </div>
        )}
      </div>

      <div className="combo-items-list">
        {comboItems.map((item, index) => {
          const itemOptions = item.customization?.options || [];
          const instanceKey = `${item.id}_${index}`;
          const selectedItemOptions = comboSelections[instanceKey] || [];
          const displayName = getLocalizedName(item, lang, item.name || '');
          const displayDescription = getLocalizedDescription(item, lang, item.description || '');
          const imageUrl = getFoodImageUrl(item);

          return (
            <div key={instanceKey} className="combo-item-container">
              <div 
                className="combo-item clickable"
                onClick={() => handleItemClick(item)}
              >
                <div className="combo-item-image">
                  <img 
                    src={imageUrl} 
                    alt={displayName}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `${process.env.PUBLIC_URL || ''}/assets/images/on-boarding-1.png`;
                    }}
                  />
                </div>
                <div className="combo-item-details">
                  <h3 className="combo-item-name">{displayName}</h3>
                  {displayDescription ? (
                    <p className="combo-item-description">{displayDescription}</p>
                  ) : null}
                  <div className="combo-item-meta">
                    <span className="combo-item-price">{formatPriceWithCurrency(item.price, item.currency || foodCurrency)}</span>
                    {item.preparationTime && (
                      <span className="combo-item-time">{item.preparationTime} {t('food.min')}</span>
                    )}
                  </div>
                </div>
                <div className="combo-item-arrow">
                  →
                </div>
              </div>

              {itemOptions.length > 0 && (
                <div className="combo-item-options">
                  <h4 className="options-title">{t('food.options_for')} {displayName}</h4>
                  <div className="options-grid">
                    {itemOptions.map((option, optIdx) => {
                      const isSelected = selectedItemOptions.some(
                        (s) => s.name === option.name && s.price === option.price
                      );
                      return (
                        <label key={optIdx} className="combo-option-label">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              onOptionToggle(instanceKey, option);
                            }}
                          />
                          <span className="option-name">
                            {option.name}
                            {Number(option.price) > 0 && (
                              <span className="option-extra-price">
                                (+{formatPriceWithCurrency(option.price, foodCurrency)})
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComboItemsList;
