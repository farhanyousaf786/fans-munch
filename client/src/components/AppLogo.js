import React from 'react';

const AppLogo = ({ size = 60, showText = true, className = "" }) => {
  return (
    <div className={`app-logo ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: showText ? '10px' : '0' }}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#ff6b35', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#f7931e', stopOpacity:1}} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="16" cy="16" r="15" fill="url(#logoGradient)" stroke="#fff" strokeWidth="1"/>
        
        {/* Hamburger icon */}
        {/* Top bun */}
        <ellipse cx="16" cy="10" rx="8" ry="3" fill="#D2691E"/>
        <ellipse cx="16" cy="9" rx="8" ry="2" fill="#F4A460"/>
        
        {/* Lettuce */}
        <ellipse cx="16" cy="13" rx="7" ry="1.5" fill="#228B22"/>
        
        {/* Patty */}
        <ellipse cx="16" cy="16" rx="7" ry="2" fill="#8B4513"/>
        
        {/* Cheese */}
        <ellipse cx="16" cy="19" rx="6" ry="1" fill="#FFD700"/>
        
        {/* Bottom bun */}
        <ellipse cx="16" cy="22" rx="8" ry="2.5" fill="#D2691E"/>
        
        {/* Sesame seeds on top bun */}
        <circle cx="12" cy="9" r="0.8" fill="#F5DEB3"/>
        <circle cx="20" cy="9" r="0.8" fill="#F5DEB3"/>
        <circle cx="16" cy="8" r="0.8" fill="#F5DEB3"/>
      </svg>
      
      {showText && (
        <div className="logo-text-container">
          <h2 className="logo-brand-text">Food Munch</h2>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
