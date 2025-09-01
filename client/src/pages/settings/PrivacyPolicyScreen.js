import React from 'react';
import './settings.css';

const PrivacyPolicyScreen = () => (
  <div className="screen static-screen">
    <h1>Privacy Policy</h1>
    <div className="section-card">
      <h2>Data We Collect</h2>
      <ul>
        <li>Account info (name, email)</li>
        <li>Order and payment metadata</li>
        <li>Device and usage data to improve reliability</li>
      </ul>
    </div>
    <div className="section-card">
      <h2>How We Use Data</h2>
      <p>To process orders, provide support, and improve the app experience.</p>
    </div>
    <div className="section-card">
      <h2>Sharing</h2>
      <p>We do not sell your data. Limited sharing with payment and delivery partners is required to fulfill your order.</p>
    </div>
    <div className="section-card">
      <h2>Your Rights</h2>
      <p>You can request deletion or export of your data by contacting support.</p>
    </div>
    <div className="section-card">
      <h2>Contact</h2>
      <p>Email: support@fansmunch.example</p>
    </div>
  </div>
);

export default PrivacyPolicyScreen;
