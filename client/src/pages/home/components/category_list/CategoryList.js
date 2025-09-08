import React, { useEffect, useState } from 'react';
import { 
  MdLocalPizza, 
  MdFastfood, 
  MdLocalDrink, 
  MdIcecream, 
  MdRestaurant,
  MdCake,
  MdLocalCafe,
  MdRamenDining
} from 'react-icons/md';
import './CategoryList.css';
import { useTranslation } from '../../../../i18n/i18n';
import { db } from '../../../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const CategoryList = ({ selectedCategory: selectedCategoryProp = 'all', onSelect }) => {
  const [selectedCategoryState, setSelectedCategoryState] = useState(selectedCategoryProp || 'all');
  const selectedCategory = selectedCategoryProp ?? selectedCategoryState;
  const [categories, setCategories] = useState([]);
  const { t, lang } = useTranslation();

  // Load categories from Firestore
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        const items = snap.docs.map((doc) => {
          const data = doc.data() || {};
          const name = data?.nameMap?.[lang] || data?.nameMap?.en || data?.name || doc.id;
          const icon = data?.icon || '🍔';
          return {
            id: data?.docId || doc.id,
            name,
            icon, // emoji string
            color: '#3D70FF', // default color; could be extended via Firestore later
          };
        });
        // Prepend the synthetic 'All' category
        const allCat = {
          id: 'all',
          name: t('home.cat_all'),
          icon: MdRestaurant,
          color: '#3D70FF',
        };
        if (!cancelled) setCategories([allCat, ...items]);
      } catch (e) {
        console.warn('[CategoryList] Failed to load categories:', e?.message || e);
        // Fallback to just 'All' if Firestore fails
        setCategories([
          { id: 'all', name: t('home.cat_all'), icon: MdRestaurant, color: '#3D70FF' },
        ]);
      }
    })();
    return () => { cancelled = true; };
  }, [db, lang, t]);

  const handleCategorySelect = (categoryId) => {
    // Update internal state only if uncontrolled
    if (onSelect) {
      onSelect(categoryId);
    } else {
      setSelectedCategoryState(categoryId);
    }
  };

  return (
    <div className="category-list">
      <div className="section-header">
        <h2 className="section-title">{t('home.categories')}</h2>
      </div>
      
      <div className="categories-container">
        {categories.map((category) => {
          const isEmoji = typeof category.icon === 'string';
          const IconComponent = isEmoji ? null : category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <button
              key={category.id}
              className={`category-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div 
                className="category-icon-wrapper"
                style={{ 
                  backgroundColor: isSelected ? category.color : `${category.color}15`,
                }}
              >
                {isEmoji ? (
                  <span className="category-icon" style={{ fontSize: 22 }}>
                    {category.icon}
                  </span>
                ) : (
                  <IconComponent 
                    className="category-icon"
                    style={{ 
                      color: isSelected ? 'white' : category.color 
                    }}
                  />
                )}
              </div>
              
              <div className="category-info">
                <h3 className="category-name">{category.name}</h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryList;
