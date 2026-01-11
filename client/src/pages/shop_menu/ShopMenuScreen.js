import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import foodRepository from '../../repositories/foodRepository';
import { formatPriceWithCurrency } from '../../utils/currencyConverter';
import './ShopMenuScreen.css';

function ShopMenuScreen() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Always start page at the top when opening/changing shops
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  }, [shopId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch shop details for header
        if (shopId) {
          const ref = doc(db, 'shops', shopId);
          const snap = await getDoc(ref);
          if (snap.exists()) setShop({ id: snap.id, ...snap.data() });
        }

        // Fetch menu items for the shop
        const res = await foodRepository.getMenuItemsByShop(shopId, 50);
        if (res.success) {
          setMenuItems(res.foods);
        } else {
          setError(res.error || 'Failed to fetch shop menu');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to fetch shop menu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  const handleFoodClick = (food) => navigate(`/food/${food.id}`);

  return (
    <div className="shop-menu-page">
      <div className="shop-menu-header">
        <div className="shop-title-row">
          <button onClick={() => navigate(-1)} className="back-icon" aria-label="Go back" title="Back">←</button>
          <h2 className="shop-title">{shop?.name || `Gate ${shop?.gate || shopId?.slice?.(0,6)}`}</h2>
        </div>
      </div>

      {error && (
        <div className="shop-menu-error">{error}</div>
      )}

      <div className="shop-menu-grid">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="grid-card shimmer">
              <div className="grid-image" />
              <div className="grid-content">
                <div className="line" />
                <div className="line short" />
              </div>
            </div>
          ))
        ) : (
          menuItems.map(food => (
            <div key={food.id} className="grid-card" onClick={() => handleFoodClick(food)}>
              <div className="grid-image">
                <img src={food.getPrimaryImage()} alt={food.name} onError={(e) => { e.target.src = '/api/placeholder/200/150'; }} />
              </div>
              <div className="grid-content">
                <h3 className="grid-name">{food.name}</h3>
                <div className="grid-bottom">
                  <span className="grid-price">{formatPriceWithCurrency(food.price, food.currency)}</span>
                  <span className="grid-prep">{food.getPreparationTimeText()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ShopMenuScreen;
