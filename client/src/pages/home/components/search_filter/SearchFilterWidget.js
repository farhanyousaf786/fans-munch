import React, { useState } from 'react';
import { MdSearch, MdFilterList } from 'react-icons/md';
import './SearchFilterWidget.css';

const SearchFilterWidget = ({ searchController, onChanged, onFilterTap }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onChanged) {
      onChanged(value);
    }
  };

  const handleFilterClick = () => {
    if (onFilterTap) {
      onFilterTap();
    }
  };

  return (
    <div className="search-filter-widget">
      <div className="search-container">
        <div className="search-input-wrapper">
          <MdSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search for food items..."
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
        <button className="filter-button" onClick={handleFilterClick}>
          <MdFilterList className="filter-icon" />
        </button>
      </div>
    </div>
  );
};

export default SearchFilterWidget;
