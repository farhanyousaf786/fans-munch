import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import './CartHeader.css';

const CartHeader = ({ isFromHome = false }) => {
  const navigate = useNavigate();

  // Use a public asset to avoid import issues and ensure deployment works
  const bgUrl = process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png';

  return (
    <div className="cart-hero" style={{ backgroundImage: `url(${bgUrl})` }}>
      {!isFromHome && (
        <button className="cart-back-button" onClick={() => navigate(-1)} aria-label="Back">
          <MdArrowBack />
        </button>
      )}
      <div className="cart-hero-overlay" />
      <h1 className="cart-hero-title">Add to Cart</h1>
    </div>
  );
};

export default CartHeader;
