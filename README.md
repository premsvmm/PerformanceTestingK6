# K6 Performance Testing Framework

A comprehensive, enterprise-grade performance testing framework built with K6, featuring VPN support, monitoring integration, and modular test architecture.

## 🚀 Features

- **Modular Architecture**: Object-oriented test design with base classes and utilities
- **Multiple Environments**: Support for dev, staging, and production environments
- **Test Profiles**: Pre-configured test profiles (smoke, load, stress, spike)
- **VPN Integration**: Built-in OpenVPN support for geo-location testing
- **Monitoring Stack**: Integrated InfluxDB and Grafana for real-time metrics
- **Docker Support**: Multi-stage Docker builds with development and production targets
- **Flexible Configuration**: Environment-based configuration management
- **Comprehensive Reporting**: JSON reports with custom metrics and trends

## 📁 Project Structure

```
PerformanceTestingK6/
├── config/
│   └── environments.js          # Environment and test profile configurations
├── utils/
│   ├── base-test.js            # Base test class with common functionality
│   ├── test-data-manager.js    # Test data generation and management
│   └── helpers.js              # Utility functions and helpers
├── tests/
│   ├── google/
│   │   └── google-api-test.js  # Google API performance test
│   └── examples/
│       └── api-crud-test.js    # Example CRUD API test
├── scripts/
│   └── run-test.sh             # Test runner script
├── monitoring/
│   └── grafana/                # Grafana configuration
├── vpnconfig/                  # VPN configuration files
├── reports/                    # Test reports output
├── logs/                       # Application logs
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Multi-stage Docker build
└── entrypoint.sh              # Container entrypoint script
```

## 🛠 Quick Start

### Prerequisites

- Docker and Docker Compose
- VPN credentials (optional, for geo-location testing)

### 1. Basic Test Execution

```bash
# Run smoke test (default)
./scripts/run-test.sh

# Run load test
./scripts/run-test.sh --profile load

# Run with monitoring stack
./scripts/run-test.sh --profile load --monitoring
```

### 2. Using Docker Compose

```bash
# Basic test run
docker-compose up k6-performance-test

# With monitoring
docker-compose --profile monitoring up -d
docker-compose up k6-performance-test

# Development mode
docker-compose --profile dev up -d k6-dev
```

### 3. Custom Test Execution

```bash
# Run custom test file
./scripts/run-test.sh --file tests/examples/api-crud-test.js

# Run with VPN
export VPN_USERNAME=your_username
export VPN_PASSWORD=your_password
./scripts/run-test.sh --vpn russia --profile stress
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT` | Target environment (dev/staging/prod) | `dev` | No |
| `TEST_PROFILE` | Test profile (smoke/load/stress/spike) | `smoke` | No |
| `TEST_FILE` | Path to test file | `tests/google/google-api-test.js` | No |
| `DEBUG` | Enable debug logging | `false` | No |
| `VPN_USERNAME` | VPN username | - | For VPN |
| `VPN_PASSWORD` | VPN password | - | For VPN |
| `VPN_CONFIG` | VPN configuration (russia/usa) | `russia` | No |
| `INFLUXDB_URL` | InfluxDB connection URL | - | For monitoring |

### Test Profiles

#### Smoke Test
- **Purpose**: Basic functionality validation
- **Load**: 1 user for 1 minute
- **Thresholds**: p(95) < 500ms, error rate < 1%

#### Load Test
- **Purpose**: Normal expected load
- **Load**: 10 users for 5 minutes
- **Thresholds**: p(95) < 1000ms, error rate < 5%

#### Stress Test
- **Purpose**: Beyond normal capacity
- **Load**: Ramp up to 100 users over 12 minutes
- **Thresholds**: p(95) < 2000ms, error rate < 10%

#### Spike Test
- **Purpose**: Sudden traffic spikes
- **Load**: Spike to 1400 users
- **Thresholds**: p(95) < 5000ms, error rate < 20%

## 🧪 Writing Tests

### Basic Test Structure

```javascript
import { BaseTest } from '../utils/base-test.js';

class MyApiTest extends BaseTest {
  constructor() {
    super();
    this.testName = 'My API Test';
  }

  setup() {
    this.log('Starting test setup', 'INFO');
  }

  runTest() {
    const response = this.get('/api/endpoint');
    this.checkAndFail(response, 200);
  }

  teardown() {
    this.log('Test completed', 'INFO');
  }
}

const test = new MyApiTest();
export const options = test.getOptions();
export default function() { test.execute(); }
```

### Using Test Data Manager

```javascript
import { testDataManager } from '../utils/test-data-manager.js';

// Generate random data
const userData = testDataManager.createUserPayload();
const email = testDataManager.generateRandomData('email');

// Load data from file
const testData = testDataManager.loadFromFile('./data/users.json');
```

## 📊 Monitoring and Reporting

### Grafana Dashboard

When running with monitoring enabled:
- **URL**: http://localhost:3000
- **Credentials**: admin/admin123
- **Features**: Real-time metrics, custom dashboards, alerting

### InfluxDB

- **URL**: http://localhost:8086
- **Database**: k6-metrics
- **Organization**: k6-org

### Reports

Test results are automatically saved to:
- **JSON Reports**: `./reports/test_results_YYYYMMDD_HHMMSS.json`
- **Logs**: `./logs/k6_YYYYMMDD_HHMMSS.log`

## 🌐 VPN Configuration

### Supported VPN Providers

1. **OpenVPN**: Place `.ovpn` files in `vpnconfig/` directory
2. **Windscribe**: HTTP proxy support via Docker Compose

### VPN Usage

```bash
# Set VPN credentials
export VPN_USERNAME=your_username
export VPN_PASSWORD=your_password

# Run test with VPN
./scripts/run-test.sh --vpn russia --profile load
```

## 🐳 Docker Commands

### Build Images

```bash
# Production image
docker build --target production -t k6-performance-test .

# Development image
docker build --target development -t k6-performance-test-dev .
```

### Run Containers

```bash
# Basic test run
docker run --rm \
  -e ENVIRONMENT=dev \
  -e TEST_PROFILE=smoke \
  -v $(pwd)/reports:/app/reports \
  k6-performance-test

# With VPN
docker run --rm \
  --cap-add=NET_ADMIN \
  --device /dev/net/tun \
  -e VPN_USERNAME=username \
  -e VPN_PASSWORD=password \
  -v $(pwd)/reports:/app/reports \
  k6-performance-test
```

## 🔍 Troubleshooting

### Common Issues

1. **VPN Connection Failed**
   - Verify VPN credentials
   - Check VPN configuration file exists
   - Ensure container has NET_ADMIN capability

2. **Test File Not Found**
   - Verify file path is correct
   - Check file exists in container
   - Use absolute paths from `/app/`

3. **Permission Denied**
   - Ensure scripts are executable: `chmod +x scripts/*.sh`
   - Check Docker daemon is running
   - Verify user permissions for Docker

### Debug Mode

Enable debug logging:
```bash
./scripts/run-test.sh --debug
# or
export DEBUG=true
```

## 📈 Performance Optimization

### Container Optimization
- Multi-stage builds reduce image size
- Non-root user for security
- Health checks for reliability

### Test Optimization
- Smart sleep with jitter prevents thundering herd
- Connection pooling and keep-alive
- Custom metrics for detailed analysis

## 🤝 Contributing

1. Follow the established patterns in `BaseTest` class
2. Add comprehensive error handling
3. Include proper logging and metrics
4. Update documentation for new features
5. Test with different profiles and environments

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Legacy Commands (Deprecated)

The following commands are kept for reference but should be replaced with the new framework:

```bash
# Old way (deprecated)
docker run -e APP=Google -e FILE=googlebrowse -e STAGE_1_DUR=1m -e STAGE_1_VUS=3 ae1986694f40

# New way (recommended)
./scripts/run-test.sh --profile smoke --file tests/google/google-api-test.js
```

### Legacy Environment Variables
- `APP` → Use `TEST_FILE` with full path
- `FILE` → Use `TEST_FILE` with full path  
- `STAGE_X_DUR` → Use `TEST_PROFILE` or custom configuration
- `STAGE_X_VUS` → Use `TEST_PROFILE` or custom configuration