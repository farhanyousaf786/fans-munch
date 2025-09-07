import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { showToast } from '../../../components/toast/ToastContainer';
import { useTranslation } from '../../../i18n/i18n';

// Debug logging for environment variable (remove after testing)
console.log('[DEBUG] REACT_APP_STRIPE_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Initialize Stripe - only if publishable key is available
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

// Card form component that uses Stripe Elements
const CardForm = forwardRef(({ intentId, clientSecret, onConfirmed }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation();

  // Debug logging
  console.log('[DEBUG] CardForm - stripe:', !!stripe, 'elements:', !!elements);

  const handleConfirm = async () => {
    if (!stripe || !elements || !clientSecret) {
      showToast('Stripe not ready or missing payment intent', 'error', 3000);
      return { ok: false, error: 'Stripe not ready' };
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        console.error('[Stripe] Payment confirmation error:', error);
        showToast(`Payment failed: ${error.message}`, 'error', 4000);
        return { ok: false, error: error.message, status: 'FAILED' };
      }

      if (paymentIntent.status === 'succeeded') {
        showToast('Payment successful!', 'success', 2500);
        onConfirmed && onConfirmed({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
        return { ok: true, status: 'SUCCEEDED', intentId: paymentIntent.id };
      } else if (paymentIntent.status === 'requires_action') {
        showToast('Additional authentication required', 'info', 3500);
        return { ok: false, status: 'REQUIRES_ACTION', intentId: paymentIntent.id };
      } else {
        showToast(`Payment status: ${paymentIntent.status}`, 'warning', 3000);
        return { ok: false, status: paymentIntent.status, intentId: paymentIntent.id };
      }

    } catch (err) {
      console.error('[Stripe] Confirmation error:', err);
      showToast(`Payment error: ${err.message}`, 'error', 4000);
      return { ok: false, error: err.message, status: 'ERROR' };
    } finally {
      setProcessing(false);
    }
  };

  // Expose confirm method to parent
  useImperativeHandle(ref, () => ({
    async confirm() {
      return await handleConfirm();
    },
    isReady() {
      return Boolean(stripe && elements && clientSecret);
    }
  }));

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
      complete: {
        color: '#424770',
      },
    },
    hidePostalCode: false,
  };

  if (!stripe || !elements) {
    return (
      <div style={{ padding: 16, margin: '16px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>{t('order.card_payment_title')}</div>
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', padding: '20px' }}>
          Loading Stripe payment form...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, margin: '16px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>{t('order.card_payment_title')}</div>
      
      <div style={{ 
        padding: '16px', 
        border: '2px solid #e5e7eb', 
        borderRadius: '8px', 
        backgroundColor: '#ffffff',
        marginBottom: '16px',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        width: '100%'
      }}>
        <div style={{ width: '100%' }}>
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        Enter your card details above. All payments are processed securely through Stripe.
      </div>

      {processing && (
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          Processing payment...
        </div>
      )}
    </div>
  );
});

// Main component wrapper with Stripe Elements provider
const StripePaymentForm = forwardRef(({ intentId, clientSecret, mode, showConfirmButton = false, onConfirmed }, ref) => {
  const cardFormRef = useRef();

  // Forward ref methods to the inner CardForm
  useImperativeHandle(ref, () => ({
    async confirm() {
      return cardFormRef.current?.confirm();
    },
    isReady() {
      return cardFormRef.current?.isReady();
    }
  }));

  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || !stripePromise) {
    return (
      <div style={{ padding: 16, margin: '16px 0', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>
          Stripe Configuration Missing
        </div>
        <div style={{ color: '#7f1d1d', fontSize: 14, marginTop: 4 }}>
          Please add your Stripe publishable key to the .env file:
          <br />
          <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 3 }}>
            REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardForm 
        ref={cardFormRef}
        intentId={intentId}
        clientSecret={clientSecret}
        onConfirmed={onConfirmed}
      />
    </Elements>
  );
});

export default StripePaymentForm;
