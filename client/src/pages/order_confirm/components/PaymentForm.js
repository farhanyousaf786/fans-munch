import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { showToast } from '../../../components/toast/ToastContainer';
import { useTranslation } from '../../../i18n/i18n';

// Lightweight Airwallex card UI demo. It:
// - Loads the Airwallex Elements script
// - Creates a Payment Intent via our backend
// - Mounts a Card element when in SDK mode
// - Provides a demo "Confirm" button to try client confirmation
// Note: When the server runs in mock mode (no SDK installed), there is no
// real confirmation — we still show the panel and note it's mocked.

// Props:
// - intentId, clientSecret, mode ('sdk' | 'mock') provided by parent after creating intent
// - showConfirmButton: optionally render a local confirm button (default false since parent controls Place Order)
// - onConfirmed: optional callback invoked after successful confirmation
const PaymentForm = forwardRef(({ intentId, clientSecret, mode, showConfirmButton = false, onConfirmed }, ref) => {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { t, lang } = useTranslation();

  // Load Airwallex script
  useEffect(() => {
    const scriptId = 'airwallex-elements-bundle';
    const existing = document.getElementById(scriptId);
    if (existing) {
      // Script already injected (common when user navigates back). If global is ready, mark as ready.
      if (window?.Airwallex) {
        try {
          window.Airwallex.init({
            env: process.env.REACT_APP_AIRWALLEX_ENV || 'demo',
            origin: window.location.origin,
            locale: lang === 'he' ? 'he' : 'en',
          });
        } catch (_) {}
        setReady(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.airwallex.com/assets/elements.bundle.min.js';
    script.async = true;
    script.onload = () => {
      // Initialize
      try {
        if (window?.Airwallex) {
          window.Airwallex.init({
            env: process.env.REACT_APP_AIRWALLEX_ENV || 'demo',
            origin: window.location.origin,
            locale: lang === 'he' ? 'he' : 'en',
          });
          setReady(true);
        } else {
          console.warn('[PaymentForm] Airwallex global not present');
        }
      } catch (e) {
        console.error('[PaymentForm] Airwallex init error:', e);
      }
    };
    script.onerror = () => console.error('[PaymentForm] Failed to load Airwallex Elements');
    document.body.appendChild(script);
  }, []);

  // Mount/unmount card when ready and intent is provided by parent
  useEffect(() => {
    if (!ready || !intentId || !clientSecret || (mode !== 'sdk' && mode !== 'mock')) {
      return;
    } 
    if (!window?.Airwallex) return;
    if (!intentId || !clientSecret) return;

    // Clean re-mount
    if (cardRef.current) {
      try { cardRef.current.unmount?.(); } catch (_) {}
      cardRef.current = null;
    }

    try {
      const card = window.Airwallex.createElement('card', {});
      cardRef.current = card;
      card.mount(containerRef.current);
    } catch (e) {
      console.error('[PaymentForm] Failed to mount card:', e);
    }
  }, [ready, intentId, clientSecret, mode]);

  const onConfirm = async () => {
    try {
      if (mode !== 'sdk') {
        // In mock mode treat as success
        return { ok: true, status: 'MOCK', intentId };
      }
      if (!window?.Airwallex || !cardRef.current || !intentId || !clientSecret) {
        showToast('Card element not ready (or running in mock mode).', 'error', 3000);
        return;
      }
      const res = await window.Airwallex.confirmPaymentIntent({
        id: intentId,
        client_secret: clientSecret,
        element: cardRef.current,
      });
      console.log('[PaymentForm] confirm result:', res);
      if (res?.status === 'SUCCEEDED') {
        showToast('Payment successful!', 'success', 2500);
        try { onConfirmed && onConfirmed({ intentId, status: 'SUCCEEDED' }); } catch (_) {}
        return { ok: true, status: 'SUCCEEDED', intentId };
      } else if (res?.status === 'REQUIRES_ACTION') {
        showToast('Action required (3DS). Follow the instructions.', 'info', 3500);
        return { ok: false, status: 'REQUIRES_ACTION', intentId, error: res?.error };
      } else {
        showToast('Payment failed: ' + (res?.error?.message || 'Unknown'), 'error', 4000);
        return { ok: false, status: res?.status || 'FAILED', intentId, error: res?.error };
      }
    } catch (e) {
      console.error('[PaymentForm] confirm error:', e);
      showToast('Confirm error: ' + (e?.message || 'Unknown'), 'error', 4000);
      return { ok: false, status: 'ERROR', error: e };
    }
  };

  // Expose imperative confirm() to parent
  useImperativeHandle(ref, () => ({
    async confirm() {
      return await onConfirm();
    },
    isReady() { return Boolean((mode === 'mock') || (ready && cardRef.current)); },
  }));

  const inMock = mode === 'mock';

  return (
    <div style={{ padding: 16, margin: '16px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{t('order.card_payment_title')}</div>
      {inMock && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
          Running in <strong>mock</strong> mode on the server. Card field is hidden. Install @airwallex/node-sdk on
          the server to enable real card confirmation.
        </div>
      )}
      <div ref={containerRef} id="awx-card-container" style={{ minHeight: 60 }} />
      {!inMock && showConfirmButton && (
        <button onClick={onConfirm} style={{ marginTop: 12 }} disabled={!ready}>
          {t('order.confirm_card_payment')}
        </button>
      )}
    </div>
  );
});

export default PaymentForm;
