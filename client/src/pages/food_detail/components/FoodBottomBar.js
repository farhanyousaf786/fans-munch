import React, { useEffect, useRef, useState } from 'react';
import { MdArrowForward, MdArrowBack } from 'react-icons/md';
import './FoodBottomBar.css';
import { useTranslation } from '../../../i18n/i18n';

const FoodBottomBar = ({ onAddToCart }) => {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [trackMetrics, setTrackMetrics] = useState({ max: 0, knob: 44, padding: 16 });
  const { t, lang } = useTranslation();
  const isRTL = lang === 'he';

  // Measure sizes after mount and on resize
  useEffect(() => {
    const measure = () => {
      if (!trackRef.current || !knobRef.current) return;
      const trackWidth = trackRef.current.clientWidth;
      const knobWidth = knobRef.current.clientWidth;
      const style = window.getComputedStyle(trackRef.current);
      const paddingLeft = parseInt(style.paddingLeft || '16', 10);
      const paddingRight = parseInt(style.paddingRight || '16', 10);
      const max = Math.max(0, trackWidth - paddingLeft - paddingRight - knobWidth);
      setTrackMetrics({ max, knob: knobWidth, padding: paddingLeft });
      setDragX(0);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const triggerAdd = () => {
    try { onAddToCart && onAddToCart(); } catch (_) {}
    // Reset after a short delay so the user sees it complete
    setTimeout(() => setDragX(0), 250);
  };

  const onStart = (clientX) => {
    setDragging(true);
    // No-op, movement handled globally
  };

  const onMoveClientX = (clientX) => {
    if (!dragging) return;
    const rect = trackRef.current.getBoundingClientRect();
    // X relative to the start of sliding range
    const x = isRTL
      ? (rect.right - clientX) - trackMetrics.padding - trackMetrics.knob / 2
      : clientX - rect.left - trackMetrics.padding - trackMetrics.knob / 2;
    const clamped = Math.min(Math.max(x, 0), trackMetrics.max);
    setDragX(clamped);
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const percent = trackMetrics.max === 0 ? 0 : dragX / trackMetrics.max;
    if (percent >= 0.7) {
      // Snap to end, trigger, then reset
      setDragX(trackMetrics.max);
      triggerAdd();
    } else {
      setDragX(0);
    }
  };

  // Mouse handlers
  const onMouseDown = (e) => { e.preventDefault(); onStart(e.clientX); };
  const onMouseMove = (e) => onMoveClientX(e.clientX);
  const onMouseUp = () => onEnd();

  // Touch handlers
  const onTouchStart = (e) => { if (!e.touches[0]) return; onStart(e.touches[0].clientX); };
  const onTouchMove = (e) => { if (!e.touches[0]) return; onMoveClientX(e.touches[0].clientX); };
  const onTouchEnd = () => onEnd();

  // Attach global listeners while dragging so the user can move outside the pill
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, dragX, trackMetrics]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerAdd();
    }
  };

  const labelText = isRTL ? t('food.add_to_cart_short') : t('food.swipe_add_to_cart');

  return (
    <div className="food-detail-bottom-bar" dir={isRTL ? 'rtl' : 'ltr'}>
      <div
        ref={trackRef}
        className={`pill-cta swipe-track ${isRTL ? 'rtl' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={labelText}
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <span
          ref={knobRef}
          className="pill-leading swipe-knob"
          style={{ transform: `translateX(${isRTL ? -dragX : dragX}px) translateY(-50%)` }}
        >
          {isRTL ? <MdArrowBack /> : <MdArrowForward />}
        </span>
        <span className="pill-text">{labelText}</span>
      </div>
    </div>
  );
};

export default FoodBottomBar;
