/**
 * Google API Performance Test
 * Tests the country detection API with proper structure and error handling
 */

import { BaseTest } from '../../utils/base-test.js';
import { testDataManager } from '../../utils/test-data-manager.js';
import { checkResponseData, logMetrics } from '../../utils/helpers.js';

class GoogleApiTest extends BaseTest {
  constructor() {
    super();
    this.testName = 'Google API Test';
    this.apiEndpoint = 'https://api.country.is';
  }

  setup() {
    this.log(`Starting ${this.testName}`, 'INFO');
    this.log(`Target endpoint: ${this.apiEndpoint}`, 'INFO');
    this.log(`Test profile: ${JSON.stringify(this.config.testProfile.stages)}`, 'INFO');
  }

  runTest() {
    this.testCountryDetectionApi();
    this.smartSleep(1, 0.2); // Sleep with 20% jitter
  }

  testCountryDetectionApi() {
    const correlationId = testDataManager.generateRandomData('uuid');
    
    const params = {
      headers: {
        ...this.defaultParams.headers,
        'X-Correlation-ID': correlationId
      }
    };

    const response = this.get(this.apiEndpoint, params);
    
    // Enhanced checks
    const customChecks = {
      'response contains country info': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.hasOwnProperty('country') || data.hasOwnProperty('ip');
        } catch {
          return false;
        }
      },
      'response time acceptable': (r) => r.timings.duration < 3000
    };

    this.checkAndFail(response, 200, customChecks);
    
    // Additional response validation
    checkResponseData(response, ['country', 'ip']);
    
    // Log metrics for monitoring
    logMetrics(response, this.testName);
    
    // Log response for debugging (can be disabled in production)
    if (__ENV.DEBUG === 'true') {
      this.log(`Response: ${response.body}`, 'DEBUG');
    }
  }

  teardown() {
    this.log(`Completed ${this.testName}`, 'INFO');
  }
}

// Test instance
const googleApiTest = new GoogleApiTest();

// Export K6 configuration
export const options = googleApiTest.getOptions();

// Export default function for K6
export default function() {
  googleApiTest.execute();
}
