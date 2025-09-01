import React from 'react';
import './settings.css';

const AboutAppScreen = () => {
  return (
    <div className="screen static-screen">
      <h1>About App</h1>
      <p>
        Fans Munch helps you order food to your seat at the stadium. We focus on speed,
        simplicity, and reliability.
      </p>
      <ul>
        <li>Version: 1.0.0</li>
        <li>Build Date: {new Date().toLocaleDateString()}</li>
      </ul>
    </div>
  );
};

export default AboutAppScreen;
