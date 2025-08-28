/**
 * Example CRUD API Performance Test
 * Demonstrates comprehensive API testing patterns
 */

import { BaseTest } from '../../utils/base-test.js';
import { testDataManager } from '../../utils/test-data-manager.js';
import { extractFromResponse, retry } from '../../utils/helpers.js';

class ApiCrudTest extends BaseTest {
  constructor() {
    super();
    this.testName = 'API CRUD Test';
    this.createdResourceId = null;
  }

  setup() {
    this.log(`Starting ${this.testName}`, 'INFO');
    // Validate required environment variables
    const requiredVars = ['API_BASE_URL'];
    requiredVars.forEach(varName => {
      if (!__ENV[varName]) {
        this.log(`Warning: ${varName} not set, using default`, 'WARN');
      }
    });
  }

  runTest() {
    // Execute CRUD operations in sequence
    this.createResource();
    this.readResource();
    this.updateResource();
    this.deleteResource();
  }

  createResource() {
    const userData = testDataManager.createUserPayload();
    
    const response = this.post('/api/users', JSON.stringify(userData), {
      headers: {
        ...this.defaultParams.headers,
        'Content-Type': 'application/json'
      }
    });

    this.checkAndFail(response, 201, {
      'response contains user id': (r) => {
        const data = JSON.parse(r.body);
        return data.id !== undefined;
      }
    });

    this.createdResourceId = extractFromResponse(response, 'id');
    this.log(`Created resource with ID: ${this.createdResourceId}`, 'INFO');
  }

  readResource() {
    if (!this.createdResourceId) {
      this.log('Skipping read test - no resource created', 'WARN');
      return;
    }

    const response = this.get(`/api/users/${this.createdResourceId}`);
    
    this.checkAndFail(response, 200, {
      'response contains expected user data': (r) => {
        const data = JSON.parse(r.body);
        return data.id === this.createdResourceId;
      }
    });

    this.log(`Successfully read resource ${this.createdResourceId}`, 'INFO');
  }

  updateResource() {
    if (!this.createdResourceId) {
      this.log('Skipping update test - no resource created', 'WARN');
      return;
    }

    const updateData = {
      firstName: testDataManager.generateRandomData('string', 8),
      lastName: testDataManager.generateRandomData('string', 10)
    };

    const response = this.put(`/api/users/${this.createdResourceId}`, 
      JSON.stringify(updateData), {
        headers: {
          ...this.defaultParams.headers,
          'Content-Type': 'application/json'
        }
      });

    this.checkAndFail(response, 200);
    this.log(`Successfully updated resource ${this.createdResourceId}`, 'INFO');
  }

  deleteResource() {
    if (!this.createdResourceId) {
      this.log('Skipping delete test - no resource created', 'WARN');
      return;
    }

    // Use retry for delete operation
    const deleteOperation = () => {
      const response = this.delete(`/api/users/${this.createdResourceId}`);
      this.checkAndFail(response, 204);
      return response;
    };

    retry(deleteOperation, 3, 1000);
    this.log(`Successfully deleted resource ${this.createdResourceId}`, 'INFO');
  }

  teardown() {
    this.log(`Completed ${this.testName}`, 'INFO');
  }
}

// Test instance
const apiCrudTest = new ApiCrudTest();

// Export K6 configuration
export const options = apiCrudTest.getOptions();

// Export default function for K6
export default function() {
  apiCrudTest.execute();
}
