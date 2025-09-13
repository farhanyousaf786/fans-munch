import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const SeatForm = ({ formData, errors, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="seat-info-section">
      <h2 className="section-title">{t('order.seat_info_title')}</h2>

      {/* First row: Seat Number & Stand Number */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">{t('order.seat_number')}</label>
          <input
            type="text"
            className={`field-input ${errors.seatNo ? 'error' : ''}`}
            placeholder={t('order.seat_number_ph')}
            value={formData.seatNo}
            onChange={(e) => onChange('seatNo', e.target.value)}
          />
          {errors.seatNo && <span className="error-text">{errors.seatNo}</span>}
        </div>

        <div className="form-field">
          <label className="field-label">{t('order.stand')}</label>
          <select
            className="field-input"
            value={formData.stand || 'Gallery'}
            onChange={(e) => onChange('stand', e.target.value)}
          >
            <option value="Gallery">{t('order.stand_gallery')}</option>
            <option value="Main">{t('order.stand_main')}</option>
          </select>
        </div>
      </div>

      {/* Second row: Row Number & Entrance */}
      <div className="form-row">
        <div className="form-field">
          <label className="field-label">{t('order.row_number')}</label>
          <input
            type="text"
            className={`field-input ${errors.row ? 'error' : ''}`}
            placeholder={t('order.row_number_ph')}
            value={formData.row}
            onChange={(e) => onChange('row', e.target.value)}
          />
          {errors.row && <span className="error-text">{errors.row}</span>}
        </div>

        <div className="form-field">
          <label className="field-label">{t('order.entrance')}</label>
          <input
            type="text"
            className="field-input"
            placeholder={t('order.entrance_ph')}
            value={formData.entrance || ''}
            onChange={(e) => onChange('entrance', e.target.value)}
          />
        </div>
      </div>

      {/* Third row: Area & (spacer) */}
      {/* <div className="form-row">
        <div className="form-field">
          <label className="field-label">{t('order.area')}</label>
          <input
            type="text"
            className="field-input"
            placeholder={t('order.area_ph')}
            value={formData.area || ''}
            onChange={(e) => onChange('area', e.target.value)}
          />
        </div>
        <div className="form-field" />
      </div> */}

      {/* <div className="form-field">
        <label className="field-label">{t('order.additional_details')}</label>
        <textarea
          className="field-input textarea"
          placeholder={t('order.additional_details_ph')}
          value={formData.seatDetails}
          onChange={(e) => onChange('seatDetails', e.target.value)}
          rows={3}
        />
      </div> */}
    </div>
  );
};

export default SeatForm;
