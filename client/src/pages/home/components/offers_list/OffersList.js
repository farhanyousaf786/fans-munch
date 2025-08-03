import React from 'react';
import { MdLocalOffer, MdAccessTime } from 'react-icons/md';
import './OffersList.css';

const OffersList = () => {
  // Mock offers data - in real app, this would come from Firebase/API
  const offers = [
    {
      id: 1,
      title: "20% Off Pizza",
      description: "Get 20% off on all pizza orders above $25",
      restaurant: "Tony's Pizza Corner",
      discount: "20%",
      validUntil: "2 days left",
      image: "/api/placeholder/300/150",
      backgroundColor: "#FF6B6B"
    },
    {
      id: 2,
      title: "Buy 1 Get 1 Free",
      description: "Buy any burger and get another one free",
      restaurant: "Stadium Burgers",
      discount: "BOGO",
      validUntil: "5 days left",
      image: "/api/placeholder/300/150",
      backgroundColor: "#4ECDC4"
    },
    {
      id: 3,
      title: "Free Delivery",
      description: "Free delivery on orders above $30",
      restaurant: "All Restaurants",
      discount: "FREE",
      validUntil: "1 week left",
      image: "/api/placeholder/300/150",
      backgroundColor: "#45B7D1"
    }
  ];

  return (
    <div className="offers-list">
      <div className="section-header">
        <h2 className="section-title">Special Offers</h2>
        <p className="section-subtitle">Don't miss out on these amazing deals!</p>
      </div>
      
      <div className="offers-container">
        {offers.map((offer) => (
          <div 
            key={offer.id} 
            className="offer-card"
            style={{ backgroundColor: offer.backgroundColor }}
          >
            <div className="offer-content">
              <div className="offer-badge">
                <MdLocalOffer className="offer-icon" />
                <span className="discount-text">{offer.discount}</span>
              </div>
              
              <div className="offer-details">
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-description">{offer.description}</p>
                <p className="offer-restaurant">{offer.restaurant}</p>
                
                <div className="offer-validity">
                  <MdAccessTime className="time-icon" />
                  <span className="validity-text">{offer.validUntil}</span>
                </div>
              </div>
            </div>
            
            <button className="claim-offer-btn">
              Claim Offer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersList;
