import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import foodRepository from '../../repositories/foodRepository';
import { stadiumStorage } from '../../utils/storage';
import './MenuListPage.css';

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

export default function MenuListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { title, shopId } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      title: params.get('shopName') || 'כל התפריט',
      shopId: params.get('shopId') || null,
    };
  }, [location.search]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const selectedStadium = stadiumStorage.getSelectedStadium();
        let result;
        if (selectedStadium && selectedStadium.id) {
          result = await foodRepository.getStadiumMenu(selectedStadium.id, 200);
        } else {
          result = await foodRepository.getAllMenuItems();
        }
        if (result.success) {
          let foods = result.foods || [];
          // Optional filter by shop if provided in query
          if (shopId) {
            foods = foods.filter(item => Array.isArray(item.shopIds) && item.shopIds.includes(shopId));
          }
          setItems(foods);
        } else {
          setError(result.error || 'Failed to load menu items');
          setItems([]);
        }
      } catch (e) {
        setError('Failed to load menu items');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const handleFoodClick = (food) => {
    navigate(`/food/${food.id}`);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  }, [items, search]);

  const pageTitle = useMemo(() => {
    if (!search.trim()) return title;
    return `${title} (${filtered.length})`;
  }, [title, search, filtered.length]);

  return (
    <div className="menu-page fade-in">
      <div className="menu-page-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <MdChevronLeft size={22} />
        </button>
        <h1 className="menu-page-title">{pageTitle}</h1>
        <div className="header-spacer" />
      </div>

      <div className="menu-page-search">
        <input
          className="menu-search-input"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפש בכל התפריט..."
        />
      </div>

      {loading && <div className="menu-page-status">Loading...</div>}
      {error && <div className="menu-page-status error">{error}</div>}

      {!loading && !error && (
        <div className="menu-grid">
          {filtered.map((food) => (
            <div
              key={food.id}
              className="menu-grid-card fade-up"
              onClick={() => handleFoodClick(food)}
            >
              <div className="menu-grid-image">
                <img
                  src={food.getPrimaryImage() || getPlaceholderByKey(food.id || food.name)}
                  alt={food.name}
                  onError={(e) => {
                    e.currentTarget.src = getPlaceholderByKey(food.id || food.name);
                  }}
                />
              </div>
              <div className="menu-grid-content">
                <h3 className="menu-grid-name">{food.name}</h3>
                <p className="menu-grid-price">₪{food.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
