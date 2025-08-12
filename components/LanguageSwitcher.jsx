/**
 * Language Switcher Component
 * Part of the unified Language System
 * Allows users to switch between supported languages
 */

import React from 'react';
import { useLanguageSystem } from '../hooks/useLanguageSystem';

const LanguageSwitcher = ({ className = "" }) => {
  const { currentLanguage, switchLanguage, languages } = useLanguageSystem();
  
  const handleLanguageChange = (language) => {
    switchLanguage(language);
  };
  
  return (
    <div className={`language-switcher ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-gray-400 text-sm">Language:</span>
        <div className="flex bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleLanguageChange(languages.EN)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              currentLanguage === languages.EN
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLanguageChange(languages.AR)}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
              currentLanguage === languages.AR
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            AR
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;