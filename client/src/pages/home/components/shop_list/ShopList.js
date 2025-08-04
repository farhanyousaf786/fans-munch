import React, { useState, useEffect } from 'react';
import { MdLocationOn, MdStadium, MdStairs, MdDoorFront, MdChevronRight } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { stadiumStorage } from '../../../../utils/storage';
import './ShopList.css';

const ShopList = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStadiumIdAndFetchShops();
  }, []);

  // Match Flutter app logic exactly - fetchShopsByStadium
  const loadStadiumIdAndFetchShops = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get selected stadium ID from storage (same as Flutter SharedPreferences)
      const selectedStadium = stadiumStorage.getSelectedStadium();
      console.log('🏟️ Loading shops for stadium:', selectedStadium);
      
      if (selectedStadium && selectedStadium.id) {
        console.log('🔍 Fetching shops for stadium ID:', selectedStadium.id);
        
        // Match Flutter ShopRepository.fetchShopsByStadium exactly
        const shopsRef = collection(db, 'shops');
        const q = query(
          shopsRef,
          where('stadiumId', '==', selectedStadium.id)
        );
        
        const querySnapshot = await getDocs(q);
        console.log('📦 Found shops in Firebase:', querySnapshot.size);
        
        const shops = [];
        querySnapshot.forEach((doc) => {
          try {
            console.log('📄 Processing shop document:', doc.id);
            const data = doc.data();
            console.log('📋 Shop data:', data);
            
            // Create shop object from Firebase data (matching Flutter Shop.fromMap exactly)
            const shop = {
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              location: data.location || '',
              floor: data.floor || '',
              gate: data.gate || '',
              stadiumId: data.stadiumId || '',
              stadiumName: data.stadiumName || '',
              shopUserFcmToken: data.shopUserFcmToken || '',
              admins: data.admins || [],
              createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date()
            };
            
            shops.push(shop);
            console.log('✅ Created shop object:', shop.name);
          } catch (error) {
            console.error('❌ Error processing shop document', doc.id, ':', error);
          }
        });
        
        setShops(shops);
        console.log('✅ Loaded', shops.length, 'shops');
      } else {
        console.log('⚠️ No stadium selected');
        setShops([]);
      }
    } catch (err) {
      console.error('❌ Error loading shops:', err);
      setError('Failed to fetch restaurants');
      setShops([]);
    } finally {
      setLoading(false);
    }
  };



  const handleShopClick = (shop) => {
    // In real app, this would navigate to shop details page
    console.log('Navigate to shop:', shop);
  };

  // Loading state (matching Flutter ShopShimmer)
  if (loading) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">Open Restaurants</h2>
          <button className="see-all-button" disabled>
            <span>See All</span>
            <MdChevronRight className="chevron-icon" />
          </button>
        </div>
        <div className="shop-shimmer">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shop-card-shimmer">
              <div className="shop-image-shimmer"></div>
              <div className="shop-content-shimmer">
                <div className="shop-name-shimmer"></div>
                <div className="shop-description-shimmer"></div>
                <div className="shop-details-shimmer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">Open Restaurants</h2>
          <button className="see-all-button" disabled>
            <span>See All</span>
            <MdChevronRight className="chevron-icon" />
          </button>
        </div>
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={loadStadiumIdAndFetchShops}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state (matching Flutter 'noShopsAvailable')
  if (shops.length === 0) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">Open Restaurants</h2>
          <button className="see-all-button" disabled>
            <span>See All</span>
            <MdChevronRight className="chevron-icon" />
          </button>
        </div>
        <div className="empty-container">
          <p className="empty-text">No shops available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-list">
      {/* Section header matching Flutter app exactly */}
      <div className="section-header">
        <h2 className="section-title">Open Restaurants</h2>
        <button className="see-all-button" onClick={() => console.log('Navigate to all shops')}>
          <span>See All</span>
          <MdChevronRight className="chevron-icon" />
        </button>
      </div>
      
      {/* Vertical list matching Flutter ListView.builder */}
      <div className="shops-vertical-list">
        {shops.map((shop) => (
          <div 
            key={shop.id} 
            className="shop-card-no-image"
            onClick={() => handleShopClick(shop)}
          >
            {/* Shop content matching Flutter card design (no image) */}
            <div className="shop-content">
              <h3 className="shop-name">{shop.name}</h3>
              
              <p className="shop-description">{shop.description}</p>
              
              {/* Stadium info with icon (matching Flutter) */}
              <div className="shop-info-row">
                <MdStadium className="info-icon" />
                <span className="info-text">{shop.stadiumName}</span>
                
                <MdLocationOn className="info-icon" />
                <span className="info-text">{shop.location}</span>
              </div>
              
              {/* Floor and Gate info (matching Flutter) */}
              <div className="shop-info-row">
                <MdStairs className="info-icon" />
                <span className="info-text">Floor {shop.floor}</span>
                
                <MdDoorFront className="info-icon" />
                <span className="info-text">Gate {shop.gate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopList;
