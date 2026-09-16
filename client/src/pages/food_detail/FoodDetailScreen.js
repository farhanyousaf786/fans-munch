import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { userStorage } from '../../utils/storage';
import { cartUtils } from '../../utils/cartUtils';
import { showToast } from '../../components/toast/ToastContainer';
import foodRepository from '../../repositories/foodRepository';
import { useTranslation } from '../../i18n/i18n';
import { formatPriceWithCurrency } from '../../utils/currencyConverter';
import { getLocalizedName } from '../../utils/localization';
import AlertModal from '../../components/common/AlertModal';

// Import components
import FoodHeader from './components/FoodHeader';
import FoodInfo from './components/FoodInfo';
import FoodDescription from './components/FoodDescription';
import ComboItemsList from './components/ComboItemsList';
import AllergensList from './components/AllergensList';
import TestimonialsList from './components/TestimonialsList';
import FoodBottomBar from './components/FoodBottomBar';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

import './FoodDetailScreen.css';

const FoodDetailScreen = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  
  // State matching Flutter app
  const [food, setFood] = useState(null);
  const [comboItems, setComboItems] = useState([]); // For combo details
  const [testimonials, setTestimonials] = useState([]);
  const [rating, setRating] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedSauces, setSelectedSauces] = useState([]);
  const [comboSelections, setComboSelections] = useState({}); // { itemId: [selectedOptions] }
  const [replaceCartOpen, setReplaceCartOpen] = useState(false);
  const [pendingAddQty, setPendingAddQty] = useState(1);

  useEffect(() => {
    if (foodId) {
      // Scroll to top when opening food detail
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      initializeScreen();
    }
  }, [foodId]);

  // Match Flutter initState logic exactly
  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch food details (equivalent to widget.food in Flutter)
      await fetchFoodDetails();
      
      // Fetch order count (matching Flutter FetchOrderCount event)
      await fetchOrderCount();
      
      // Fetch testimonials (matching Flutter FetchTestimonials event)
      await fetchTestimonials();
      
    } catch (err) {
      console.error('❌ Error initializing food detail screen:', err);
      setError('Failed to load food details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch food details from Firebase
  const fetchFoodDetails = async () => {
    try {
      console.log('🔍 Fetching food details for ID:', foodId);
      
      let foodData = null;
      
      // First try to fetch from menuItems collection (regular foods)
      try {
        const foodDocRef = doc(db, 'menuItems', foodId);
        const foodDoc = await getDoc(foodDocRef);
        
        if (foodDoc.exists()) {
          foodData = {
            id: foodDoc.id,
            ...foodDoc.data()
          };
          console.log('✅ Food details loaded from menuItems:', foodData.name);
        }
      } catch (err) {
        console.log('ℹ️ Not found in menuItems, trying offers...');
      }
      
      // If not found in menuItems, try offers collection (special offers)
      if (!foodData) {
        try {
          const offerDocRef = doc(db, 'offers', foodId);
          const offerDoc = await getDoc(offerDocRef);
          
          if (offerDoc.exists()) {
            foodData = {
              id: offerDoc.id,
              ...offerDoc.data()
            };
            console.log('✅ Food details loaded from offers:', foodData.name);
          }
        } catch (err) {
          console.log('ℹ️ Not found in offers either');
        }
      }
      
      if (foodData) {
        setFood(foodData);
        
        // If this is a combo, fetch combo items
        if (foodData.isCombo && foodData.comboItemIds && foodData.comboItemIds.length > 0) {
          console.log('🍽️ Fetching combo items for:', foodData.name);
          try {
            const comboResult = await foodRepository.getComboItems(foodData.comboItemIds);
            if (comboResult.success) {
              setComboItems(comboResult.foods);
              console.log('✅ Combo items loaded:', comboResult.foods.length);
            }
          } catch (err) {
            console.error('❌ Error fetching combo items:', err);
          }
        }
        
        // Check if food is in user's favorites
        checkFavoriteStatus(foodData.id);
      } else {
        throw new Error('Food not found in menuItems or offers');
      }
    } catch (error) {
      console.error('❌ Error fetching food details:', error);
      throw error;
    }
  };

  // Fetch order count (matching Flutter FetchOrderCount)
  const fetchOrderCount = async () => {
    try {
      console.log('📊 Fetching order count for food:', foodId);
      
      // Query orders collection to count how many times this food was ordered
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('foodId', '==', foodId));
      const querySnapshot = await getDocs(q);
      
      setOrderCount(querySnapshot.size);
      console.log('✅ Order count loaded:', querySnapshot.size);
    } catch (error) {
      console.error('❌ Error fetching order count:', error);
      // Don't throw, just log - order count is not critical
    }
  };

  // Fetch testimonials (matching Flutter FetchTestimonials)
  const fetchTestimonials = async () => {
    try {
      console.log('💬 Fetching testimonials for food:', foodId);
      
      // Create food reference (matching Flutter DocumentReference)
      const foodRef = doc(db, 'menuItems', foodId);
      
      // Query testimonials collection
      const testimonialsRef = collection(db, 'testimonials');
      const q = query(testimonialsRef, where('target', '==', foodRef));
      const querySnapshot = await getDocs(q);
      
      const testimonialsData = [];
      querySnapshot.forEach((doc) => {
        testimonialsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setTestimonials(testimonialsData);
      
      // Calculate average rating (matching Flutter logic)
      if (testimonialsData.length > 0) {
        const totalRating = testimonialsData.reduce((sum, testimonial) => sum + (testimonial.rating || 0), 0);
        const avgRating = totalRating / testimonialsData.length;
        setRating(avgRating);
        console.log('✅ Testimonials loaded:', testimonialsData.length, 'Average rating:', avgRating);
      } else {
        setRating(0);
        console.log('ℹ️ No testimonials found');
      }
    } catch (error) {
      console.error('❌ Error fetching testimonials:', error);
      // Don't throw, just log - testimonials are not critical
    }
  };

  // Check if food is in user's favorites
  const checkFavoriteStatus = (foodId) => {
    const userData = userStorage.getUserData();
    if (userData && userData.favorites) {
      setIsFavorite(userData.favorites.includes(foodId));
    }
  };

  // Toggle favorite status (matching Flutter ToggleFavoriteFood)
  const handleToggleFavorite = () => {
    try {
      const userData = userStorage.getUserData();
      if (!userData) return;

      let favorites = userData.favorites || [];
      
      if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter(id => id !== food.id);
        console.log('💔 Removed from favorites:', food.name);
      } else {
        // Add to favorites
        favorites.push(food.id);
        console.log('❤️ Added to favorites:', food.name);
      }
      
      // Update user data
      const updatedUserData = { ...userData, favorites };
      userStorage.setUserData(updatedUserData);
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
    }
  };

  const toggleSauceSelection = (sauce) => {
    setSelectedSauces((prev) => {
      const exists = prev.find((s) => s.name === sauce.name && s.price === sauce.price);
      if (exists) {
        return prev.filter((s) => !(s.name === sauce.name && s.price === sauce.price));
      }
      return [...prev, sauce];
    });
  };
  
  const toggleComboOption = (instanceKey, option) => {
    setComboSelections(prev => {
      const currentSelections = prev[instanceKey] || [];
      const exists = currentSelections.find((s) => s.name === option.name && s.price === option.price);
      
      let newSelections;
      if (exists) {
        newSelections = currentSelections.filter((s) => !(s.name === option.name && s.price === option.price));
      } else {
        newSelections = [...currentSelections, option];
      }
      
      return {
        ...prev,
        [instanceKey]: newSelections
      };
    });
  };

  // Add to cart (enhanced with popup notifications)
  const buildFoodWithSelections = () => {
    const comboItemInfo = {};
    if (food.isCombo && comboItems) {
      food.comboItemIds.forEach((id, index) => {
        const item = comboItems.find(ci => ci.id === id);
        if (item) {
          comboItemInfo[`${id}_${index}`] = getLocalizedName(item, lang, item.name);
        }
      });
    }

    return {
      ...food,
      name: getLocalizedName(food, lang, food.name),
      nameMap: food.nameMap || undefined,
      selectedSauces: Array.isArray(selectedSauces) ? selectedSauces : [],
      comboSelections: comboSelections || {},
      comboItemInfo,
    };
  };

  const completeAddToCart = async (quantity = 1, { clearFirst = false } = {}) => {
    if (clearFirst) {
      cartUtils.clearCart();
    }

    const result = await cartUtils.addToCart(buildFoodWithSelections(), quantity);
    if (result.success) {
      const displayName = getLocalizedName(food, lang, food.name);
      showToast(
        `${displayName} ${t('cart.added_suffix') || 'added to cart!'} (${result.totalItems})`,
        'success',
        3000
      );
      setTimeout(() => {
        navigate('/precart', { replace: true });
      }, 800);
      return true;
    }

    if (result.mixedShops) {
      setPendingAddQty(quantity);
      setReplaceCartOpen(true);
      return false;
    }

    const translatedMessage = t(result.message);
    showToast(translatedMessage, 'error', 4000);
    return false;
  };

  const handleAddToCart = async (quantity = 1) => {
    try {
      await completeAddToCart(quantity);
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast(t('cart.add_failed') || 'Failed to add item to cart', 'error', 4000);
    }
  };

  const handleReplaceCartConfirm = async () => {
    setReplaceCartOpen(false);
    try {
      await completeAddToCart(pendingAddQty, { clearFirst: true });
    } catch (error) {
      console.error('❌ Error replacing cart:', error);
      showToast(t('cart.add_failed') || 'Failed to add item to cart', 'error', 4000);
    }
  };

  // Handle back navigation — prefer shop menu over history stack
  const handleBack = () => {
    const shopId = food?.shopId || (Array.isArray(food?.shopIds) ? food.shopIds[0] : null);
    if (shopId) {
      navigate(`/shop-menu/${shopId}`, { replace: true });
      return;
    }
    try {
      if (window.history.length > 1) {
        navigate(-1);
        return;
      }
    } catch (_) {}
    navigate('/home');
  };

  // Loading state
  if (loading) {
    return <LoadingState onBack={handleBack} />;
  }

  // Error state
  if (error || !food) {
    return (
      <ErrorState 
        error={error} 
        onBack={handleBack} 
        onRetry={initializeScreen} 
      />
    );
  }

  return (
    <div className="food-detail-screen">
      {/* Header Component */}
      <FoodHeader
        food={food}
        comboItems={comboItems}
        onBack={handleBack}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Content */}
      <div className="food-detail-content">
        <div className="food-card">
        {/* Food Info Component */}
        <FoodInfo 
          food={food} 
          rating={rating} 
          testimonials={testimonials} 
          orderCount={orderCount} 
        />

        {/* Description Component */}
        <FoodDescription food={food} />

        {/* Customization options (from customization.options) */}
        {Array.isArray(food?.customization?.options) && food.customization.options.length > 0 && (
          <div className="food-sauces-section">
            <h3 className="food-section-title">Options</h3>
            <div className="food-sauces-list">
              {food.customization.options.map((option, index) => {
                const isSelected = selectedSauces.some(
                  (s) => s.name === option.name && s.price === option.price
                );
                return (
                  <label key={index} className="food-sauce-option">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSauceSelection(option)}
                    />
                    <span className="food-sauce-label">
                      {option.name}
                      {(() => {
                        const priceVal = Number(option.price);
                        if (!isNaN(priceVal) && priceVal > 0) {
                          return <span className="food-sauce-price">{` + ${formatPriceWithCurrency(priceVal, food.currency)}`}</span>;
                        }
                        return <span className="food-sauce-price" style={{ color: '#10b981', fontWeight: '500' }}> (Free)</span>;
                      })()}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Combo Items List */}
        {food.isCombo && comboItems && comboItems.length > 0 && (
          <ComboItemsList 
            comboItems={comboItems} 
            isCombo={food.isCombo} 
            comboPrice={food.price} 
            foodCurrency={food.currency || 'ILS'} 
            comboSelections={comboSelections}
            onOptionToggle={toggleComboOption}
          />
        )} {/* Allergens Component */}
        <AllergensList allergens={food.allergens} />

        {/* Testimonials Component */}
        <TestimonialsList testimonials={testimonials} />
        </div>
      </div>

      {/* Bottom Bar Component */}
      <FoodBottomBar 
        onAddToCart={handleAddToCart}
      />

      <AlertModal
        isOpen={replaceCartOpen}
        title={t('cart.replace_cart_title')}
        message={t('cart.replace_cart_message')}
        type="warning"
        confirmText={t('cart.replace_cart_confirm')}
        cancelText={t('cart.replace_cart_cancel')}
        onConfirm={handleReplaceCartConfirm}
        onClose={() => setReplaceCartOpen(false)}
      />
    </div>
  );
};

export default FoodDetailScreen;
