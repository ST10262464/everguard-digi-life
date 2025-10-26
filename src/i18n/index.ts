import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      ai: {
        title: 'EverGuard Guardian AI',
        subtitle: 'Your digital partner for safety, privacy, and peace of mind',
        welcomeMessage: "Hello, I'm your EverGuard Guardian Assistant — your digital partner for safety, privacy, and peace of mind.",
        howCanIHelp: 'How can I support you today?',
        placeholder: 'Ask me about data security, emergency planning, or digital privacy...',
        suggestions: {
          setupEmergency: 'Set up an Emergency Capsule',
          secureDocuments: 'Secure my ID documents',
          digitalWill: 'Learn how to manage my digital will'
        }
      },
      emergency: {
        ifEmergency: 'If this is an emergency, please contact',
        gbvHotline: 'GBV Command Centre: 0800 428 428',
        police: 'Police: 10111',
        medical: 'Medical: 112'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;





