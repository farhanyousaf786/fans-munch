import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { useTranslation } from '../../i18n/i18n';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <nav className="footer-nav">
          <Link to="/home" className="footer-link">{t('nav.home')}</Link>
          <Link to="/settings/feedback" className="footer-link">{t('profile.feedback')}</Link>
          <Link to="/settings/help" className="footer-link">{t('profile.help') || 'Help'}</Link>
          <Link to="/settings/about" className="footer-link">{t('profile.about')}</Link>
        </nav>

        <p className="copyright">FansMunch 2.0. All rights reserved {new Date().getFullYear()} ©</p>

        <div className="footer-bottom-links">
          <Link to="/settings/privacy" className="bottom-link">{t('profile.privacy')}</Link>
          <span className="separator">•</span>
          <Link to="/settings/terms" className="bottom-link">{t('profile.terms')}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
