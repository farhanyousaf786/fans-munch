import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Elements, PaymentElement, PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { showToast } from '../../../components/toast/ToastContainer';
import { useTranslation } from '../../../i18n/i18n';
import { buildPaymentRequest } from '../../../utils/stripePaymentRequest';
import { useAppConfig } from '../../../contexts/AppConfigContext';
import { STRIPE_TEST_PAYMENT_METHOD } from '../utils/testModeDefaults';

const TestModeCardForm = forwardRef(({ clientSecret, onConfirmed }, ref) => {
  const stripe = useStripe();
  const [processing, setProcessing] = useState(false);
  const { t } = useTranslation();

  const handleConfirm = async () => {
    if (!stripe || !clientSecret) {
      showToast('Stripe not ready or missing payment intent', 'error', 3000);
      return { ok: false, error: 'Stripe not ready' };
    }

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: STRIPE_TEST_PAYMENT_METHOD,
      });

      if (error) {
        showToast(`Payment failed: ${error.message}`, 'error', 4000);
        return { ok: false, error: error.message, status: 'FAILED' };
      }

      if (paymentIntent.status === 'succeeded') {
        showToast(t('order.test_payment_success'), 'success', 2500);
        onConfirmed && onConfirmed({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
        return { ok: true, status: 'SUCCEEDED', intentId: paymentIntent.id };
      }

      showToast(`Payment status: ${paymentIntent.status}`, 'warning', 3000);
      return { ok: false, status: paymentIntent.status, intentId: paymentIntent.id };
    } catch (err) {
      showToast(`Payment error: ${err.message}`, 'error', 4000);
      return { ok: false, error: err.message, status: 'ERROR' };
    } finally {
      setProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    async confirm() {
      return handleConfirm();
    },
    isReady() {
      return Boolean(stripe && clientSecret);
    },
  }));

  return (
    <div style={{ padding: 16, margin: '16px 0', border: '1px solid #fcd34d', borderRadius: 8, background: '#fffbeb' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400e' }}>
        {t('order.test_mode_payment_title')}
      </div>
      <div style={{ fontSize: 14, color: '#78350f', marginBottom: 8 }}>
        {t('order.test_mode_payment_desc')}
      </div>
      <div style={{
        padding: '12px 14px',
        border: '2px solid #fde68a',
        borderRadius: 8,
        background: '#ffffff',
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#374151',
      }}>
        {t('order.test_mode_card_preview')}
      </div>
      {processing && (
        <div style={{ fontSize: 14, color: '#92400e', textAlign: 'center', marginTop: 12 }}>
          {t('order.test_mode_processing')}
        </div>
      )}
    </div>
  );
});

const CardForm = forwardRef(({ clientSecret, onConfirmed, totalAmount, currency = 'ils', onWalletPaymentSuccess, validateBeforeWalletPay }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [elementReady, setElementReady] = useState(false);
  const { t } = useTranslation();

  const clientSecretRef = useRef(clientSecret);
  const validateRef = useRef(validateBeforeWalletPay);
  const onWalletSuccessRef = useRef(onWalletPaymentSuccess);
  const onConfirmedRef = useRef(onConfirmed);
  const tRef = useRef(t);

  useEffect(() => { clientSecretRef.current = clientSecret; }, [clientSecret]);
  useEffect(() => { validateRef.current = validateBeforeWalletPay; }, [validateBeforeWalletPay]);
  useEffect(() => { onWalletSuccessRef.current = onWalletPaymentSuccess; }, [onWalletPaymentSuccess]);
  useEffect(() => { onConfirmedRef.current = onConfirmed; }, [onConfirmed]);
  useEffect(() => { tRef.current = t; }, [t]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!stripe || !totalAmount) return;
        const pr = await buildPaymentRequest(stripe, {
          amount: totalAmount,
          currency,
          label: 'Fan Munch Order',
        });
        if (!active || !pr) return;
        pr.on('paymentmethod', async (ev) => {
          try {
            const currentClientSecret = clientSecretRef.current;
            const currentValidate = validateRef.current;
            const currentOnWalletSuccess = onWalletSuccessRef.current;
            const currentOnConfirmed = onConfirmedRef.current;
            const currentT = tRef.current;

            if (typeof currentValidate === 'function') {
              const ok = await currentValidate();
              if (!ok) {
                ev.complete('fail');
                return;
              }
            }

            if (!currentClientSecret) {
              ev.complete('fail');
              showToast('Payment not ready yet. Please wait a moment and try again.', 'error', 3000);
              return;
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(currentClientSecret, {
              payment_method: ev.paymentMethod.id,
            });

            if (error) {
              ev.complete('fail');
              showToast(error.message || currentT('order.payment_failed'), 'error', 5000);
            } else if (paymentIntent?.status === 'succeeded') {
              ev.complete('success');
              if (typeof currentOnWalletSuccess === 'function') {
                try {
                  await currentOnWalletSuccess({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
                } catch (orderErr) {
                  showToast(`${currentT('order.wallet_payment_succeeded_order_failed_prefix')} ${orderErr.message}. ${currentT('order.contact_support')}`, 'error', 8000);
                }
              }
              currentOnConfirmed && currentOnConfirmed({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
            } else {
              ev.complete('fail');
              showToast(`${currentT('order.payment_status')}: ${paymentIntent?.status || currentT('order.unknown')}`, 'warning', 3000);
            }
          } catch (err) {
            ev.complete('fail');
            showToast(`${tRef.current('order.payment_error')}: ${err.message}`, 'error', 4000);
          }
        });
        setPaymentRequest(pr);
      } catch (_) {}
    })();
    return () => { active = false; };
  }, [stripe, totalAmount, currency]);

  const handleConfirm = async () => {
    if (!stripe || !elements || !clientSecret) {
      showToast('Stripe not ready or missing payment intent', 'error', 3000);
      return { ok: false, error: 'Stripe not ready' };
    }

    setProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirm`,
        },
        redirect: 'if_required',
      });

      if (error) {
        showToast(`Payment failed: ${error.message}`, 'error', 4000);
        return { ok: false, error: error.message, status: 'FAILED' };
      }

      if (paymentIntent?.status === 'succeeded') {
        showToast('Payment successful!', 'success', 2500);
        onConfirmed && onConfirmed({ intentId: paymentIntent.id, status: 'SUCCEEDED' });
        return { ok: true, status: 'SUCCEEDED', intentId: paymentIntent.id };
      }

      if (paymentIntent?.status === 'requires_action') {
        showToast('Additional authentication required', 'info', 3500);
        return { ok: false, status: 'REQUIRES_ACTION', intentId: paymentIntent.id };
      }

      showToast(`Payment status: ${paymentIntent?.status || 'unknown'}`, 'warning', 3000);
      return { ok: false, status: paymentIntent?.status, intentId: paymentIntent?.id };
    } catch (err) {
      showToast(`Payment error: ${err.message}`, 'error', 4000);
      return { ok: false, error: err.message, status: 'ERROR' };
    } finally {
      setProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    async confirm() {
      return await handleConfirm();
    },
    isReady() {
      return Boolean(stripe && elements && clientSecret && elementReady);
    }
  }));

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
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'default',
                  theme: 'dark',
                  height: '48px',
                },
              },
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, fontWeight: 'bold' }}>
            Or pay with card / Link
          </div>
        </div>
      )}

      <div style={{
        padding: '12px 14px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        marginBottom: '8px',
        width: '100%'
      }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
          onReady={() => setElementReady(true)}
        />
      </div>

      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
        Cards, Link, Apple Pay and Google Pay are supported when available on your device.
      </div>

      {processing && (
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
          Processing payment...
        </div>
      )}
    </div>
  );
});

const StripePaymentForm = forwardRef(({ intentId, clientSecret, onConfirmed, totalAmount, currency = 'ils', isFormValid = true, onWalletPaymentSuccess, validateBeforeWalletPay }, ref) => {
  const cardFormRef = useRef();
  const { t } = useTranslation();
  const { loading, stripePromise, paymentMode, useTestApis, keysConfigured, configMessage } = useAppConfig();

  useImperativeHandle(ref, () => ({
    async confirm() {
      return cardFormRef.current?.confirm();
    },
    isReady() {
      return cardFormRef.current?.isReady();
    }
  }));

  if (loading) {
    return (
      <div style={{ padding: 16, margin: '16px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', padding: '20px' }}>
          Loading payment configuration...
        </div>
      </div>
    );
  }

  if (!stripePromise || !keysConfigured) {
    return (
      <div style={{ padding: 16, margin: '16px 0', border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2' }}>
        <div style={{ color: '#dc2626', fontWeight: 600 }}>
          Stripe Configuration Missing
        </div>
        <div style={{ color: '#7f1d1d', fontSize: 14, marginTop: 4 }}>
          {configMessage || t('order.live_keys_missing')}
        </div>
      </div>
    );
  }

  if (!clientSecret && !useTestApis) {
    return (
      <div style={{ padding: 16, margin: '16px 0', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <div style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', padding: '20px' }}>
          Preparing secure payment...
        </div>
      </div>
    );
  }

  const elementsOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe' } }
    : undefined;

  return (
    <Elements stripe={stripePromise} options={elementsOptions} key={`${paymentMode}-${clientSecret || 'none'}`}>
      {useTestApis ? (
        <TestModeCardForm
          ref={cardFormRef}
          clientSecret={clientSecret}
          onConfirmed={onConfirmed}
        />
      ) : (
        <CardForm
          ref={cardFormRef}
          intentId={intentId}
          clientSecret={clientSecret}
          totalAmount={totalAmount}
          currency={currency}
          onConfirmed={onConfirmed}
          isFormValid={isFormValid}
          onWalletPaymentSuccess={onWalletPaymentSuccess}
          validateBeforeWalletPay={validateBeforeWalletPay}
        />
      )}
    </Elements>
  );
});

export default StripePaymentForm;
