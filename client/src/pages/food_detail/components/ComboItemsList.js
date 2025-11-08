import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ComboItemsList.css';
import { useTranslation } from '../../../i18n/i18n';

const ComboItemsList = ({ comboItems, isCombo, comboPrice }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formatILS = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(val || 0);

  if (!isCombo || !comboItems || comboItems.length === 0) return null;

  const handleItemClick = (item) => {
    // Navigate to individual item detail page
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
      
      {/* Price comparison */}
      <div className="combo-price-comparison">
        <div className="price-row">
          <span className="price-label">{t('food.individual_items_total')}</span>
          <span className="price-value individual-price">{formatILS(totalIndividualPrice)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">{t('food.combo_price')}</span>
          <span className="price-value combo-price">{formatILS(comboPrice || 0)}</span>
        </div>
        {savings > 0 && (
          <div className="price-row savings">
            <span className="price-label">{t('food.you_save')}</span>
            <span className="price-value savings-amount">{formatILS(savings)}</span>
          </div>
        )}
      </div>

      <div className="combo-items-list">
        {comboItems.map((item, index) => (
          <div 
            key={item.id || index} 
            className="combo-item clickable"
            onClick={() => handleItemClick(item)}
          >
            <div className="combo-item-image">
              {item.images && item.images.length > 0 ? (
                <img 
                  src={item.images[0]} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="combo-item-placeholder" style={{ display: item.images?.length > 0 ? 'none' : 'flex' }}>
                🍽️
              </div>
            </div>
            <div className="combo-item-details">
              <h3 className="combo-item-name">{item.name}</h3>
              <p className="combo-item-description">{item.description}</p>
              <div className="combo-item-meta">
                <span className="combo-item-price">{formatILS(item.price)}</span>
                {item.preparationTime && (
                  <span className="combo-item-time">{item.preparationTime} min</span>
                )}
              </div>
            </div>
            <div className="combo-item-arrow">
              →
            </div>
          </div>
        ))}
      </div>
      <div className="combo-note">
        <p>Click on any item to view its details. Items are prepared together and served as a combo at the combo price above.</p>
      </div>
    </div>
  );
};

export default ComboItemsList;
