import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import South African language translation files
import en from './locales/en.json';      // English
import af from './locales/af.json';      // Afrikaans
import zu from './locales/zu.json';      // Zulu
import xh from './locales/xh.json';      // Xhosa
import nso from './locales/nso.json';    // Northern Sotho
import tn from './locales/tn.json';      // Tswana
import ss from './locales/ss.json';      // Swati
import ve from './locales/ve.json';      // Venda
import ts from './locales/ts.json';      // Tsonga
import nr from './locales/nr.json';      // Ndebele

const resources = {
  en: { translation: en },
  af: { translation: af },
  zu: { translation: zu },
  xh: { translation: xh },
  nso: { translation: nso },
  tn: { translation: tn },
  ss: { translation: ss },
  ve: { translation: ve },
  ts: { translation: ts },
  nr: { translation: nr }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
