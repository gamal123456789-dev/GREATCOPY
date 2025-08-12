/**
 * Utility functions for clipboard operations with fallback support
 */

/**
 * Copy text to clipboard with fallback mechanisms
 * @param {string} text - Text to copy to clipboard
 * @param {Function} onSuccess - Callback function on successful copy
 * @param {Function} onError - Callback function on error
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function copyToClipboard(text, onSuccess = null, onError = null) {
  try {
    // Method 1: Modern Clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      if (onSuccess) onSuccess();
      return true;
    }
    
    // Method 2: Fallback using document.execCommand (deprecated but widely supported)
    if (document.execCommand) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        if (onSuccess) onSuccess();
        return true;
      }
    }
    
    // Method 3: Last resort - show text in prompt for manual copy
    const userCopy = prompt('Copy this text manually:', text);
    if (userCopy !== null) {
      if (onSuccess) onSuccess();
      return true;
    }
    
    throw new Error('All clipboard methods failed');
    
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    if (onError) onError(error);
    return false;
  }
}

/**
 * Check if clipboard API is available
 * @returns {boolean} - True if clipboard API is available
 */
export function isClipboardSupported() {
  return !!(navigator.clipboard && navigator.clipboard.writeText) || !!document.execCommand;
}

/**
 * Copy text with visual feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} buttonElement - Button element to show feedback on
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} - Success status
 */
export async function copyWithFeedback(text, buttonElement, options = {}) {
  const {
    successIcon = '<svg class="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>',
    errorIcon = '<svg class="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>',
    feedbackDuration = 1500
  } = options;
  
  if (!buttonElement) {
    return await copyToClipboard(text);
  }
  
  const originalHTML = buttonElement.innerHTML;
  
  const success = await copyToClipboard(
    text,
    () => {
      // Success callback
      buttonElement.innerHTML = successIcon;
    },
    (error) => {
      // Error callback
      buttonElement.innerHTML = errorIcon;
      console.error('Copy failed:', error);
    }
  );
  
  // Restore original content after feedback duration
  setTimeout(() => {
    buttonElement.innerHTML = originalHTML;
  }, feedbackDuration);
  
  return success;
}