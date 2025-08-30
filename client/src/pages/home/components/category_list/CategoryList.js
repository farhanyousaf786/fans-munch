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

const CategoryList = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock categories data - in real app, this would come from Firebase/API
  const categories = [
    {
      id: 'all',
      name: 'All',
      icon: MdRestaurant,
      color: '#3D70FF',
      count: 120
    },
    {
      id: 'pizza',
      name: 'Pizza',
      icon: MdLocalPizza,
      color: '#FF6B6B',
      count: 25
    },
    {
      id: 'burgers',
      name: 'Burgers',
      icon: MdFastfood,
      color: '#4ECDC4',
      count: 18
    },
    {
      id: 'drinks',
      name: 'Drinks',
      icon: MdLocalDrink,
      color: '#45B7D1',
      count: 32
    },
    {
      id: 'desserts',
      name: 'Desserts',
      icon: MdIcecream,
      color: '#F7B731',
      count: 15
    },
    {
      id: 'coffee',
      name: 'Coffee',
      icon: MdLocalCafe,
      color: '#8B4513',
      count: 12
    },
    {
      id: 'asian',
      name: 'Asian',
      icon: MdRamenDining,
      color: '#E74C3C',
      count: 20
    },
    {
      id: 'bakery',
      name: 'Bakery',
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
        <h2 className="section-title">Categories</h2>
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
