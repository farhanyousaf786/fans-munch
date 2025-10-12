import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

// Props:
// - formData: { row, seatNo, entrance, stand, section, sectionId }
// - sectionsOptions: [{ id, name }]
// - errors: may include row/seatNo/entrance/section
// - onChange: (field, value) => void
// - onScanQr: () => void
const SeatForm = ({ formData, errors, onChange, sectionsOptions = [], onScanQr }) => {
  const { t } = useTranslation();
  const td = (key, fallback) => {
    try {
      const val = t(key);
      if (!val || val === key) return fallback;
      return val;
    } catch (_) {
      return fallback;
    }
  };
  return (
    <div className="seat-info-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="section-title" style={{ margin: 0 }}>{t('order.seat_info_title')}</h2>
        {/* Temporarily commented out - Scan QR button */}
        {/* <button
          type="button"
          onClick={onScanQr}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = '#2563eb'}
          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
        >
          📱 Scan QR
        </button> */}
      </div>

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
            value={formData.stand || ''}
            onChange={(e) => onChange('stand', e.target.value)}
          >
            <option value="" disabled>{t('order.select_stand')}</option>
            <option value="Gallery">{t('order.stand_gallery')}</option>
            <option value="Main">{t('order.stand_main')}</option>
          </select>
        </div>
      </div>

      {/* Second row: Row Number & Section */}
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

        {/* Section selector (required) */}
        <div className="form-field">
          <label className="field-label">{td('order.section', 'Section')}</label>
          <select
            className={`field-input ${errors.section ? 'error' : ''}`}
            value={formData.sectionId || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selected = sectionsOptions.find(s => s.id === selectedId);
              onChange('sectionId', selectedId);
              onChange('section', selected?.name || '');
            }}
          >
            <option value="" disabled>{td('order.select_section', 'Select section')}</option>
            {sectionsOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name || opt.id}</option>
            ))}
          </select>
          {errors.section && <span className="error-text">{errors.section}</span>}
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
