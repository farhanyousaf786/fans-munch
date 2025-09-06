import React, { useState } from 'react';
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

const CategoryList = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { t } = useTranslation();

  // Mock categories data - in real app, this would come from Firebase/API
  const categories = [
    {
      id: 'all',
      name: t('home.cat_all'),
      icon: MdRestaurant,
      color: '#3D70FF',
      count: 120
    },
    {
      id: 'pizza',
      name: t('home.cat_pizza'),
      icon: MdLocalPizza,
      color: '#FF6B6B',
      count: 25
    },
    {
      id: 'burgers',
      name: t('home.cat_burgers'),
      icon: MdFastfood,
      color: '#4ECDC4',
      count: 18
    },
    {
      id: 'drinks',
      name: t('home.cat_drinks'),
      icon: MdLocalDrink,
      color: '#45B7D1',
      count: 32
    },
    {
      id: 'desserts',
      name: t('home.cat_desserts'),
      icon: MdIcecream,
      color: '#F7B731',
      count: 15
    },
    {
      id: 'coffee',
      name: t('home.cat_coffee'),
      icon: MdLocalCafe,
      color: '#8B4513',
      count: 12
    },
    {
      id: 'asian',
      name: t('home.cat_asian'),
      icon: MdRamenDining,
      color: '#E74C3C',
      count: 20
    },
    {
      id: 'bakery',
      name: t('home.cat_bakery'),
      icon: MdCake,
      color: '#9B59B6',
      count: 8
    }
  ];

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    // In real app, this would trigger filtering of menu items
    console.log('Selected category:', categoryId);
  };

  return (
    <div className="category-list">
      <div className="section-header">
        <h2 className="section-title">{t('home.categories')}</h2>
      </div>
      
      <div className="categories-container">
        {categories.map((category) => {
          const IconComponent = category.icon;
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
                <IconComponent 
                  className="category-icon"
                  style={{ 
                    color: isSelected ? 'white' : category.color 
                  }}
                />
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
