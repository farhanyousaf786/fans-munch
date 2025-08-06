import React from 'react';
import './AllergensList.css';

const AllergensList = ({ allergens }) => {
  return (
    <div className="section">
      <h2 className="section-title">Allergens</h2>
      {allergens && allergens.length > 0 ? (
        <ul className="allergens-list">
          {allergens.map((allergen, index) => (
            <li key={index} className="allergen-item">
              <span className="bullet-point">•</span>
              {allergen}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-data-text">No ingredients available</p>
      )}
    </div>
  );
};

export default AllergensList;
