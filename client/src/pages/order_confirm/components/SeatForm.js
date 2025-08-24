import React from 'react';

const SeatForm = ({ formData, errors, onChange }) => {
  return (
    <div className="seat-info-section">
      <h2 className="section-title">Seat Information</h2>

      <div className="form-row">
        <div className="form-field">
          <label className="field-label">Row *</label>
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
          <label className="field-label">Seat Number *</label>
          <input
            type="text"
            className={`field-input ${errors.seatNo ? 'error' : ''}`}
            placeholder="Enter seat number"
            value={formData.seatNo}
            onChange={(e) => onChange('seatNo', e.target.value)}
          />
          {errors.seatNo && <span className="error-text">{errors.seatNo}</span>}
        </div>
      </div>

      <div className="form-field">
        <label className="field-label">Section *</label>
        <input
          type="text"
          className={`field-input ${errors.section ? 'error' : ''}`}
          placeholder="Enter section"
          value={formData.section}
          onChange={(e) => onChange('section', e.target.value)}
        />
        {errors.section && <span className="error-text">{errors.section}</span>}
      </div>

      <div className="form-field">
        <label className="field-label">Seat Details (Optional)</label>
        <textarea
          className="field-input textarea"
          placeholder="Additional seat information"
          value={formData.seatDetails}
          onChange={(e) => onChange('seatDetails', e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};

export default SeatForm;
