import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="brand">Fans Munch</div>
        <nav className="links">
          <Link to="/home" className="link">Home</Link>
          <Link to="/settings/about" className="link">About</Link>
          <Link to="/settings/feedback" className="link">Contact Us</Link>
          <Link to="/auth" className="link">Login</Link>
        </nav>
        <div className="copy">© {new Date().getFullYear()} Fans Munch</div>
      </div>
    </footer>
  );
};

export default Footer;
