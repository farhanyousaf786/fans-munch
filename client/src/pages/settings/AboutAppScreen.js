import React from 'react';
import './AboutAppScreen.css';
import { MdRestaurantMenu, MdShoppingCart, MdPayment, MdLocalShipping, MdCheckCircle } from 'react-icons/md';
import { FaApple, FaGooglePlay } from 'react-icons/fa';

const AboutAppScreen = () => {
  const workflowSteps = [
    {
      icon: <MdRestaurantMenu />,
      title: 'Browse Menu',
      description: 'Explore food and drinks from stadium vendors'
    },
    {
      icon: <MdShoppingCart />,
      title: 'Add to Cart',
      description: 'Select your favorite items and customize your order'
    },
    {
      icon: <MdPayment />,
      title: 'Secure Payment',
      description: 'Pay safely with Stripe or Airwallex'
    },
    {
      icon: <MdLocalShipping />,
      title: 'Delivery to Seat',
      description: 'Track your order in real-time as it comes to you'
    },
    {
      icon: <MdCheckCircle />,
      title: 'Enjoy!',
      description: 'Receive your food without missing the action'
    }
  ];

  return (
    <div className="about-screen">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="app-icon">
          <span className="icon-emoji">🍔</span>
        </div>
        <h1 className="app-title">Fans Munch</h1>
        <p className="app-tagline">Order Food & Drinks to Your Seat</p>
        <div className="version-info">
          <span className="version-badge">Version 1.0.0</span>
        </div>
      </div>

      {/* Mission Section */}
      <div className="about-section">
        <h2 className="section-title">Our Mission</h2>
        <p className="section-text">
          Fans Munch revolutionizes the stadium experience by bringing food and drinks directly to your seat. 
          Never miss a moment of the game while waiting in long concession lines. We focus on speed, 
          simplicity, and reliability to enhance your stadium experience.
        </p>
      </div>

      {/* How It Works */}
      <div className="about-section">
        <h2 className="section-title">How It Works</h2>
        <div className="workflow-steps">
          {workflowSteps.map((step, index) => (
            <div key={index} className="workflow-step">
              <div className="step-number">{index + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="about-section">
        <h2 className="section-title">Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 className="feature-title">QR Code Scanning</h3>
            <p className="feature-text">Scan your ticket to auto-fill seat information</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3 className="feature-title">Real-Time Tracking</h3>
            <p className="feature-text">Track your order from kitchen to seat</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3 className="feature-title">Secure Payments</h3>
            <p className="feature-text">Multiple payment options with encryption</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3 className="feature-title">Multi-Language</h3>
            <p className="feature-text">Available in English and Hebrew</p>
          </div>
        </div>
      </div>

  

     
    </div>
  );
};

export default AboutAppScreen;
