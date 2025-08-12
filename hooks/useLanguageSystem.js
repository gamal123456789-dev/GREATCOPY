/**
 * useLanguageSystem Hook
 * React hook for integrating with the unified Language System
 * Provides easy access to localized text and language switching
 */

import { useState, useEffect } from 'react';
import languageSystem, { LANGUAGES } from '../config/languageSystem';

/**
 * Custom hook for using the Language System
 * @returns {Object} Language system utilities
 */
export const useLanguageSystem = () => {
  const [currentLanguage, setCurrentLanguage] = useState(languageSystem.getCurrentLanguage());
  
  useEffect(() => {
    // Listen for language changes
    const handleLanguageChange = (newLanguage) => {
      setCurrentLanguage(newLanguage);
    };
    
    languageSystem.addListener(handleLanguageChange);
    
    // Cleanup listener on unmount
    return () => {
      languageSystem.removeListener(handleLanguageChange);
    };
  }, []);
  
  /**
   * Get localized text
   * @param {string} category - Text category (common, payment, games, services)
   * @param {string} key - Text key
   * @returns {string} Localized text
   */
  const getText = (category, key) => {
    return languageSystem.getText(category, key);
  };
  
  /**
   * Switch to a different language
   * @param {string} language - Language code (en, ar)
   */
  const switchLanguage = (language) => {
    languageSystem.setLanguage(language);
  };
  
  /**
   * Toggle between English and Arabic
   */
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === LANGUAGES.EN ? LANGUAGES.AR : LANGUAGES.EN;
    switchLanguage(newLanguage);
  };
  
  /**
   * Check if current language is RTL (Right-to-Left)
   * @returns {boolean} True if RTL language
   */
  const isRTL = () => {
    return currentLanguage === LANGUAGES.AR;
  };
  
  /**
   * Get language direction for CSS
   * @returns {string} 'rtl' or 'ltr'
   */
  const getDirection = () => {
    return isRTL() ? 'rtl' : 'ltr';
  };
  
  return {
    currentLanguage,
    getText,
    switchLanguage,
    toggleLanguage,
    isRTL,
    getDirection,
    languages: LANGUAGES
  };
};

export default useLanguageSystem;