/**
 * Utility helpers for K6 performance tests
 * Common functions used across different test scenarios
 */

import { check } from 'k6';

/**
 * Wait for a condition to be true with timeout
 */
export function waitFor(condition, timeoutMs = 30000, intervalMs = 1000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return true;
    }
    sleep(intervalMs / 1000);
  }
  
  return false;
}

/**
 * Retry a function with exponential backoff
 */
export function retry(fn, maxAttempts = 3, baseDelayMs = 1000) {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      return fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      sleep(delay / 1000);
    }
  }
}

/**
 * Generate random delay for load distribution
 */
export function randomSleep(minSeconds = 0.5, maxSeconds = 2) {
  const delay = Math.random() * (maxSeconds - minSeconds) + minSeconds;
  sleep(delay);
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if response contains expected data
 */
export function checkResponseData(response, expectedKeys = []) {
  const checks = {
    'response has body': (r) => r.body && r.body.length > 0,
    'response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    }
  };

  // Add checks for expected keys
  expectedKeys.forEach(key => {
    checks[`response contains ${key}`] = (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.hasOwnProperty(key);
      } catch {
        return false;
      }
    };
  });

  return check(response, checks);
}

/**
 * Extract data from response body
 */
export function extractFromResponse(response, path) {
  try {
    const data = JSON.parse(response.body);
    return path.split('.').reduce((obj, key) => obj && obj[key], data);
  } catch (error) {
    console.error(`Failed to extract ${path} from response: ${error.message}`);
    return null;
  }
}

/**
 * Create correlation ID for request tracking
 */
export function createCorrelationId() {
  return `k6-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log performance metrics
 */
export function logMetrics(response, testName = 'Unknown') {
  const metrics = {
    test: testName,
    status: response.status,
    duration: response.timings.duration,
    size: response.body ? response.body.length : 0,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[METRICS] ${JSON.stringify(metrics)}`);
}

/**
 * Validate environment variables
 */
export function validateEnvironment(requiredVars = []) {
  const missing = requiredVars.filter(varName => !__ENV[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get current VU and iteration info
 */
export function getExecutionInfo() {
  return {
    vuId: __VU,
    iteration: __ITER,
    timestamp: Date.now()
  };
}

/**
 * Create weighted random selector
 */
export function createWeightedSelector(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  return function() {
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }
    
    return items[items.length - 1].value;
  };
}

/**
 * Parse and validate JSON response
 */
export function parseJsonResponse(response, schema = null) {
  try {
    const data = JSON.parse(response.body);
    
    if (schema) {
      // Basic schema validation
      for (const [key, type] of Object.entries(schema)) {
        if (typeof data[key] !== type) {
          throw new Error(`Expected ${key} to be ${type}, got ${typeof data[key]}`);
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error(`JSON parsing failed: ${error.message}`);
    throw error;
  }
}
