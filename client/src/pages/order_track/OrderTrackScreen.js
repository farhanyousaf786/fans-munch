import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { OrderStatus } from '../../models/Order';
import QRCode from 'react-qr-code';
import './OrderTrackScreen.css';

const steps = [
  { key: OrderStatus.PENDING, label: 'Order Received' },
  { key: OrderStatus.PREPARING, label: 'Preparing' },
  { key: OrderStatus.DELIVERING, label: 'On the way' },
  { key: OrderStatus.DELIVERED, label: 'Delivered' }
];

export default function OrderTrackScreen() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, 'orders', orderId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError('Order not found');
          return;
        }
        const data = snap.data();
        setOrder({ id: snap.id, ...data });
      } catch (e) {
        setError(e?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) load();
  }, [orderId]);

  const statusIndex = order ? steps.findIndex(s => s.key === order.status) : -1;
  const code = order?.orderCode || order?.orderId || order?.id || '';

  return (
    <div className="order-track-screen">
      <div className="hero">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="hero-title">Order</div>
        <div className="order-code">Order #{order?.orderId || order?.id}</div>
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">Loading…</div>
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
                <div className="qr-placeholder">No code</div>
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
              <div className="items-title">Items</div>
              {Array.isArray(order?.cart) && order.cart.length > 0 ? (
                order.cart.map((item, i) => (
                  <div className="item-card" key={i}>
                    <div className="item-left">
                      <div className="thumb" aria-hidden>🥤</div>
                      <div className="meta">
                        <div className="name">{item.name || 'Item'}</div>
                        <div className="desc">{item.description || ''}</div>
                        <div className="price">${Number(item.price || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="qty">Qty {item.quantity || 1}</div>
                  </div>
                ))
              ) : (
                <div className="empty-items">No items</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
