import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useTranslation } from '../../i18n/i18n';
import './PromotionBanner.css';

const PromotionBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [promotion, setPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

  useEffect(() => {
    fetchPromotion();
  }, []);

  const fetchPromotion = async () => {
    try {
      setLoading(true);
      // Fetch promotions from Firebase collection
      const promotionsQuery = query(collection(db, 'promotions'), limit(1));
      const querySnapshot = await getDocs(promotionsQuery);
      
      if (!querySnapshot.empty) {
        const promotionData = querySnapshot.docs[0].data();
        console.log('Promotion data fetched:', promotionData);
        console.log('Image URL from Firebase:', promotionData.images?.[0]);
        setPromotion(promotionData);
      } else {
        console.log('No promotion data found in Firebase');
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Show promotion banner when component mounts (user visits website)
    const hasSeenPromotion = localStorage.getItem('hasSeenPromotion');
    
    if (!hasSeenPromotion && !loading && promotion) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [promotion, loading]);

  const handleClose = () => {
    setIsVisible(false);
    // Remember that user has seen the promotion
    localStorage.setItem('hasSeenPromotion', 'true');
  };

  const handleDetailClick = () => {
    navigate('/menu');
    handleClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="promotion-overlay">
      <div className="promotion-banner">
        <button 
          className="promotion-close-btn" 
          onClick={handleClose}
          aria-label="Close promotion"
        >
          ×
        </button>
        
        <div className="promotion-content">
          <div className="promotion-image">
            {imageLoading && (
              <div className="promotion-image-loading">
                <div className="loading-spinner"></div>
              </div>
            )}
            <img 
              src={promotion?.images?.[0] || process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png'} 
              alt="Special Promotion"
              onError={(e) => {
                console.log('Promotion image failed to load, using fallback');
                console.log('Failed image URL:', promotion?.images?.[0]);
                console.log('Error details:', e);
                setImageLoading(false);
                // Use a different local asset as fallback
                e.target.src = process.env.PUBLIC_URL + '/assets/images/on-boarding-1.png';
              }}
              onLoad={() => {
                console.log('Promotion banner loaded successfully');
                console.log('Loaded image URL:', promotion?.images?.[0]);
                setImageLoading(false);
              }}
              onLoadStart={() => {
                console.log('Starting to load image:', promotion?.images?.[0]);
              }}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </div>
          
          <div className="promotion-text">
            <h2 className="promotion-title">
              {lang === 'he' ? '🎉 מבצע מיוחד!' : '🎉 Special Offer!'}
            </h2>
            <p className="promotion-description">
              {lang === 'he' ? 'עסקאות מדהימות על הקומבו המועדף עליך!' : 'Amazing deals on your favorite combos!'}
            </p>
          </div>
          
          <div className="promotion-actions">
            <button 
              className="promotion-detail-btn" 
              onClick={handleDetailClick}
            >
              {lang === 'he' ? 'צפה בפרטים' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionBanner;
