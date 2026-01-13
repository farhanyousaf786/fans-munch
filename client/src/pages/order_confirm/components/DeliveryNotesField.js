import React from 'react';
import './DeliveryNotesField.css';

/**
 * Simple notes field for delivery instructions
 * Used when inside/outside delivery is selected (replaces floor/room fields)
 */
const DeliveryNotesField = ({ value, onChange, error, t }) => {
  return (
    <div className="delivery-notes-field">
      <label className="delivery-notes-label">
        {t?.('order.delivery_notes') || 'Delivery Notes'}
      </label>
      <textarea
        className={`delivery-notes-textarea ${error ? 'error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t?.('order.delivery_notes_placeholder') || 'Add any special instructions for delivery...'}
        rows={3}
      />
      {error && (
        <div className="delivery-notes-error">{error}</div>
      )}
      <div className="delivery-notes-hint">
        {t?.('order.delivery_notes_hint') || 'Example: Gate 3, Section A, Row 5, Seat 12'}
      </div>
    </div>
  );
};

export default DeliveryNotesField;
