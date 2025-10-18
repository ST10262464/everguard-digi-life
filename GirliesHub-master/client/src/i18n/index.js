import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import af from './locales/af.json';
import zu from './locales/zu.json';
import xh from './locales/xh.json';
import st from './locales/st.json';
import tn from './locales/tn.json';
import ss from './locales/ss.json';
import ve from './locales/ve.json';
import ts from './locales/ts.json';
import nr from './locales/nr.json';
import nso from './locales/nso.json';

const resources = {
  en: { translation: en },
  af: { translation: af },
  zu: { translation: zu },
  xh: { translation: xh },
  st: { translation: st },
  tn: { translation: tn },
  ss: { translation: ss },
  ve: { translation: ve },
  ts: { translation: ts },
  nr: { translation: nr },
  nso: { translation: nso },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
