import React from 'react';
import './FoodDescription.css';
import { useTranslation } from '../../../i18n/i18n';
import { getLocalizedDescription } from '../../../utils/localization';

const FoodDescription = ({ food, description }) => {
  const { t, lang } = useTranslation();
  const text = food
    ? getLocalizedDescription(food, lang, description || '')
    : description;
  
  const fixHebrewPunctuation = (value) => {
    if (!value) return value;
    return value.replace(/,\s*([א-ת]+),/g, '$1.');
  };
  
  return (
    <div className="section">
      <h2 className="section-title">{t('food.description')}</h2>
      <p className="food-description">
        {fixHebrewPunctuation(text) || t('food.no_description')}
      </p>
    </div>
  );
};

export default FoodDescription;
