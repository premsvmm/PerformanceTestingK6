/**
 * Base test class providing common functionality for all performance tests
 * Implements Template Method pattern for consistent test structure
 */

import http from 'k6/http';
import { check, fail, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { getConfig } from '../config/environments.js';

// Custom metrics
export const errorRate = new Rate('custom_error_rate');
export const customTrend = new Trend('custom_response_time');
export const requestCounter = new Counter('custom_requests');

export class BaseTest {
  constructor() {
    this.config = getConfig();
    this.baseUrl = this.config.environment.baseUrl;
    this.defaultParams = {
      timeout: this.config.environment.timeout,
      redirects: this.config.environment.maxRedirects,
      headers: {
        'User-Agent': 'K6-Performance-Test/1.0',
        'Accept': 'application/json'
      }
    };
  }

  /**
   * Template method - defines the test execution flow
   */
  execute() {
    this.setup();
    this.runTest();
    this.teardown();
  }

  /**
   * Setup method - override in subclasses for test-specific setup
   */
  setup() {
    // Default implementation - can be overridden
  }

  /**
   * Main test execution - must be implemented by subclasses
   */
  runTest() {
    throw new Error('runTest() must be implemented by subclass');
  }

  /**
   * Teardown method - override in subclasses for cleanup
   */
  teardown() {
    // Default implementation - can be overridden
  }

  /**
   * Make HTTP GET request with error handling and metrics
   */
  get(url, params = {}) {
    return this.makeRequest('GET', url, null, params);
  }

  /**
   * Make HTTP POST request with error handling and metrics
   */
  post(url, payload = null, params = {}) {
    return this.makeRequest('POST', url, payload, params);
  }

  /**
   * Make HTTP PUT request with error handling and metrics
   */
  put(url, payload = null, params = {}) {
    return this.makeRequest('PUT', url, payload, params);
  }

  /**
   * Make HTTP DELETE request with error handling and metrics
   */
  delete(url, params = {}) {
    return this.makeRequest('DELETE', url, null, params);
  }

  /**
   * Generic HTTP request method with built-in error handling and metrics
   */
  makeRequest(method, url, payload = null, params = {}) {
    const mergedParams = { ...this.defaultParams, ...params };
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    
    let response;
    const startTime = Date.now();
    
    try {
      switch (method.toUpperCase()) {
        case 'GET':
          response = http.get(fullUrl, mergedParams);
          break;
        case 'POST':
          response = http.post(fullUrl, payload, mergedParams);
          break;
        case 'PUT':
          response = http.put(fullUrl, payload, mergedParams);
          break;
        case 'DELETE':
          response = http.del(fullUrl, mergedParams);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      // Record custom metrics
      const duration = Date.now() - startTime;
      customTrend.add(duration);
      requestCounter.add(1);
      errorRate.add(response.status >= 400);

      return response;
    } catch (error) {
      errorRate.add(1);
      console.error(`Request failed: ${method} ${fullUrl} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Enhanced check method with automatic failure handling
   */
  checkAndFail(response, expectedStatus = 200, customChecks = {}) {
    const checks = {
      [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
      'response time < 5000ms': (r) => r.timings.duration < 5000,
      ...customChecks
    };

    const result = check(response, checks);
    
    if (!result) {
      const errorMsg = `Check failed for ${response.request.method} ${response.url}. ` +
                      `Status: ${response.status}, Expected: ${expectedStatus}`;
      console.error(errorMsg);
      fail(errorMsg);
    }

    return result;
  }

  /**
   * Smart sleep with jitter to avoid thundering herd
   */
  smartSleep(baseTime = 1, jitterPercent = 0.1) {
    const jitter = baseTime * jitterPercent * (Math.random() - 0.5) * 2;
    const sleepTime = Math.max(0.1, baseTime + jitter);
    sleep(sleepTime);
  }

  /**
   * Log test information
   */
  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  /**
   * Get test options with proper configuration
   */
  getOptions() {
    const stages = this.config.customStages || this.config.testProfile.stages;
    
    return {
      stages: stages,
      thresholds: this.config.testProfile.thresholds,
      summaryTrendStats: ['min', 'avg', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)'],
      setupTimeout: '60s',
      teardownTimeout: '60s'
    };
  }
}
