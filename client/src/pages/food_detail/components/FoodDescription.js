import React from 'react';
import './FoodDescription.css';
import { useTranslation } from '../../../i18n/i18n';

const FoodDescription = ({ description }) => {
  const { t } = useTranslation();
  
  // Fix Hebrew punctuation - move dots to end of sentences
  const fixHebrewPunctuation = (text) => {
    if (!text) return text;
    // Replace patterns like ", פטוט," with "פטוט."
    return text.replace(/,\s*([א-ת]+),/g, '$1.');
  };
  
  return (
    <div className="section">
      <h2 className="section-title">{t('food.description')}</h2>
      <p className="food-description">
        {fixHebrewPunctuation(description) || t('food.no_description')}
      </p>
    </div>
  );
};

export default FoodDescription;
