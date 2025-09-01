import React from 'react';
import './AllergensList.css';

const AllergensList = ({ allergens }) => {
  if (!allergens || allergens.length === 0) return null;
  return (
    <div className="section">
      <h2 className="section-title">Allergens</h2>
      <ul className="allergens-list">
        {allergens.map((allergen, index) => (
          <li key={index} className="allergen-item">
            <span className="bullet-point">•</span>
            {allergen}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AllergensList;
