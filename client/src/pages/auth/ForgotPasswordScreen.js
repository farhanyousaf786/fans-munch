import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { useTranslation } from '../../i18n/i18n';
import PageBackHeader from '../../components/page_header/PageBackHeader';
import './ForgotPasswordScreen.css';

const ForgotPasswordScreen = () => {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.email_invalid'));
      return;
    }

    setLoading(true);
    const res = await authService.resetPassword(email);
    setLoading(false);

    if (res.success) {
      setMessage(t('auth.reset_sent'));
    } else {
      setError(res.error || t('auth.reset_failed'));
    }
  };

  return (
    <div className="forgot-screen" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <div className="forgot-container">
        <PageBackHeader
          title={t('auth.forgot_password')}
          fallbackTo="/auth"
          onBack={() => navigate('/auth')}
        />
        <p className="forgot-subtitle">{t('auth.reset_instructions')}</p>

        <form onSubmit={handleSubmit} className="forgot-form">
          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.email_ph')}
              required
            />
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? t('auth.please_wait') : t('auth.send_reset_link')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
