import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

const SplashScreen = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show logo animation after 500ms
    const showAnimation = setTimeout(() => {
      setVisible(true);
    }, 500);

    // Navigate to next screen after 2.5s
    const navigateTimer = setTimeout(() => {
      // Check if user has selected a stadium
      const selectedStadium = localStorage.getItem('selectedStadium');
      const isLoggedIn = localStorage.getItem('userToken');

      if (isLoggedIn && selectedStadium) {
        // If user is logged in and has selected stadium, go to home
        navigate('/home');
      } else if (isLoggedIn) {
        // If user is logged in but no stadium selected, go to stadium selection
        navigate('/stadium');
      } else {
        // If not logged in, go back to auth (shouldn't happen in normal flow)
        navigate('/auth');
      }
    }, 2500);

    return () => {
      clearTimeout(showAnimation);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-background">
        <div className="pattern-overlay"></div>
      </div>
      
      <div className={`splash-logo ${visible ? 'visible' : ''}`}>
        <div className="logo-container">
          <div className="logo-circle">
            <span className="logo-emoji">🍔</span>
          </div>
          <h1 className="logo-text">Food Munch</h1>
          <p className="logo-tagline">Delicious food delivered fresh</p>
        </div>
      </div>

      <div className="splash-loading">
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
