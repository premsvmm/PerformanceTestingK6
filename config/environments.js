/**
 * Environment configuration management
 * Centralized configuration for different environments and test scenarios
 */

export const environments = {
  dev: {
    baseUrl: 'https://api.dev.example.com',
    timeout: 30000,
    maxRedirects: 5
  },
  staging: {
    baseUrl: 'https://api.staging.example.com',
    timeout: 30000,
    maxRedirects: 5
  },
  prod: {
    baseUrl: 'https://api.example.com',
    timeout: 60000,
    maxRedirects: 3
  }
};

export const testProfiles = {
  smoke: {
    stages: [
      { duration: '30s', target: 1 },
      { duration: '1m', target: 1 },
      { duration: '30s', target: 0 }
    ],
    thresholds: {
      http_req_duration: ['p(95)<500'],
      http_req_failed: ['rate<0.01']
    }
  },
  load: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 10 },
      { duration: '2m', target: 0 }
    ],
    thresholds: {
      http_req_duration: ['p(95)<1000'],
      http_req_failed: ['rate<0.05']
    }
  },
  stress: {
    stages: [
      { duration: '2m', target: 10 },
      { duration: '5m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '10m', target: 0 }
    ],
    thresholds: {
      http_req_duration: ['p(95)<2000'],
      http_req_failed: ['rate<0.1']
    }
  },
  spike: {
    stages: [
      { duration: '10s', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '10s', target: 1400 },
      { duration: '3m', target: 1400 },
      { duration: '10s', target: 100 },
      { duration: '3m', target: 100 },
      { duration: '10s', target: 0 }
    ],
    thresholds: {
      http_req_duration: ['p(95)<5000'],
      http_req_failed: ['rate<0.2']
    }
  }
};

export const vpnConfigs = {
  russia: {
    configFile: '/app/vpnconfig/Russia.ovpn',
    country: 'RU'
  },
  usa: {
    configFile: '/app/vpnconfig/usa.ovpn',
    country: 'US'
  }
};

/**
 * Get configuration based on environment variables
 */
export function getConfig() {
  const env = __ENV.ENVIRONMENT || 'dev';
  const profile = __ENV.TEST_PROFILE || 'smoke';
  const vpn = __ENV.VPN_CONFIG || 'russia';
  
  return {
    environment: environments[env] || environments.dev,
    testProfile: testProfiles[profile] || testProfiles.smoke,
    vpnConfig: vpnConfigs[vpn] || vpnConfigs.russia,
    customStages: getCustomStages()
  };
}

/**
 * Build custom stages from environment variables (backward compatibility)
 */
function getCustomStages() {
  const stages = [];
  for (let i = 1; i <= 5; i++) {
    const duration = __ENV[`STAGE_${i}_DUR`];
    const target = __ENV[`STAGE_${i}_VUS`];
    if (duration && target) {
      stages.push({ duration, target: parseInt(target) });
    }
  }
  return stages.length > 0 ? stages : null;
}
