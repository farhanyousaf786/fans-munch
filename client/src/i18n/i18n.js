import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsStorage } from '../utils/storage';
import enOverrides from './locales/en.json';
import heOverrides from './locales/he.json';

// Built-in default translations (safe fallback)
const translations = {
  en: {
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      back: 'Back',
    },
    nav: {
      home: 'Home',
      menu: 'Menu',
      orders: 'Orders',
      cart: 'Cart',
      profile: 'Profile',
    },
    profile: {
      logout: 'Logout',
      active: 'Active',
      completed: 'Completed',
      settings: 'Settings',
      language: 'Language',
      language_sub: 'Choose your language',
      about: 'About app',
      about_sub: 'Version and info',
      terms: 'Terms and conditions',
      terms_sub: 'Read our terms',
      feedback: 'Feedback',
      feedback_sub: 'Tell us what you think',
      privacy: 'Privacy policy',
      privacy_sub: 'How we handle data',
      report: 'Report a Problem',
      report_sub: 'Something not working?',
    },
    orders: {
      order: 'Order',
      my_orders: 'My Orders',
      subtitle: 'Track your food orders',
      active: 'Active',
      completed: 'Completed',
      loading: 'Loading your orders...',
      error_loading: 'Error Loading Orders',
      try_again: 'Try Again',
      no_orders: 'No orders',
      empty_hint: 'Your orders will appear here',
      items: 'Items',
      track: 'Track Order',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      pending: 'Pending',
      preparing: 'Preparing',
      delivering: 'Delivering',
    },
    track: {
      show_qr: 'Show QR Code',
      order: 'Order',
      order_received: 'Order Received',
      preparing: 'Preparing',
      on_the_way: 'On the way',
      delivered: 'Delivered',
      loading: 'Loading…',
      no_code: 'No code',
      items: 'Items',
      item: 'Item',
      qty: 'Qty',
      no_items: 'No items',
    },
    settings: {
      select_language: 'Select Language',
      app_language: 'App Language',
      current: 'Current',
      english: 'English',
      hebrew: 'Hebrew',
      about_title: 'About App',
      terms_title: 'Terms and Conditions',
      privacy_title: 'Privacy Policy',
      feedback_title: 'Feedback',
      report_title: 'Report a Problem',
      feedback_thanks: "Thanks for your feedback! We'll review it shortly.",
      report_thanks: 'Thanks, we received your report. Our team will investigate.',
      share_thoughts: 'Share your thoughts',
      email_optional: 'Email (optional)',
      category: 'Category',
      message: 'Message',
      send: 'Send',
      submit: 'Submit',
      general: 'General',
      feature: 'Feature Request',
      design_ui: 'Design / UI',
      performance: 'Performance',
      what_wrong: 'What went wrong?',
      rtl_note: 'The interface direction will switch automatically for Hebrew (RTL).',
    },
  },
  he: {
    common: {
      ok: 'אישור',
      cancel: 'ביטול',
      back: 'חזרה',
    },
    nav: {
      home: 'בית',
      menu: 'תפריט',
      orders: 'הזמנות',
      cart: 'עגלה',
      profile: 'פרופיל',
    },
    profile: {
      logout: 'התנתקות',
      active: 'פעיל',
      completed: 'הושלמו',
      settings: 'הגדרות',
      language: 'שפה',
      language_sub: 'בחרו את השפה',
      about: 'אודות האפליקציה',
      about_sub: 'גרסה ומידע',
      terms: 'תנאים והגבלות',
      terms_sub: 'קריאת התנאים שלנו',
      feedback: 'משוב',
      feedback_sub: 'ספרו לנו מה דעתכם',
      privacy: 'מדיניות פרטיות',
      privacy_sub: 'איך אנחנו מטפלים בנתונים',
      report: 'דיווח על בעיה',
      report_sub: 'משהו לא עובד?',
    },
    orders: {
      order: 'הזמנה',
      my_orders: 'ההזמנות שלי',
      subtitle: 'עקבו אחרי הזמנות האוכל שלכם',
      active: 'פעיל',
      completed: 'הושלמו',
      loading: 'טוען את ההזמנות…',
      error_loading: 'שגיאה בטעינת הזמנות',
      try_again: 'נסו שוב',
      no_orders: 'אין הזמנות',
      empty_hint: 'ההזמנות שלכם יופיעו כאן',
      items: 'פריטים',
      track: 'עקוב אחרי הזמנה',
      delivered: 'נמסרה',
      cancelled: 'בוטלה',
      pending: 'ממתינה',
      preparing: 'בהכנה',
      delivering: 'בדרך',
    },
    track: {
      show_qr: 'הצג קוד QR',
      order: 'הזמנה',
      order_received: 'ההזמנה התקבלה',
      preparing: 'בהכנה',
      on_the_way: 'בדרך',
      delivered: 'נמסרה',
      loading: 'טוען…',
      no_code: 'אין קוד',
      items: 'פריטים',
      item: 'פריט',
      qty: 'כמות',
      no_items: 'אין פריטים',
    },
    settings: {
      select_language: 'בחרו שפה',
      app_language: 'שפת האפליקציה',
      current: 'נוכחית',
      english: 'אנגלית',
      hebrew: 'עברית',
      about_title: 'אודות האפליקציה',
      terms_title: 'תנאים והגבלות',
      privacy_title: 'מדיניות פרטיות',
      feedback_title: 'משוב',
      report_title: 'דיווח על בעיה',
      feedback_thanks: 'תודה על המשוב! נעבור עליו בקרוב.',
      report_thanks: 'תודה, קיבלנו את הדיווח. הצוות יבדוק את העניין.',
      share_thoughts: 'שתפו אותנו',
      email_optional: 'אימייל (אופציונלי)',
      category: 'קטגוריה',
      message: 'הודעה',
      send: 'שליחה',
      submit: 'שליחה',
      general: 'כללי',
      feature: 'בקשת פיצ׳ר',
      design_ui: 'עיצוב / ממשק',
      performance: 'ביצועים',
      what_wrong: 'מה לא עבד?',
      rtl_note: 'כיוון הממשק יעבור אוטומטית לימין- לשמאל בעברית (RTL).',
    },
  },
};

// Deep merge util to allow JSON overrides without losing defaults
function deepMerge(target, source) {
  if (!source) return target;
  const output = Array.isArray(target) ? [...target] : { ...target };
  Object.keys(source).forEach((key) => {
    const srcVal = source[key];
    const tgtVal = output[key];
    if (
      srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)
    ) {
      output[key] = deepMerge(tgtVal && typeof tgtVal === 'object' ? tgtVal : {}, srcVal);
    } else {
      output[key] = srcVal;
    }
  });
  return output;
}

const I18nContext = createContext({
  lang: 'en',
  t: (key) => key,
  setLang: () => {},
});

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(settingsStorage.getLanguagePreference() || 'en');

  useEffect(() => {
    const handler = (e) => {
      if (e.detail) setLang(e.detail);
    };
    window.addEventListener('language-changed', handler);
    return () => window.removeEventListener('language-changed', handler);
  }, []);

  // Apply JSON overrides on top of defaults if present
  const dict = useMemo(() => {
    const base = translations[lang] || translations.en;
    const override = lang === 'he' ? heOverrides : enOverrides; // defaults for unknown -> en
    return deepMerge(base, override);
  }, [lang]);

  const t = useMemo(() => {
    return (path) => {
      const parts = path.split('.');
      let cur = dict;
      for (const p of parts) {
        cur = cur?.[p];
        if (cur == null) return path;
      }
      return typeof cur === 'string' ? cur : path;
    };
  }, [dict]);

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
