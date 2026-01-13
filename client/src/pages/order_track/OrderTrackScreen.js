import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdArrowBack, MdArrowForward, MdReceiptLong, MdRestaurantMenu, MdLocalShipping, MdCheckCircle, MdPhone } from 'react-icons/md';
import QRCode from 'react-qr-code';
import './OrderTrackScreen.css';
import { useTranslation } from '../../i18n/i18n';
import { formatPriceWithCurrency } from '../../utils/currencyConverter';
import { cartStorage } from '../../utils/storage';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

import { OrderStatus } from '../../models/Order';

const baseSteps = [
  { key: OrderStatus.PENDING, labelKey: 'track.order_received' },
  { key: OrderStatus.PREPARING, labelKey: 'track.preparing' },
  { key: OrderStatus.DELIVERING, labelKey: 'track.on_the_way' },
  { key: OrderStatus.DELIVERED, labelKey: 'track.delivered' }
];

export default function OrderTrackScreen() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const isRTL = lang === 'he';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryUser, setDeliveryUser] = useState(null);
  const [loadingDeliveryUser, setLoadingDeliveryUser] = useState(false);
  const [pickupPoint, setPickupPoint] = useState(null);

  // Ensure page starts at the top after navigating here
  useEffect(() => {
    try { window && window.scrollTo && window.scrollTo({ top: 0, behavior: 'auto' }); } catch (_) {}
  }, [orderId]);

  // Handle back button - clear cart and go to home
  const handleBackButton = useCallback(() => {
    try {
      // Clear cart to prevent accidental re-ordering
      cartStorage.clearCart();
      console.log('🛒 Cart cleared after order completion');
    } catch (e) {
      console.warn('Failed to clear cart:', e);
    }
    // Navigate to home page, not back to order confirmation
    navigate('/home', { replace: true });
  }, [navigate]);

  // Prevent browser back button from going to order confirmation
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      handleBackButton();
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleBackButton]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    const ref = doc(db, 'orders', orderId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setError('Order not found');
        setOrder(null);
        setLoading(false);
        return;
      }
      setError('');
      const orderData = { id: snap.id, ...snap.data() };
      setOrder(orderData);
      setLoading(false);
      
      // Fetch delivery user info if order is delivering and has deliveryUserId
      console.log('Order status:', orderData.status, 'DELIVERING constant:', OrderStatus.DELIVERING);
      console.log('DeliveryUserId:', orderData.deliveryUserId);
      if (orderData.status === OrderStatus.DELIVERING && orderData.deliveryUserId) {
        fetchDeliveryUser(orderData.deliveryUserId);
      } else {
        setDeliveryUser(null);
      }
    }, (e) => {
      setError(e?.message || 'Failed to load order');
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  // Fetch pickup point details if it's a pickup order
  useEffect(() => {
    const fetchPickupPoint = async () => {
      if (order?.deliveryMethod === 'pickup' && order?.stadiumId && order?.pickupPointId) {
        try {
          const pointRef = doc(db, 'stadiums', order.stadiumId, 'pickUpPoints', order.pickupPointId);
          const pointSnap = await getDoc(pointRef);
          if (pointSnap.exists()) {
            setPickupPoint({ id: pointSnap.id, ...pointSnap.data() });
          } else {
            console.warn('Pickup point not found:', order.pickupPointId);
          }
        } catch (e) {
          console.error('Error fetching pickup point:', e);
        }
      } else {
        setPickupPoint(null);
      }
    };
    fetchPickupPoint();
  }, [order?.deliveryMethod, order?.stadiumId, order?.pickupPointId]);

  // Fetch delivery user details from deliveryUsers collection
  const fetchDeliveryUser = async (deliveryUserId) => {
    if (!deliveryUserId) return;
    
    setLoadingDeliveryUser(true);
    try {
      const deliveryUserRef = doc(db, 'deliveryUsers', deliveryUserId);
      const deliveryUserSnap = await getDoc(deliveryUserRef);
      
      if (deliveryUserSnap.exists()) {
        const userData = { id: deliveryUserSnap.id, ...deliveryUserSnap.data() };
        console.log('Delivery user data:', userData);
        setDeliveryUser(userData);
      } else {
        console.warn('Delivery user not found:', deliveryUserId);
        setDeliveryUser(null);
      }
    } catch (error) {
      console.error('Error fetching delivery user:', error);
      setDeliveryUser(null);
    } finally {
      setLoadingDeliveryUser(false);
    }
  };

  const iconFor = (key) => {
    switch (key) {
      case OrderStatus.PENDING: return <MdReceiptLong />;
      case OrderStatus.PREPARING: return <MdRestaurantMenu />;
      case OrderStatus.DELIVERING: return <MdLocalShipping />;
      case OrderStatus.DELIVERED: return <MdCheckCircle />;
      default: return <MdReceiptLong />;
    }
  };

  const steps = baseSteps.map(s => {
    let labelKey = s.labelKey;
    if (order?.deliveryMethod === 'pickup') {
      if (s.key === OrderStatus.DELIVERING) labelKey = 'track.ready_to_pick_up';
      if (s.key === OrderStatus.DELIVERED) labelKey = 'track.picked_up';
    }
    return { ...s, label: t(labelKey), icon: iconFor(s.key) };
  });
  const statusIndex = order ? steps.findIndex(s => s.key === order.status) : -1;
  const code = order?.orderCode || order?.orderId || order?.id || '';

  return (
    <div className="order-track-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="hero">
        <button className="back-btn" aria-label={t('common.back')} onClick={handleBackButton}>
          {isRTL ? <MdArrowForward /> : <MdArrowBack />}
        </button>
        <div className="hero-title">{t('track.order')}</div>
        <div className="order-code">#{order?.orderId || order?.id}</div>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">{t('track.loading')}</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <>
            <div className="qr-card">
              {code ? (
                <div className="qr-wrap">
                  <QRCode value={String(code)} size={140} />
                </div>
              ) : (
                <div className="qr-placeholder">{t('track.no_code')}</div>
              )}
              <div className="qr-hint"><strong>{t('track.present_qr')}</strong></div>
            </div>

            <div className="timeline">
              {steps.map((step, idx) => {
                const active = idx <= statusIndex || (statusIndex === -1 && idx === 0);
                const current = idx === statusIndex || (statusIndex === -1 && idx === 0);
                const done = idx < statusIndex; // fully completed segments
                const hasNext = idx < steps.length - 1;
                return (
                  <div className={`timeline-item ${active ? 'active' : ''} ${current ? 'current' : ''} ${done ? 'done' : ''} ${hasNext ? 'has-next' : ''}`} key={step.key}>
                    <div className="dot" />
                    <div className="step-card">
                      <div className="step-row">
                        <span className={`step-icon ${active ? 'on' : ''} ${current ? 'glow' : ''}`}>{step.icon}</span>
                        <div className="step-text">
                          <div className="step-title">{step.label}</div>
                          <div className="step-sub">{order?.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pickup Point Information */}
            {order?.deliveryMethod === 'pickup' && pickupPoint && (
              <div className="pickup-point-section">
                <div className="pickup-point-title">
                  <span className="icon">📍</span>
                  {t('track.pick_spot')}
                </div>
                <div className="pickup-point-card">
                  <div className="pickup-name">{pickupPoint.name}</div>
                  {pickupPoint.location && <div className="pickup-location">{pickupPoint.location}</div>}
                  {pickupPoint.description && <div className="pickup-description">{pickupPoint.description}</div>}
                  {pickupPoint.area && <div className="pickup-area">{pickupPoint.area}</div>}
                </div>
              </div>
            )}

            {/* Delivery Contact Information */}
            {order?.status === OrderStatus.DELIVERING && (
              <div className="delivery-contact-section">
                <div className="delivery-contact-title">
                  <MdPhone className="phone-icon" />
                  {t('track.delivery_contact')}
                </div>
                {loadingDeliveryUser ? (
                  <div className="delivery-contact-loading">{t('track.loading_contact')}</div>
                ) : (console.log('Delivery user in render:', deliveryUser, 'Phone:', deliveryUser?.phone), deliveryUser?.phone) ? (
                  <div className="delivery-contact-card">
                    <div className="delivery-contact-info">
                      <div className="delivery-person-name">
                        {deliveryUser.name || t('track.delivery_person')}
                      </div>
                      <a href={`tel:${deliveryUser.phone}`} className="delivery-phone-link">
                        <MdPhone className="phone-icon-small" />
                        {deliveryUser.phone}
                      </a>
                    </div>
                  </div>
                ) : order?.deliveryUserId ? (
                  <div className="delivery-contact-unavailable">
                    {t('track.contact_unavailable')}
                  </div>
                ) : null}
              </div>
            )}

            <div className="items-section">
              <div className="items-title">{t('track.items')}</div>
              {Array.isArray(order?.cart) && order.cart.length > 0 ? (
                order.cart.map((item, i) => (
                  <div className="item-card modern" key={i}>
                    <div className="item-main">
                      <div className="item-top">
                        <span className="qty-pill">{t('track.qty')} {item.quantity || 1}</span>
                        <div className="name">{item.name || t('track.item')}</div>
                      </div>
                      <div className="desc clamp-2">{item.description || ''}</div>
                      <div className="price ils">{formatPriceWithCurrency(item.price, item.currency || 'ILS')}</div>
                    </div>
                    <div className="item-media">
                      {Array.isArray(item.images) && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.name || 'item'} onError={(e)=>{ e.currentTarget.style.display='none'; }} />
                      ) : (
                        <div className="thumb" aria-hidden>🥤</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-items">{t('track.no_items')}</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA when the order is on the way */}
      {order && order.status === OrderStatus.DELIVERING && (
        <div className="footer-cta">
          <button className="cta-button" type="button">Show this screen to the delivery person</button>
        </div>
      )}
    </div>
  );
}
