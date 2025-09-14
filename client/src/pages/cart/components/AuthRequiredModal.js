import React from 'react';

const backdropStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(76, 143, 237, 0.9)',
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

const actionsStyle = {
  display: 'flex',
  gap: 12,
  padding: 20,
  justifyContent: 'flex-end',
};

const buttonPrimary = {
  background: '#111827',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
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

export default function AuthRequiredModal({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div style={cardStyle}>
        <div style={headerStyle} id="auth-modal-title">Sign in required</div>
        <div style={bodyStyle}>
          You need to sign in to place an order. Create an account or sign in to continue to checkout.
        </div>
        <div style={actionsStyle}>
          <button type="button" style={buttonSecondary} onClick={onCancel}>Not now</button>
          <button type="button" style={buttonPrimary} onClick={onConfirm}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
