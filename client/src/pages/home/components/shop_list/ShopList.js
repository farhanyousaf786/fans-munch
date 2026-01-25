import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdLocationOn, MdAccessTime } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { stadiumStorage } from '../../../../utils/storage';
import './ShopList.css';
import { useTranslation } from '../../../../i18n/i18n';
import AlertModal from '../../../../components/common/AlertModal';

// Single uniform image for all shops to ensure consistency
const uniformShopImage = process.env.PUBLIC_URL + '/assets/images/on-boarding-2.png';

// Use the same image for all shops to create uniform appearance
function getUniformShopImage() {
  return uniformShopImage;
}

// Sample data for shops with food items
const sampleShops = [
  {
    id: '1',
    name: 'Burger King',
    description: 'American • Burger • Fast Food',
    rating: 4.5,
    reviewCount: 124,
    deliveryTime: '15-20 min',
    image: uniformShopImage,
    items: ['Burgers', 'Fries', 'Chicken', 'Drinks']
  },
  {
    id: '2',
    name: 'Pizza Hut',
    description: 'Italian • Pizza • Pasta',
    rating: 4.2,
    reviewCount: 89,
    deliveryTime: '20-25 min',
    image: uniformShopImage,
    items: ['Pizza', 'Pasta', 'Garlic Bread', 'Desserts']
  },
  {
    id: '3',
    name: 'Subway',
    description: 'American • Sandwich • Healthy',
    rating: 4.0,
    reviewCount: 67,
    deliveryTime: '10-15 min',
    image: uniformShopImage,
    items: ['Subs', 'Salads', 'Cookies', 'Drinks']
  }
];

const ShopList = ({ onShopSelect }) => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          // Removed shopAvailability == true to show closed shops as well
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
              image: data.imageUrl || data.image || null,
              shopAvailability: data.shopAvailability !== undefined ? data.shopAvailability : true, // Added availability status
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
      setError(t('home.error_fetch_shops'));
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShopClick = (shop) => {
    if (shop.shopAvailability === false) {
      setIsAlertOpen(true);
      return;
    }
    // Navigate to dedicated Shop Menu page
    navigate(`/shop-menu/${shop.id}`);
  };

  // Loading state (matching Flutter ShopShimmer)
  if (loading) {
    return (
      <div className="shop-list">
        <div className="section-header">
          <h2 className="section-title">{t('home.shops')}</h2>
         
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
          <h2 className="section-title">{t('home.shops')}</h2>
          
        </div>
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={loadStadiumIdAndFetchShops}>
            {t('home.retry')}
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
          <h2 className="section-title">{t('home.shops')}</h2>
         
        </div>
        <div className="empty-container">
          <p className="empty-text">{t('home.no_shops')}</p>
        </div>
      </div>
    );
  }

  // Use sample data for now
  const displayShops = shops.length > 0 ? shops : sampleShops;
  
  // Ensure items array exists for each shop
  const safeShops = displayShops.map(shop => ({
    ...shop,
    items: Array.isArray(shop.items) ? shop.items : []
  }));

  return (
    <div className="shop-list">
      <div className="section-header">
        <h2 className="section-title">{t('home.shops')}</h2>
        
      </div>
      
      <div className="restaurant-list">
        {safeShops.map((shop) => (
          <div 
            key={shop.id} 
            className={`restaurant-card ${shop.shopAvailability === false ? 'is-closed' : ''}`}
            onClick={() => handleShopClick(shop)}
          >
            <div className="restaurant-image">
              <img 
                src={shop.image || getUniformShopImage()} 
                alt={shop.name}
                onError={(e) => {
                  e.currentTarget.src = getUniformShopImage();
                }}
              />
              {shop.shopAvailability === false && (
                <div className="closed-overlay">
                  <span className="closed-tag">{t('home.closed')}</span>
                </div>
              )}
            </div>
            <div className="restaurant-details">
              <div className="restaurant-header">
                <h3 className="restaurant-name">{shop.name}</h3>
                {shop.shopAvailability === false && (
                  <span className="closed-label">{t('home.closed')}</span>
                )}
              </div>
              <p className="restaurant-description">{shop.description}</p>
              <div className="restaurant-footer">
                <div className="food-items">
                  {shop.items.slice(0, 2).map((item, index) => (
                    <span key={index} className="food-tag">{item}</span>
                  ))}
                  {shop.items.length > 2 && (
                    <span className="food-tag more">+{shop.items.length - 2} {t('home.more_suffix')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertModal 
        isOpen={isAlertOpen}
        title={t('home.closed')}
        message={t('home.shop_closed_msg')}
        type="warning"
        onClose={() => setIsAlertOpen(false)}
      />
    </div>
  );
};

export default ShopList;
