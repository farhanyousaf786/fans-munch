import React from 'react';

const SeatForm = ({ formData, errors, onChange }) => {
  return (
    <div className="seat-info-section">
      <h2 className="section-title">Seat Information</h2>

      {/* First row: Seat Number & Stand Number */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Seat Number</label>
          <input
            type="text"
            className={`field-input ${errors.seatNo ? 'error' : ''}`}
            placeholder="Enter seat number"
            value={formData.seatNo}
            onChange={(e) => onChange('seatNo', e.target.value)}
          />
          {errors.seatNo && <span className="error-text">{errors.seatNo}</span>}
        </div>

        <div className="form-field">
          <label className="field-label">Stand Number</label>
          <input
            type="text"
            className="field-input"
            placeholder="Enter stand"
            value={formData.stand || ''}
            onChange={(e) => onChange('stand', e.target.value)}
          />
        </div>
      </div>

      {/* Second row: Row Number & Entrance */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Row Number</label>
          <input
            type="text"
            className={`field-input ${errors.row ? 'error' : ''}`}
            placeholder="Enter row number"
            value={formData.row}
            onChange={(e) => onChange('row', e.target.value)}
          />
          {errors.row && <span className="error-text">{errors.row}</span>}
        </div>

        <div className="form-field">
          <label className="field-label">Entrance</label>
          <input
            type="text"
            className="field-input"
            placeholder="Enter entrance"
            value={formData.entrance || ''}
            onChange={(e) => onChange('entrance', e.target.value)}
          />
        </div>
      </div>

      {/* Third row: Area & (spacer) */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Area</label>
          <input
            type="text"
            className="field-input"
            placeholder="Enter area"
            value={formData.area || ''}
            onChange={(e) => onChange('area', e.target.value)}
          />
        </div>
        <div className="form-field" />
      </div>

      {/* Additional Details */}
      <div className="form-field">
        <label className="field-label">Additional Details</label>
        <textarea
          className="field-input textarea"
          placeholder="Add text"
          value={formData.seatDetails}
          onChange={(e) => onChange('seatDetails', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default SeatForm;
