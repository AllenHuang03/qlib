// Emergency Null Protection Utility
// This file provides global null/undefined protection mechanisms

console.log('Emergency Null Protection: Initializing global protections...');

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Emergency Null Protection: Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser behavior (like logging to console)
  event.preventDefault();
  
  // You could send this to an error reporting service
  // reportError('unhandled-promise-rejection', event.reason);
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Emergency Null Protection: Global error caught:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Don't prevent default to allow normal error handling
  return false;
});

// Safe object access utility
export const safeGet = (obj: any, path: string, defaultValue: any = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result != null ? result : defaultValue;
  } catch (error) {
    console.warn('Emergency Null Protection: safeGet failed for path:', path, error);
    return defaultValue;
  }
};

// Safe function execution
export const safeExecute = (fn: Function, fallback: any = null, ...args: any[]) => {
  try {
    if (typeof fn !== 'function') {
      console.warn('Emergency Null Protection: Attempted to execute non-function');
      return fallback;
    }
    return fn(...args);
  } catch (error) {
    console.error('Emergency Null Protection: Safe execution failed:', error);
    return fallback;
  }
};

// Safe JSON operations
export const safeJSONParse = (str: string, fallback: any = {}) => {
  try {
    if (!str || typeof str !== 'string') {
      return fallback;
    }
    return JSON.parse(str);
  } catch (error) {
    console.warn('Emergency Null Protection: JSON parse failed:', error);
    return fallback;
  }
};

export const safeJSONStringify = (obj: any, fallback: string = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Emergency Null Protection: JSON stringify failed:', error);
    return fallback;
  }
};

// Safe localStorage operations
export const safeLocalStorage = {
  getItem: (key: string, fallback: any = null) => {
    try {
      if (typeof localStorage === 'undefined') {
        return fallback;
      }
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (error) {
      console.warn('Emergency Null Protection: localStorage getItem failed:', error);
      return fallback;
    }
  },
  
  setItem: (key: string, value: string) => {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Emergency Null Protection: localStorage setItem failed:', error);
      return false;
    }
  },
  
  removeItem: (key: string) => {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Emergency Null Protection: localStorage removeItem failed:', error);
      return false;
    }
  }
};

// Safe DOM operations
export const safeDOMQuery = (selector: string, fallback: any = null) => {
  try {
    if (!selector || typeof document === 'undefined') {
      return fallback;
    }
    return document.querySelector(selector) || fallback;
  } catch (error) {
    console.warn('Emergency Null Protection: DOM query failed:', error);
    return fallback;
  }
};

// Memory leak prevention
export const createWeakMapCache = () => {
  if (typeof WeakMap === 'undefined') {
    console.warn('Emergency Null Protection: WeakMap not supported, using regular Map');
    return new Map();
  }
  return new WeakMap();
};

// Safe array operations
export const safeArrayOperation = (arr: any[], operation: string, ...args: any[]) => {
  try {
    if (!Array.isArray(arr)) {
      console.warn('Emergency Null Protection: Attempted array operation on non-array');
      return [];
    }
    
    switch (operation) {
      case 'map':
        return arr.map(args[0] || ((x) => x));
      case 'filter':
        return arr.filter(args[0] || (() => true));
      case 'reduce':
        return arr.reduce(args[0] || ((acc, curr) => acc), args[1]);
      case 'find':
        return arr.find(args[0] || (() => true));
      default:
        console.warn('Emergency Null Protection: Unknown array operation:', operation);
        return arr;
    }
  } catch (error) {
    console.error('Emergency Null Protection: Array operation failed:', error);
    return [];
  }
};

// Initialize global protections
const initializeProtections = () => {
  // Monkey patch common problematic operations
  const originalQuerySelector = Document.prototype.querySelector;
  Document.prototype.querySelector = function(selector: string) {
    try {
      return originalQuerySelector.call(this, selector);
    } catch (error) {
      console.warn('Emergency Null Protection: Protected querySelector from error:', error);
      return null;
    }
  };

  console.log('Emergency Null Protection: Global protections initialized');
};

// Auto-initialize
try {
  initializeProtections();
} catch (error) {
  console.error('Emergency Null Protection: Failed to initialize protections:', error);
}

export default {
  safeGet,
  safeExecute,
  safeJSONParse,
  safeJSONStringify,
  safeLocalStorage,
  safeDOMQuery,
  createWeakMapCache,
  safeArrayOperation
};