import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

// Props:
// - formData: { row, seatNo, entrance, stand, section, sectionId, floor, room }
// - sectionsOptions: [{ id, name }]
// - errors: may include row/seatNo/entrance/section/floor/room
// - onChange: (field, value) => void
// - onScanQr: () => void
// - showSeats: boolean - show seat/row fields
// - showSections: boolean - show section field
// - showFloors: boolean - show floor dropdown
// - floorsCount: number - total floors for dropdown
// - showRooms: boolean - show room input
// - showStands: boolean - show stand dropdown
const SeatForm = ({ 
  formData, 
  errors, 
  onChange, 
  sectionsOptions = [], 
  onScanQr,
  showSeats = true,
  showSections = true,
  showFloors = false,
  floorsCount = 0,
  showRooms = false,
  showStands = false,
}) => {
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
        <h2 className="section-title" style={{ margin: 0 }}>Delivery Information</h2>
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

      {/* First row: Seat Number (if enabled) & Stand (if enabled) */}
      {(showSeats || showStands) ? (
        <div className="form-row">
          {showSeats ? (
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
          ) : null}

          {showStands ? (
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
          ) : null}
        </div>
      ) : null}

      {/* Second row: Row Number (if enabled) & Section (if enabled) */}
      {(showSeats || showSections) ? (
        <div className="form-row">
          {showSeats ? (
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
          ) : null}

          {showSections ? (
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
          ) : null}
        </div>
      ) : null}

      {/* Third row: Floor (if enabled) & Room (if enabled) */}
      {(showFloors || showRooms) ? (
        <div className="form-row">
          {showFloors ? (
            <div className="form-field">
              <label className="field-label">{td('order.floor', 'Floor')}</label>
              <select
                className={`field-input ${errors.floor ? 'error' : ''}`}
                value={formData.floor || ''}
                onChange={(e) => onChange('floor', e.target.value)}
              >
                <option value="" disabled>{td('order.select_floor', 'Select floor')}</option>
                {Array.from({ length: Math.max(0, Number(floorsCount) || 0) }, (_, idx) => idx + 1).map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
              {errors.floor && <span className="error-text">{errors.floor}</span>}
            </div>
          ) : null}

          {showRooms ? (
            <div className="form-field">
              <label className="field-label">{td('order.room', 'Room')}</label>
              <input
                type="text"
                className={`field-input ${errors.room ? 'error' : ''}`}
                placeholder={td('order.room_ph', 'Room name')}
                value={formData.room || ''}
                onChange={(e) => onChange('room', e.target.value)}
              />
              {errors.room && <span className="error-text">{errors.room}</span>}
            </div>
          ) : null}
        </div>
      ) : null}


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
