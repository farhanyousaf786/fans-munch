import React, { useState } from 'react';
import { MdSearch } from 'react-icons/md';
import './SearchFilterWidget.css';
import { useTranslation } from '../../../../i18n/i18n';

const SearchFilterWidget = ({ onChanged }) => {
  const [searchValue, setSearchValue] = useState('');
  const { t } = useTranslation();

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
            placeholder={t('home.search_placeholder')}
            value={searchValue}
            onChange={handleSearchChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchFilterWidget;
