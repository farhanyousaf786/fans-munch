import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const EXIT_PATHS = new Set(['/', '/home', '/onboarding', '/auth', '/splash', '/forgot-password']);

/**
 * Makes Android system back navigate within the SPA instead of exiting.
 * Works with Capacitor if present; also keeps browser history usable.
 */
const AppBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let removeCapacitorListener = null;

    const isExitPath = () => {
      const path = location.pathname;
      return EXIT_PATHS.has(path) || path.startsWith('/auth');
    };

    const goBackInApp = () => {
      if (isExitPath()) return false;
      // Always navigate within SPA; do not rely on Capacitor canGoBack alone
      // (that flag can be wrong for React Router history).
      try {
        if (window.history.length > 1) {
          navigate(-1);
          return true;
        }
      } catch (_) {}
      navigate('/home');
      return true;
    };

    const exitOrMinimize = (App) => {
      if (typeof App?.minimizeApp === 'function') {
        App.minimizeApp();
      } else if (typeof App?.exitApp === 'function') {
        App.exitApp();
      } else if (window.navigator?.app?.exitApp) {
        window.navigator.app.exitApp();
      }
    };

    (async () => {
      try {
        const capacitorApp = await import('@capacitor/app');
        const App = capacitorApp.App || capacitorApp.default?.App || capacitorApp.default;
        if (!App?.addListener) return;
        removeCapacitorListener = await App.addListener('backButton', () => {
          if (goBackInApp()) return;
          exitOrMinimize(App);
        });
      } catch (_) {
        // Not a Capacitor build — browser/history handles back.
      }
    })();

    // Cordova / some Android WebViews
    const onCordovaBack = (e) => {
      e.preventDefault();
      if (!goBackInApp()) exitOrMinimize(null);
    };
    document.addEventListener('backbutton', onCordovaBack, false);

    return () => {
      document.removeEventListener('backbutton', onCordovaBack, false);
      try {
        if (removeCapacitorListener?.remove) removeCapacitorListener.remove();
        else if (typeof removeCapacitorListener === 'function') removeCapacitorListener();
      } catch (_) {}
    };
  }, [location.pathname, navigate]);

  return null;
};

export default AppBackHandler;
