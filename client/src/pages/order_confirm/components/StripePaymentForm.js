import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { showToast } from '../../../components/toast/ToastContainer';
import { useTranslation } from '../../../i18n/i18n';
import { buildPaymentRequest } from '../../../utils/stripePaymentRequest';

// Debug logging for environment variable (remove after testing)
console.log('[DEBUG] REACT_APP_STRIPE_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Initialize Stripe - only if publishable key is available
const stripePromise = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
  : null;

// Card form component that uses Stripe Elements and Payment Request (Apple/Google Pay)
const CardForm = forwardRef(({ intentId, clientSecret, onConfirmed, totalAmount, currency = 'ils', isFormValid = true, onWalletPaymentSuccess }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const { t } = useTranslation();

  // Debug logging
  console.log('[DEBUG] CardForm - stripe:', !!stripe, 'elements:', !!elements);

  // Try to build a payment request (Apple Pay / Google Pay)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        console.log('[DEBUG] Payment Request - stripe:', !!stripe, 'clientSecret:', !!clientSecret, 'totalAmount:', totalAmount);
        if (!stripe || !clientSecret || !totalAmount) {
          console.log('[DEBUG] Payment Request - missing requirements, skipping');
          return;
        }
        console.log('[DEBUG] Building payment request with amount:', totalAmount, 'currency:', currency);
        const pr = await buildPaymentRequest(stripe, {
          amount: totalAmount,
          currency,
          label: 'Fan Munch Order',
        });
        console.log('[DEBUG] Payment Request result:', !!pr);
        if (!active || !pr) return;
        pr.on('paymentmethod', async (ev) => {
          try {
            console.log('[STRIPE WALLET] Payment method selected:', {
              type: ev.paymentMethod.type,
              id: ev.paymentMethod.id,
              card: ev.paymentMethod.card
            });
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
              payment_method: ev.paymentMethod.id,
            });
            console.log('[STRIPE WALLET] Payment confirmation response:', {
              error: error ? {
                type: error.type,
                code: error.code,
                message: error.message,
                decline_code: error.decline_code
              } : null,
              paymentIntent: paymentIntent ? {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
              } : null
            });
            if (error) {
              ev.complete('fail');
              showToast(`${t('order.payment_failed_generic')} ${error.message || ''}`.trim(), 'error', 4000);
            } else if (paymentIntent?.status === 'succeeded') {
              ev.complete('success');
              showToast(t('order.processing_full'), 'success', 2500);
              if (onWalletPaymentSuccess) {
                try {
                  await onWalletPaymentSuccess();
                } catch (orderError) {
                  const errorMsg = orderError?.message || t('order.unknown_error');
                  // If it's a validation error from the screen, show only that message without the wallet prefix
                  if (orderError && orderError.code === 'VALIDATION') {
                    showToast(errorMsg, 'error', 8000);
                  } else {
                    showToast(`${t('order.wallet_payment_succeeded_order_failed_prefix')} ${errorMsg}. ${t('order.contact_support')}`, 'error', 8000);
                  }
                }
              }
              onConfirmed && onConfirmed({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
            } else if (paymentIntent?.status === 'requires_action') {
              ev.complete('success');
              showToast(t('order.additional_auth_required'), 'info', 3500);
            } else {
              ev.complete('fail');
              showToast(`${t('order.payment_status')}: ${paymentIntent?.status || t('order.unknown')}`, 'warning', 3000);
            }
          } catch (err) {
            console.error('[STRIPE WALLET] Payment error:', err);
            ev.complete('fail');
            showToast(`${t('order.payment_error')}: ${err.message}`, 'error', 4000);
          }
        });
        setPaymentRequest(pr);
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [stripe, clientSecret, totalAmount, currency, onWalletPaymentSuccess, onConfirmed]);

  const handleConfirm = async () => {
    if (!stripe || !elements || !clientSecret) {
      showToast('Stripe not ready or missing payment intent', 'error', 3000);
      return { ok: false, error: 'Stripe not ready' };
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      console.log('[STRIPE CARD] Attempting payment confirmation with clientSecret:', clientSecret?.substring(0, 20) + '...');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });
      
      console.log('[STRIPE CARD] Payment confirmation response:', {
        error: error ? {
          type: error.type,
          code: error.code,
          message: error.message,
          decline_code: error.decline_code
        } : null,
        paymentIntent: paymentIntent ? {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          charges: paymentIntent.charges?.data?.map(charge => ({
            id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status,
            outcome: charge.outcome,
            fee_details: charge.fee_details
          }))
        } : null
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
      {paymentRequest && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ opacity: isFormValid ? 1 : 0.5, pointerEvents: isFormValid ? 'auto' : 'none' }}>
            <PaymentRequestButtonElement options={{ paymentRequest }} />
          </div>
          {!isFormValid && (
            <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4, marginBottom: 8 }}>
              Please fill in all required fields to use Apple Pay/Google Pay
            </div>
          )}
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Or pay with card</div>
        </div>
      )}
      
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
const StripePaymentForm = forwardRef(({ intentId, clientSecret, mode, showConfirmButton = false, onConfirmed, totalAmount, currency = 'ils', isFormValid = true, onWalletPaymentSuccess }, ref) => {
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
        totalAmount={totalAmount}
        currency={currency}
        onConfirmed={onConfirmed}
        isFormValid={isFormValid}
        onWalletPaymentSuccess={onWalletPaymentSuccess}
      />
    </Elements>
  );
});

export default StripePaymentForm;
