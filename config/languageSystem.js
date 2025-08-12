/**
 * Language System - Unified Language Management
 * Centralized system for managing all text content across the application
 * Supports multiple languages with easy switching capability
 */

const LANGUAGES = {
  EN: 'en',
  AR: 'ar'
};

const LANGUAGE_CONTENT = {
  [LANGUAGES.EN]: {
    // Common UI Elements
    common: {
      game: 'Game',
      service: 'Service',
      details: 'Details',
      totalPrice: 'Total Price',
      orderSummary: 'Order Summary',
      notSelected: 'Not Selected',
      paymentMethod: 'Payment Method',
      processing: 'Processing...',
      contactSupport: 'Contact Support',
      purchaseService: 'Purchase Service',
      otherPaymentMethods: 'Other Payment Methods',
      contactSupportForAlternatives: 'Contact support for alternatives'
    },
    
    // Payment System
    payment: {
      coinbaseCommerce: 'Coinbase Commerce',
      crypto: 'Crypto',
      loginRequired: 'Login required',
      paymentProcessingFailed: 'Payment processing failed',
      invalidPaymentMethod: 'Invalid payment method',
      failedToCreateOrder: 'Failed to create order record after successful payment',
      ensureServiceAndPrice: 'Please ensure service and price are selected correctly.',
      contactSupportMessage: 'Please contact our support team for alternative payment methods:\n\nEmail: support@gearscore.com\nDiscord: GearScore#1234\nTelegram: @GearScoreSupport\n\nWe will help you complete the payment process!'
    },
    
    // Game Names
    games: {
      newWorld: 'New World',
      blackDesertOnline: 'Black Desert Online',
      rust: 'Rust',
      pathOfExile: 'Path of Exile',
      pathOfExile2: 'Path of Exile 2',
      warframe: 'Warframe',
      destiny2: 'Destiny 2',
      warThunder: 'War Thunder'
    },
    
    // Services
    services: {
      powerLeveling: 'Power Leveling',
      goldFarming: 'Gold Farming',
      itemFarming: 'Item Farming',
      questCompletion: 'Quest Completion',
      dungeonRuns: 'Dungeon Runs',
      raidCarries: 'Raid Carries',
      pvpBoost: 'PvP Boost',
      achievementUnlock: 'Achievement Unlock'
    }
  },
  
  [LANGUAGES.AR]: {
    // Common UI Elements
    common: {
      game: 'Game',
      service: 'Service',
      details: 'Details',
      totalPrice: 'Total Price',
      orderSummary: 'Order Summary',
      notSelected: 'Not Selected',
      paymentMethod: 'Payment Method',
      processing: 'Processing...',
      contactSupport: 'Contact Support',
      purchaseService: 'Purchase Service',
      otherPaymentMethods: 'Other Payment Methods',
      contactSupportForAlternatives: 'Contact Support for Alternatives'
    },
    
    // Payment System
    payment: {
      coinbaseCommerce: 'Coinbase Commerce',
      crypto: 'Crypto',
      loginRequired: 'Login Required',
      paymentProcessingFailed: 'Payment Processing Failed',
      invalidPaymentMethod: 'Invalid Payment Method',
      failedToCreateOrder: 'Failed to create order record after successful payment',
      ensureServiceAndPrice: 'Please ensure service and price are selected correctly.',
      contactSupportMessage: 'Please contact our support team for alternative payment methods:\n\nEmail: support@gearscore.com\nDiscord: GearScore#1234\nTelegram: @GearScoreSupport\n\nWe will help you complete the payment process!'
    },
    
    // Game Names (keeping English for consistency)
    games: {
      newWorld: 'New World',
      blackDesertOnline: 'Black Desert Online',
      rust: 'Rust',
      pathOfExile: 'Path of Exile',
      pathOfExile2: 'Path of Exile 2',
      warframe: 'Warframe',
      destiny2: 'Destiny 2',
      warThunder: 'War Thunder'
    },
    
    // Services
    services: {
      powerLeveling: 'رفع المستوى',
      goldFarming: 'جمع الذهب',
      itemFarming: 'جمع العناصر',
      questCompletion: 'إكمال المهام',
      dungeonRuns: 'تشغيل الأبراج المحصنة',
      raidCarries: 'حمل الغارات',
      pvpBoost: 'تعزيز PvP',
      achievementUnlock: 'فتح الإنجازات'
    }
  }
};

class LanguageSystem {
  constructor() {
    this.currentLanguage = LANGUAGES.EN; // Default to English
    this.listeners = [];
  }
  
  /**
   * Set the current language
   * @param {string} language - Language code (en, ar)
   */
  setLanguage(language) {
    if (LANGUAGE_CONTENT[language]) {
      this.currentLanguage = language;
      this.notifyListeners();
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', language);
      }
    }
  }
  
  /**
   * Get the current language
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Get text content for a specific key
   * @param {string} category - Category (common, payment, games, services)
   * @param {string} key - Text key
   * @returns {string} Localized text
   */
  getText(category, key) {
    const content = LANGUAGE_CONTENT[this.currentLanguage];
    if (content && content[category] && content[category][key]) {
      return content[category][key];
    }
    
    // Fallback to English if not found
    const fallback = LANGUAGE_CONTENT[LANGUAGES.EN];
    if (fallback && fallback[category] && fallback[category][key]) {
      return fallback[category][key];
    }
    
    return key; // Return key if no translation found
  }
  
  /**
   * Add a listener for language changes
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
  }
  
  /**
   * Remove a listener
   * @param {Function} callback - Callback function to remove
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  /**
   * Notify all listeners of language change
   */
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }
  
  /**
   * Initialize language from localStorage or browser preference
   */
  initialize() {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage && LANGUAGE_CONTENT[savedLanguage]) {
        this.currentLanguage = savedLanguage;
        return;
      }
      
      // Fallback to browser language
      const browserLanguage = navigator.language || navigator.userLanguage;
      if (browserLanguage.startsWith('ar')) {
        this.currentLanguage = LANGUAGES.AR;
      } else {
        this.currentLanguage = LANGUAGES.EN;
      }
    }
  }
}

// Create singleton instance
const languageSystem = new LanguageSystem();

// Initialize on import
if (typeof window !== 'undefined') {
  languageSystem.initialize();
}

export { languageSystem, LANGUAGES };
export default languageSystem;