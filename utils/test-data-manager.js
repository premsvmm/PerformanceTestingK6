/**
 * Test Data Manager
 * Handles test data loading, generation, and management
 */

import { SharedArray } from 'k6/data';

export class TestDataManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Load test data from JSON file using SharedArray for memory efficiency
   */
  loadFromFile(filePath, dataKey = 'default') {
    if (this.cache.has(dataKey)) {
      return this.cache.get(dataKey);
    }

    const data = new SharedArray(dataKey, function() {
      return JSON.parse(open(filePath));
    });

    this.cache.set(dataKey, data);
    return data;
  }

  /**
   * Generate random test data
   */
  generateRandomData(type, count = 1) {
    const generators = {
      email: () => `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      username: () => `user${Math.random().toString(36).substr(2, 8)}`,
      password: () => Math.random().toString(36).substr(2, 12),
      phone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      uuid: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }),
      number: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
      string: (length = 10) => Math.random().toString(36).substr(2, length)
    };

    if (!generators[type]) {
      throw new Error(`Unknown data type: ${type}`);
    }

    return count === 1 ? generators[type]() : Array.from({ length: count }, () => generators[type]());
  }

  /**
   * Get random item from array
   */
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Create user payload for API testing
   */
  createUserPayload(overrides = {}) {
    return {
      username: this.generateRandomData('username'),
      email: this.generateRandomData('email'),
      password: this.generateRandomData('password'),
      firstName: this.generateRandomData('string', 8),
      lastName: this.generateRandomData('string', 10),
      phone: this.generateRandomData('phone'),
      ...overrides
    };
  }

  /**
   * Create product payload for e-commerce testing
   */
  createProductPayload(overrides = {}) {
    return {
      id: this.generateRandomData('uuid'),
      name: `Product ${this.generateRandomData('string', 6)}`,
      price: this.generateRandomData('number', 10, 1000),
      category: this.getRandomItem(['Electronics', 'Clothing', 'Books', 'Home', 'Sports']),
      inStock: Math.random() > 0.1,
      ...overrides
    };
  }

  /**
   * Environment-specific data
   */
  getEnvironmentData() {
    const env = __ENV.ENVIRONMENT || 'dev';
    
    const envData = {
      dev: {
        apiKey: 'dev-api-key-123',
        clientId: 'dev-client-id',
        baseUrl: 'https://api.dev.example.com'
      },
      staging: {
        apiKey: 'staging-api-key-456',
        clientId: 'staging-client-id',
        baseUrl: 'https://api.staging.example.com'
      },
      prod: {
        apiKey: 'prod-api-key-789',
        clientId: 'prod-client-id',
        baseUrl: 'https://api.example.com'
      }
    };

    return envData[env] || envData.dev;
  }
}

// Singleton instance
export const testDataManager = new TestDataManager();
