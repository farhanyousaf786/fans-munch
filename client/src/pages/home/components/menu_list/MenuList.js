import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccessTime } from 'react-icons/md';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import { stadiumStorage } from '../../../../utils/storage';
import './MenuList.css';
import { useTranslation } from '../../../../i18n/i18n';
import { useCombo } from '../../../../contexts/ComboContext';
import { formatPriceWithCurrency } from '../../../../utils/currencyConverter';

// Local asset images to use as random placeholders for food items
const assetPlaceholders = [
  process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png',
  process.env.PUBLIC_URL + '/assets/images/on-boarding-2.png',
  process.env.PUBLIC_URL + '/assets/images/on-boarding-3.png',
];

function getPlaceholderByKey(key) {
  const str = String(key || 'food');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % assetPlaceholders.length;
  return assetPlaceholders[idx];
}

function MenuList({ menuItems = [], loading = false, error = null, searchTerm = '' }) {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { fetchComboItems, getCachedComboItems } = useCombo();
  
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  // Preload combo items for all combos in the menu
  useEffect(() => {
    const combos = menuItems.filter(item => item.isCombo && item.comboItemIds && item.comboItemIds.length > 0);
    combos.forEach(combo => {
      fetchComboItems(combo.id, combo.comboItemIds);
    });
  }, [menuItems, fetchComboItems]);

  // Fetch available shops for current stadium
  useEffect(() => {
    const loadShops = async () => {
      try {
        setShopsLoading(true);
        const selectedStadium = stadiumStorage.getSelectedStadium();
        
        if (selectedStadium && selectedStadium.id) {
          const shopsRef = collection(db, 'shops');
          const q = query(
            shopsRef,
            where('stadiumId', '==', selectedStadium.id),
            where('shopAvailability', '==', true)
          );
          
          const querySnapshot = await getDocs(q);
          const shopsData = [];
          querySnapshot.forEach((doc) => {
            shopsData.push({
              id: doc.id,
              name: doc.data().name || 'Unknown Shop'
            });
          });
          
          setShops(shopsData);
        }
      } catch (error) {
        console.error('Error loading shops:', error);
      } finally {
        setShopsLoading(false);
      }
    };
    
    loadShops();
  }, []);

  // Get shop name by ID
  const getShopName = (shopId) => {
    if (!shopId) return 'Shop';
    const shop = shops.find(s => s.id === shopId);
    return shop ? shop.name : 'Shop';
  };

  const handleFoodClick = (food) => {
    // Navigate to food detail page (matching Flutter app behavior)
    console.log('🍽️ Navigating to food detail:', food.name);
    navigate(`/food/${food.id}`);
  };



  // Get section title based on search state
  const getSectionTitle = () => {
    if (searchTerm.trim()) {
      return `${t('home.search_results')} (${menuItems.length})`;
    }
    return t('home.popular_menu');
  };

  // Loading state
  if (loading) {
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="menu-loading">
          <div className="menu-shimmer-grid">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="menu-shimmer-card-grid">
                <div className="shimmer-image"></div>
                <div className="shimmer-content">
                  <div className="shimmer-line"></div>
                  <div className="shimmer-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && menuItems.length === 0) {
    const emptyMessage = searchTerm.trim() 
      ? `${t('home.no_results_for')} "${searchTerm}"`
      : t('home.no_menu');
    
    return (
      <div className="menu-list">
        <div className="section-header">
          <h2 className="section-title">{getSectionTitle()}</h2>
        </div>
        <div className="menu-empty">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-list">
      <div className="section-header">
        <h2 className="section-title">{getSectionTitle()}</h2>
        {!searchTerm && (
          <button className="see-all-button" onClick={() => navigate('/menu')}>
            <span>{t('home.see_all')}</span>
          </button>
        )}
        {error && (
          <p className="section-subtitle error-text">{error}</p>
        )}
      </div>
      
      {/* Vertical grid container - 2 items per row */}
      <div className="menu-grid-container">
        <div className="menu-grid">
          {menuItems.map((food) => (
            <div 
              key={food.id} 
              className={`menu-card-grid ${food.isCombo ? 'combo-card' : ''}`}
              onClick={() => handleFoodClick(food)}
            >
              {/* Food Image - 120px height like Flutter app */}
              <div className="menu-image-grid">
                {food.isCombo ? (
                  // Combo: Show 2 images side by side using actual combo items
                  <div className="combo-images">
                    {(() => {
                      const cachedItems = getCachedComboItems(food.comboItemIds);
                      const comboImages = food.getComboImages(cachedItems);
                      return comboImages.map((imageUrl, index) => (
                        <img 
                          key={index}
                          src={imageUrl || getPlaceholderByKey(food.id || food.name)} 
                          alt={`${food.name} - Item ${index + 1}`}
                          className="combo-image"
                          onError={(e) => {
                            e.currentTarget.src = getPlaceholderByKey(food.id || food.name);
                          }}
                        />
                      ));
                    })()}
                    {/* Combo badge */}
                    <div className="combo-badge">COMBO</div>
                  </div>
                ) : (
                  // Regular item: Single image
                  <img 
                    src={food.getPrimaryImage() || getPlaceholderByKey(food.id || food.name)} 
                    alt={food.name}
                    onError={(e) => {
                      e.currentTarget.src = getPlaceholderByKey(food.id || food.name);
                    }}
                  />
                )}
                
                {/* Food type badges */}
                {food.getFoodTypeBadges().length > 0 && (
                  <div className="food-type-badges">
                    {food.getFoodTypeBadges().map((badge, index) => (
                      <span key={index} className="food-type-badge">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Food Details - matching Flutter app padding */}
              <div className="menu-content-grid">
                {(() => {
                  const displayName = (food.nameMap && (food.nameMap[lang] || food.nameMap.en)) || food.name;
                  return (
                    <h3 className="menu-name-grid">{displayName}</h3>
                  );
                })()}
                <p className="menu-price-grid">{formatPriceWithCurrency(food.price, food.currency)}</p>
                
                {/* Preparation time */}
                <div className="menu-prep-time">
                  <MdAccessTime className="time-icon-small" />
                  <span>{food.getPreparationTimeText()}</span>
                </div>
                
                {/* Shop name at bottom right */}
                <div className="menu-shop-name">
                  {getShopName(food.shopId)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuList;
