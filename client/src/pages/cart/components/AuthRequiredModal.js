import React from 'react';
import { useTranslation } from '../../../i18n/i18n';

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(250, 250, 250, 0.37)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
};

const cardStyle = {
  width: 'min(92vw, 420px)',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  overflow: 'hidden',
};

const headerStyle = {
  padding: '16px 20px 0 20px',
  fontWeight: 700,
  fontSize: 18,
  color: '#111827',
};

const bodyStyle = {
  padding: '8px 20px 0 20px',
  fontSize: 14,
  color: '#4b5563',
  lineHeight: 1.5,
};

const guestTextStyle = {
  padding: '0 20px',
  fontSize: 13,
  color: '#6b7280',
  lineHeight: 1.4,
  textAlign: 'center',
  marginBottom: '8px',
};

const actionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
};

const topButtonsStyle = {
  display: 'flex',
  gap: 12,
  justifyContent: 'flex-end',
};

const guestButtonStyle = {
  background: '#f3f4f6',
  color: '#111827',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
  justifyContent: 'center',
};

const buttonPrimary = {
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  borderColor: '#111827',
};

const buttonSecondary = {
  background: '#f3f4f6',
  color: '#111827',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

export default function AuthRequiredModal({ open, onCancel, onConfirm, onContinueAsGuest }) {
  const { t } = useTranslation();
  
  if (!open) return null;
  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div style={cardStyle}>
        <div style={headerStyle} id="auth-modal-title">{t('auth.sign_in_required')}</div>
        <div style={bodyStyle}>
          {t('auth.sign_in_required_message')}
        </div>
        <div style={actionsStyle}>
          <div style={topButtonsStyle}>
            <button type="button" style={buttonSecondary} onClick={onCancel}>{t('common.not_now')}</button>
            <button type="button" style={buttonPrimary} onClick={onConfirm}>{t('auth.sign_in')}</button>
          </div>
          <div style={guestTextStyle}>
            {t('auth.or_continue_as_guest')}
          </div>
          <button type="button" style={guestButtonStyle} onClick={onContinueAsGuest}>{t('auth.continue_as_guest')}</button>
        </div>
      </div>
    </div>
  );
}
