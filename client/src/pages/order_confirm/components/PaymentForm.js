import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

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
const PaymentForm = forwardRef(({ intentId, clientSecret, mode, showConfirmButton = false }, ref) => {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Load Airwallex script
  useEffect(() => {
    const scriptId = 'airwallex-elements-bundle';
    if (document.getElementById(scriptId)) return; // already there

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.airwallex.com/assets/elements.bundle.min.js';
    script.async = true;
    script.onload = () => {
      // Initialize
      try {
        if (window?.Airwallex) {
          window.Airwallex.init({ env: 'demo', origin: window.location.origin });
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
    try {
      if (!ready) return;
      if (!window?.Airwallex) return;
      // In mock mode we do not mount card
      if (mode !== 'sdk') return;
      if (!intentId || !clientSecret) return;

      // Clean re-mount
      if (cardRef.current) {
        try { cardRef.current.unmount?.(); } catch (_) {}
        cardRef.current = null;
      }
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
        alert('Card element not ready (or running in mock mode).');
        return;
      }
      const res = await window.Airwallex.confirmPaymentIntent({
        id: intentId,
        client_secret: clientSecret,
        element: cardRef.current,
      });
      console.log('[PaymentForm] confirm result:', res);
      if (res?.status === 'SUCCEEDED') {
        alert('✅ Payment successful!');
        return { ok: true, status: 'SUCCEEDED', intentId };
      } else if (res?.status === 'REQUIRES_ACTION') {
        alert('Action required (3DS). Follow the instructions.');
        return { ok: false, status: 'REQUIRES_ACTION', intentId, error: res?.error };
      } else {
        alert('❌ Payment failed: ' + (res?.error?.message || 'Unknown'));
        return { ok: false, status: res?.status || 'FAILED', intentId, error: res?.error };
      }
    } catch (e) {
      console.error('[PaymentForm] confirm error:', e);
      alert('❌ Confirm error: ' + (e?.message || 'Unknown'));
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
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Card Payment (Airwallex)</div>
      {inMock && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
          Running in <strong>mock</strong> mode on the server. Card field is hidden. Install @airwallex/node-sdk on
          the server to enable real card confirmation.
        </div>
      )}
      <div ref={containerRef} id="awx-card-container" style={{ minHeight: 60 }} />
      {!inMock && showConfirmButton && (
        <button onClick={onConfirm} style={{ marginTop: 12 }} disabled={!ready}>
          Confirm Card Payment
        </button>
      )}
    </div>
  );
});

export default PaymentForm;
