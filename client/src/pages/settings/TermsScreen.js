import React from 'react';
import './settings.css';

const TermsScreen = () => (
  <div className="screen static-screen">
    <h1>Terms and Conditions</h1>
    <div className="section-card">
      <h2>1. Introduction</h2>
      <p>By using Fans Munch, you agree to these terms. Please read them carefully.</p>
    </div>
    <div className="section-card">
      <h2>2. Orders and Payments</h2>
      <ul>
        <li>All orders are subject to availability and acceptance.</li>
        <li>Payments are processed securely by our partners.</li>
        <li>Prices and fees may vary by venue.</li>
      </ul>
    </div>
    <div className="section-card">
      <h2>3. Delivery</h2>
      <p>Delivery times depend on venue operations and event conditions.</p>
    </div>
    <div className="section-card">
      <h2>4. Refunds</h2>
      <p>Issues with your order? Contact support from within the app.</p>
    </div>
    <div className="section-card">
      <h2>5. Responsible Use</h2>
      <p>Do not misuse the service or attempt to disrupt the platform.</p>
    </div>
  </div>
);

export default TermsScreen;
