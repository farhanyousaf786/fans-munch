import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const AppConfigContext = createContext({
  loading: true,
  useTestApis: false,
  paymentMode: 'live',
  stripePublishableKey: null,
  stripePromise: null,
  keysConfigured: true,
  configMessage: null,
});

const getApiBase = () => {
  if (process.env.NODE_ENV !== 'production' && window.location.port === '3000') {
    return 'http://localhost:5001';
  }
  return '';
};

export const AppConfigProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [useTestApis, setUseTestApis] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState(null);
  const [keysConfigured, setKeysConfigured] = useState(true);
  const [configMessage, setConfigMessage] = useState(null);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBase()}/api/config`);
      if (!response.ok) throw new Error('Config request failed');

      const data = await response.json();
      setUseTestApis(!!data.useTestApis);
      setStripePublishableKey(data.stripePublishableKey || null);
      setKeysConfigured(data.keysConfigured !== false);
      setConfigMessage(data.message || null);
    } catch (error) {
      console.warn('[AppConfig] Config unavailable:', error.message);
      setUseTestApis(false);
      setStripePublishableKey(null);
      setKeysConfigured(false);
      setConfigMessage('Could not load payment configuration from the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();

    const intervalId = window.setInterval(loadConfig, 10000);
    const onFocus = () => loadConfig();
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadConfig]);

  const stripePromise = useMemo(
    () => (stripePublishableKey ? loadStripe(stripePublishableKey) : null),
    [stripePublishableKey]
  );

  const value = useMemo(() => ({
    loading,
    useTestApis,
    paymentMode: useTestApis ? 'test' : 'live',
    stripePublishableKey,
    stripePromise,
    keysConfigured,
    configMessage,
  }), [loading, useTestApis, stripePublishableKey, stripePromise, keysConfigured, configMessage]);

  return (
    <AppConfigContext.Provider value={value}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);

export default AppConfigContext;
