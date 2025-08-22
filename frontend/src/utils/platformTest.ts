// Platform Test Utility
// This file performs basic platform compatibility checks

console.log('Platform Test: Starting compatibility checks...');

// Check for required browser features
const checkBrowserSupport = () => {
  const features = {
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof Storage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined',
    es6: (() => {
      try {
        new Function('(a = 0) => a');
        return true;
      } catch (err) {
        return false;
      }
    })(),
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) {
        return false;
      }
    })(),
    webWorkers: typeof Worker !== 'undefined',
    crypto: typeof crypto !== 'undefined'
  };

  const unsupportedFeatures = Object.entries(features)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature);

  if (unsupportedFeatures.length > 0) {
    console.warn('Platform Test: Unsupported features detected:', unsupportedFeatures);
  } else {
    console.log('Platform Test: All required features supported');
  }

  return {
    allSupported: unsupportedFeatures.length === 0,
    features,
    unsupportedFeatures
  };
};

// Detect platform type
const detectPlatform = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  const platformInfo = {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    browser: {
      isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
      isChrome: /Chrome/i.test(userAgent),
      isFirefox: /Firefox/i.test(userAgent),
      isEdge: /Edg/i.test(userAgent),
      isIE: /MSIE|Trident/i.test(userAgent)
    },
    platform: platform,
    userAgent: userAgent
  };

  console.log('Platform Test: Platform detected:', platformInfo);
  return platformInfo;
};

// Check performance capabilities
const checkPerformance = () => {
  const performance = {
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
    connection: (navigator as any).connection ? {
      effectiveType: (navigator as any).connection.effectiveType,
      downlink: (navigator as any).connection.downlink,
      rtt: (navigator as any).connection.rtt
    } : null
  };

  console.log('Platform Test: Performance info:', performance);
  return performance;
};

// Run all tests
const runPlatformTests = () => {
  console.log('Platform Test: Running comprehensive platform tests...');
  
  const results = {
    browserSupport: checkBrowserSupport(),
    platform: detectPlatform(),
    performance: checkPerformance(),
    timestamp: new Date().toISOString()
  };

  // Store results globally for debugging
  (window as any).__PLATFORM_TEST_RESULTS__ = results;
  
  console.log('Platform Test: Complete. Results stored in window.__PLATFORM_TEST_RESULTS__');
  return results;
};

// Auto-run tests
try {
  runPlatformTests();
} catch (error) {
  console.error('Platform Test: Failed to run platform tests:', error);
}

export {
  checkBrowserSupport,
  detectPlatform,
  checkPerformance,
  runPlatformTests
};

export default {
  checkBrowserSupport,
  detectPlatform,
  checkPerformance,
  runPlatformTests
};