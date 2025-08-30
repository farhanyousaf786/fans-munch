import React, { useState } from 'react';
import { MdSearch } from 'react-icons/md';
import './SearchFilterWidget.css';

const SearchFilterWidget = ({ onChanged }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onChanged) {
      onChanged(value);
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
      </div>
    </div>
  );
};

export default SearchFilterWidget;
