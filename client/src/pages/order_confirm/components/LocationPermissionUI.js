import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

export const LocationInlineBanner = ({ onOpenModal }) => {
  const { t } = useTranslation();
  return (
    <div style={{
      background: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '20px' }}>📍</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
          {t('order.location_required')}
        </div>
        <div style={{ fontSize: '14px', color: '#a16207', marginBottom: '12px' }}>
          {t('order.location_required_desc')}
        </div>
        <button
          onClick={onOpenModal}
          style={{
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {t('order.enable_location')}
        </button>
      </div>
    </div>
  );
};

export const LocationPermissionModal = ({
  visible,
  onClose,
  onRequestPermission,
  geoPermissionState = 'unknown'
}) => {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '92%', maxWidth: 420, background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📍</span>
          <span>{t('order.location_required')}</span>
        </div>
        <div style={{ padding: 20, color: '#374151', fontSize: 14, lineHeight: 1.45 }}>
          {geoPermissionState === 'denied' ? (
            <div>
              <div style={{ marginBottom: 10 }}>{t('order.location_required_desc')}</div>
              <ul style={{ margin: 0, paddingInlineStart: 18, color: '#475569' }}>
                <li>Click the lock icon in your browser’s address bar.</li>
                <li>Find “Location” and set it to “Allow”.</li>
                <li>Reload the page, then tap “Enable Location”.</li>
              </ul>
            </div>
          ) : (
            <div>{t('order.location_required_desc')}</div>
          )}
        </div>
        <div style={{ padding: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
            {t('common.cancel') || 'Cancel'}
          </button>
          {geoPermissionState !== 'denied' && (
            <button onClick={onRequestPermission} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
              {t('order.enable_location')}
            </button>
          )}
          <button onClick={onRequestPermission} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default {
  LocationInlineBanner,
  LocationPermissionModal,
};
