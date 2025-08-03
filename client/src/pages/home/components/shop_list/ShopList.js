import React, { useState, useEffect } from 'react';
import { MdStar, MdAccessTime, MdDeliveryDining, MdLocationOn } from 'react-icons/md';
import restaurantRepository from '../../../../repositories/restaurantRepository';
import { stadiumStorage } from '../../../../utils/storage';
import './ShopList.css';

const ShopList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get selected stadium to filter restaurants if needed
      const selectedStadium = stadiumStorage.getSelectedStadium();
      
      let result;
      if (selectedStadium && selectedStadium.id) {
        // Fetch restaurants for specific stadium
        result = await restaurantRepository.getRestaurantsByStadium(selectedStadium.id);
      } else {
        // Fetch all restaurants
        result = await restaurantRepository.getAllRestaurants();
      }
      
      if (result.success) {
        setShops(result.restaurants);
      } else {
        setError(result.error || 'Failed to load restaurants');
        // Fallback to mock data if Firebase fails
        setShops(getMockRestaurants());
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants');
      // Fallback to mock data
      setShops(getMockRestaurants());
    } finally {
      setLoading(false);
    }
  };

  // Fallback mock data for development/demo
  const getMockRestaurants = () => [
    {
      id: '1',
      name: "Tony's Pizza Corner",
      description: "Authentic Italian pizza made with fresh ingredients",
      rating: 4.8,
      reviewCount: 245,
      deliveryTime: "15-25 min",
      deliveryFee: 2.99,
      minOrder: 15,
      image: "/api/placeholder/300/200",
      cuisine: ["Italian", "Pizza"],
      isOpen: true,
      location: "Section A, Level 2"
    },
    {
      id: '2',
      name: "Stadium Burgers",
      description: "Juicy burgers and crispy fries for the perfect game day meal",
      rating: 4.6,
      reviewCount: 189,
      deliveryTime: "10-20 min",
      deliveryFee: 1.99,
      minOrder: 12,
      image: "/api/placeholder/300/200",
      cuisine: ["American", "Burgers"],
      isOpen: true,
      location: "Section B, Level 1"
    },
    {
      id: '3',
      name: "Wings & Things",
      description: "Spicy wings and comfort food favorites",
      rating: 4.7,
      reviewCount: 156,
      deliveryTime: "12-22 min",
      deliveryFee: 2.49,
      minOrder: 18,
      image: "/api/placeholder/300/200",
      cuisine: ["American", "Wings"],
      isOpen: false,
      location: "Section C, Level 1"
    }
  ];

  const handleShopClick = (shop) => {
    // In real app, this would navigate to shop details page
    console.log('Navigate to shop:', shop);
  };

  // Loading state
  if (loading) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">Restaurants & Shops</h2>
          <p className="section-subtitle">Loading restaurants...</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Fetching restaurants from Firebase...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && shops.length === 0) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">Restaurants & Shops</h2>
          <p className="section-subtitle">Unable to load restaurants</p>
        </div>
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={fetchRestaurants}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-list">
      <div className="section-header">
        <h2 className="section-title">Restaurants & Shops</h2>
        <p className="section-subtitle">
          {error ? 'Showing demo data (Firebase connection failed)' : 'Discover all available food vendors'}
        </p>
      </div>
      
      <div className="shops-grid">
        {shops.map((shop) => (
          <div 
            key={shop.id} 
            className={`shop-card ${!shop.isOpen ? 'closed' : ''}`}
            onClick={() => handleShopClick(shop)}
          >
            <div className="shop-image">
              <img src={shop.image} alt={shop.name} />
              {!shop.isOpen && (
                <div className="closed-overlay">
                  <span className="closed-text">Currently Closed</span>
                </div>
              )}
            </div>
            
            <div className="shop-content">
              <div className="shop-header">
                <h3 className="shop-name">{shop.name}</h3>
                <div className="rating-section">
                  <MdStar className="rating-star" />
                  <span className="rating-value">{shop.rating}</span>
                  <span className="review-count">({shop.reviewCount})</span>
                </div>
              </div>
              
              <p className="shop-description">{shop.description}</p>
              
              <div className="cuisine-tags">
                {shop.cuisine.map((cuisine, index) => (
                  <span key={index} className="cuisine-tag">
                    {cuisine}
                  </span>
                ))}
              </div>
              
              <div className="shop-location">
                <MdLocationOn className="location-icon" />
                <span>{shop.location}</span>
              </div>
              
              <div className="shop-meta">
                <div className="delivery-info">
                  <div className="delivery-time">
                    <MdAccessTime className="time-icon" />
                    <span>{shop.deliveryTime}</span>
                  </div>
                  
                  <div className="delivery-fee">
                    <MdDeliveryDining className="delivery-icon" />
                    <span>
                      {shop.deliveryFee === 0 ? 'Free delivery' : `$${shop.deliveryFee.toFixed(2)} delivery`}
                    </span>
                  </div>
                </div>
                
                <div className="min-order">
                  Min. order: ${shop.minOrder}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopList;
