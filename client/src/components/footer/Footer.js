import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaApple, FaGooglePlay } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        {/* App Store Badges */}
        <div className="app-badges">
          <a 
            href="https://play.google.com/store/apps/details?id=com.fansfood" 
            target="_blank" 
            rel="noopener noreferrer"
            className="app-badge"
          >
            <FaGooglePlay className="badge-icon" />
            <div className="badge-text">
              <span className="badge-small">GET IT ON</span>
              <span className="badge-large">Google Play</span>
            </div>
          </a>
          <a 
            href="https://apps.apple.com/pk/app/fan-munch/id6748237417" 
            target="_blank" 
            rel="noopener noreferrer"
            className="app-badge"
          >
            <FaApple className="badge-icon" />
            <div className="badge-text">
              <span className="badge-small">Download on the</span>
              <span className="badge-large">App Store</span>
            </div>
          </a>
        </div>

        {/* Navigation Links */}
        <nav className="footer-nav">
          <Link to="/home" className="footer-link">Home</Link>
          <Link to="/settings/feedback" className="footer-link">Contact Us</Link>
          <Link to="/settings/team" className="footer-link">Team</Link>
          <Link to="/settings/help" className="footer-link">Help</Link>
          <Link to="/settings/about" className="footer-link">About</Link>
        </nav>

        {/* Copyright */}
        <p className="copyright">Fans Munch. All rights reserved {new Date().getFullYear()} ©</p>
        
        {/* Bottom Links */}
        <div className="footer-bottom-links">
          <Link to="/settings/privacy" className="bottom-link">Privacy Policy</Link>
          <span className="separator">•</span>
          <Link to="/settings/terms" className="bottom-link">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
