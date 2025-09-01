import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { userStorage } from '../../utils/storage';
import { cartUtils } from '../../utils/cartUtils';
import { showToast } from '../../components/toast/ToastContainer';

// Import components
import FoodHeader from './components/FoodHeader';
import FoodInfo from './components/FoodInfo';
import FoodDescription from './components/FoodDescription';
import AllergensList from './components/AllergensList';
import TestimonialsList from './components/TestimonialsList';
import FoodBottomBar from './components/FoodBottomBar';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';

import './FoodDetailScreen.css';

const FoodDetailScreen = () => {
  const { foodId } = useParams();
  const navigate = useNavigate();
  
  // State matching Flutter app
  const [food, setFood] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [rating, setRating] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (foodId) {
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

  // Add to cart (enhanced with popup notifications)
  const handleAddToCart = () => {
    try {
      console.log('🛒 Adding to cart:', food.name);
      
      // Use enhanced cart utility
      const result = cartUtils.addToCart(food, 1);
      
      if (result.success) {
        // Show success popup/toast
        showToast(
          `${food.name} added to cart! (${result.totalItems} items)`,
          'success',
          3000
        );
        
        console.log('✅ Added to cart successfully:', result.message);
        
        // Navigate to Cart to match Stadium Food flow
        setTimeout(() => {
          navigate('/cart');
        }, 800);
      } else {
        // Show error popup
        showToast(result.message, 'error', 4000);
        console.error('❌ Failed to add to cart:', result.message);
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error', 4000);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
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
      <FoodHeader food={food} onBack={handleBack} isFavorite={isFavorite} onToggleFavorite={handleToggleFavorite} />

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
        <FoodDescription description={food.description} />

        {/* Allergens Component */}
        <AllergensList allergens={food.allergens} />

        {/* Testimonials Component */}
        <TestimonialsList testimonials={testimonials} />
        </div>
      </div>

      {/* Bottom Bar Component */}
      <FoodBottomBar 
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default FoodDetailScreen;
