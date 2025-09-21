import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userRepository from '../../repositories/userRepository';
import { requestNotificationPermission } from '../../config/firebase';
import { userStorage, stadiumStorage, settingsStorage } from '../../utils/storage';
import './AuthScreen.css';
import { useTranslation } from '../../i18n/i18n';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import Footer from '../../components/footer/Footer';

const AuthScreen = () => {
  const { t, lang, setLang } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Resolve post-login redirect target from ?next or localStorage
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get('next');
      let redirectTo = nextParam && nextParam.startsWith('/') ? nextParam : null;
      if (!redirectTo) {
        try {
          const stored = localStorage.getItem('postLoginNext');
          if (stored && stored.startsWith('/')) {
            redirectTo = stored;
          }
        } catch (_) {}
      }
      const finishAuthRedirect = (path) => {
        try { localStorage.removeItem('postLoginNext'); } catch (_) {}
        
        // Check if stadium is selected - if not, go to stadium selection first
        const hasStadium = stadiumStorage.getSelectedStadium();
        if (!hasStadium && (path === '/cart' || path === '/order/confirm' || path?.includes('/cart') || path?.includes('/order'))) {
          // Save the final destination and go to stadium selection first
          try { localStorage.setItem('postStadiumNext', path); } catch (_) {}
          navigate('/stadium-selection', { replace: true });
          return;
        }
        
        navigate(path || '/home', { replace: true });
      };
      if (isLogin) {
        console.log('🔑 User signing in...');
        
        // Sign in user
        const user = await userRepository.signInUser(formData.email, formData.password);
        
        // Save user data and token to localStorage
        userStorage.setUserData(user.toMap());
        userStorage.setUserToken(`token_${user.id || Date.now()}`);

        // Request FCM token and persist it
        try {
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            await userRepository.updateUserProfile(user.id, { fcmToken });
            try { userStorage.setUserData({ ...user.toMap(), fcmToken }); } catch (_) {}
          }
        } catch (e) {
          // Non-blocking: continue even if notifications are denied or fail
          console.warn('[Auth] FCM token not saved:', e?.message || e);
        }
        
        console.log('✅ Sign in completed');
        finishAuthRedirect(redirectTo || '/home');
      } else {
        // Validate required fields for registration (phone is mandatory)
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password || !formData.confirmPassword) {
          setError(t('auth.fill_required'));
          return;
        }

        // Basic phone validation (at least 7 digits)
        const digits = String(formData.phone || '').replace(/\D/g, '');
        if (digits.length < 7) {
          setError('Please enter a valid phone number');
          return;
        }
        
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwords_no_match'));
          return;
        }
        
        console.log('📝 User registering...');
        
        // Register new user
        const user = await userRepository.registerUser(formData);
        
        if (user.success) {
          // Save user data and token to localStorage
          userStorage.setUserData(user.user.toMap());
          userStorage.setUserToken(`token_${user.user.id || Date.now()}`);

          // Request FCM token and persist it
          try {
            const fcmToken = await requestNotificationPermission();
            if (fcmToken) {
              await userRepository.updateUserProfile(user.user.id, { fcmToken });
              try { userStorage.setUserData({ ...user.user.toMap(), fcmToken }); } catch (_) {}
            }
          } catch (e) {
            console.warn('[Auth] FCM token not saved (register):', e?.message || e);
          }
          
          console.log('✅ Registration completed');
          finishAuthRedirect(redirectTo || '/home');
        } else {
          setError(user.error);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-screen" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Upper Section */}
      <div className="auth-upper-section">
        {/* Language Toggle */}
        <button
          type="button"
          className="lang-toggle"
          onClick={() => {
            const next = lang === 'he' ? 'en' : 'he';
            setLang(next);
            try { settingsStorage.setLanguagePreference(next); } catch (_) {}
          }}
        >
          {lang === 'he' ? 'EN' : 'HE'}
        </button>
        <div className="auth-header">
          <img 
            src="/app_icon.png" 
            alt="Fan Munch Logo" 
            className="app-logo"
          />
          <h1 className="auth-title">{isLogin ? t('auth.title_login') : t('auth.title_register')}</h1>
        </div>
      </div>
      
      {/* Lower Section */}
      <div className="auth-container">

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>


          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">{t('auth.first_name')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder={t('auth.first_name')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('auth.last_name')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder={t('auth.last_name')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('auth.phone') || 'Phone'}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('auth.phone_ph') || '+972 50-123-4567'}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.email_ph')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.password_ph')}
                required
              />
              <button
                type="button"
                className="toggle-visibility"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            {isLogin && (
              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate('/forgot-password')}
              >
                {t('auth.forgot_password')}
              </button>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
              <div className="password-input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t('auth.confirm_password_ph')}
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? t('auth.please_wait') : (isLogin ? t('auth.sign_in') : t('auth.create_account'))}
          </button>
        </form>

        {/* Toggle */}
        <div className="auth-toggle">
          <p className="toggle-text">
            {isLogin ? t('auth.toggle_no_account') : t('auth.toggle_have_account')}
            <button 
              type="button" 
              className="toggle-button" 
              onClick={toggleAuthMode}
            >
              {isLogin ? t('auth.toggle_register_now') : t('auth.toggle_sign_in')}
            </button>
          </p>
        </div>
      </div>
      <Footer />

    </div>
  );
};

export default AuthScreen;
