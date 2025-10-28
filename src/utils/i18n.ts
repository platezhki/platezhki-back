import i18next from 'i18next';
import enTranslations from '../locales/en.json';
import ukTranslations from '../locales/uk.json';
import ruTranslations from '../locales/ru.json';

// Initialize i18next
i18next.init({
  lng: 'ru', // default language
  fallbackLng: 'ru',
  debug: process.env.NODE_ENV === 'development',
  
  resources: {
    en: {
      translation: enTranslations
    },
    uk: {
      translation: ukTranslations
    },
    ru: {
      translation: ruTranslations
    }
  },
  
  interpolation: {
    escapeValue: false // React already does escaping
  }
});

// Translation function that mimics the __() function
export const __ = (key: string, options?: any): string => {
  return i18next.t(key, options) as string;
};

// Function to change language
export const setLanguage = (language: string): void => {
  i18next.changeLanguage(language);
};

// Function to get current language
export const getCurrentLanguage = (): string => {
  return i18next.language;
};

// Function to get available languages
export const getAvailableLanguages = (): string[] => {
  return ['ru', 'en', 'uk'];
};

export default i18next;
