import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { OrderStatus } from '../../models/Order';
import QRCode from 'react-qr-code';
import './OrderTrackScreen.css';
import { useTranslation } from '../../i18n/i18n';

const baseSteps = [
  { key: OrderStatus.PENDING, labelKey: 'track.order_received' },
  { key: OrderStatus.PREPARING, labelKey: 'track.preparing' },
  { key: OrderStatus.DELIVERING, labelKey: 'track.on_the_way' },
  { key: OrderStatus.DELIVERED, labelKey: 'track.delivered' }
];

export default function OrderTrackScreen() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setOrder({ id: snap.id, ...snap.data() });
      setLoading(false);
    }, (e) => {
      setError(e?.message || 'Failed to load order');
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  const steps = baseSteps.map(s => ({ ...s, label: t(s.labelKey) }));
  const statusIndex = order ? steps.findIndex(s => s.key === order.status) : -1;
  const code = order?.orderCode || order?.orderId || order?.id || '';

  return (
    <div className="order-track-screen">
      <div className="hero">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="hero-title">{t('track.order')}</div>
        <div className="order-code">{t('track.order')} #{order?.orderId || order?.id}</div>
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
            </div>

            <div className="timeline">
              {steps.map((step, idx) => {
                const active = idx <= statusIndex || (statusIndex === -1 && idx === 0);
                return (
                  <div className={`timeline-item ${active ? 'active' : ''}`} key={step.key}>
                    <div className="dot" />
                    <div className="step-card">
                      <div className="step-title">{step.label}</div>
                      <div className="step-sub">{order?.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="items-section">
              <div className="items-title">{t('track.items')}</div>
              {Array.isArray(order?.cart) && order.cart.length > 0 ? (
                order.cart.map((item, i) => (
                  <div className="item-card" key={i}>
                    <div className="item-left">
                      <div className="thumb" aria-hidden>🥤</div>
                      <div className="meta">
                        <div className="name">{item.name || t('track.item')}</div>
                        <div className="desc">{item.description || ''}</div>
                        <div className="price">${Number(item.price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="qty">{t('track.qty')} {item.quantity || 1}</div>
                  </div>
                ))
              ) : (
                <div className="empty-items">{t('track.no_items')}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
