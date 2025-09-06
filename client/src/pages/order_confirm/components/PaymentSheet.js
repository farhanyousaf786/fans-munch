import React from 'react';

// A lightweight bottom-sheet style modal optimized for mobile
// Props: open, onClose, title, children
const PaymentSheet = ({ open, onClose, title = 'Card Payment', children }) => {
  if (!open) return null;
  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.drag} />
          <div style={styles.title}>{title}</div>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px'
  },
  sheet: {
    width: '100%', maxWidth: 480, background: '#fff', borderRadius: '16px 16px 12px 12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden',
  },
  header: {
    position: 'relative', padding: '12px 16px 8px', borderBottom: '1px solid #eee', textAlign: 'center'
  },
  drag: {
    width: 40, height: 4, background: '#e5e7eb', borderRadius: 9999, margin: '0 auto 8px'
  },
  title: { fontWeight: 700 },
  closeBtn: {
    position: 'absolute', right: 8, top: 8, border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer'
  },
  content: { padding: 16 }
};

export default PaymentSheet;
