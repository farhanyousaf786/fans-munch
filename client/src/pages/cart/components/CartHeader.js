import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import './CartHeader.css';

const CartHeader = ({ isFromHome = false }) => {
  const navigate = useNavigate();

  return (
    <div className="cart-header">
      {!isFromHome && (
        <button className="back-button" onClick={() => navigate(-1)}>
          <MdArrowBack size={24} />
        </button>
      )}
      <h1 className="cart-title">Cart</h1>
    </div>
  );
};

export default CartHeader;
