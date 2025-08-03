import React from 'react';
import TopSection from './components/top_section/TopSection';
import SearchFilterWidget from './components/search_filter/SearchFilterWidget';
import OffersList from './components/offers_list/OffersList';
import CategoryList from './components/category_list/CategoryList';
import MenuList from './components/menu_list/MenuList';
import ShopList from './components/shop_list/ShopList';
import './Home.css';

const Home = () => {
  const handleSearch = (value) => {
    // Handle search functionality
    console.log('Search query:', value);
  };

  const handleFilter = () => {
    // Handle filter functionality
    console.log('Filter clicked');
  };

  return (
    <div className="home-page">
      <TopSection />
      
      <div className="home-content">
        <SearchFilterWidget 
          onChanged={handleSearch}
          onFilterTap={handleFilter}
        />
        
        <OffersList />
        
        <CategoryList />
        
        <MenuList />
        
        <ShopList />
      </div>
    </div>
  );
};

export default Home;
