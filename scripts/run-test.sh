#!/bin/bash

# K6 Performance Test Runner Script
# Provides easy interface for running different test scenarios

set -euo pipefail

# Default values
ENVIRONMENT="dev"
TEST_PROFILE="smoke"
TEST_FILE=""
VPN_CONFIG=""
DEBUG="false"
MONITORING="false"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
K6 Performance Test Runner

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV       Set environment (dev, staging, prod) [default: dev]
    -p, --profile PROFILE       Set test profile (smoke, load, stress, spike) [default: smoke]
    -f, --file FILE            Set test file path [default: tests/google/google-api-test.js]
    -v, --vpn CONFIG           Set VPN configuration (russia, usa) [optional]
    -d, --debug                Enable debug mode [default: false]
    -m, --monitoring           Start with monitoring stack [default: false]
    -h, --help                 Show this help message

Examples:
    # Run smoke test
    $0 --profile smoke

    # Run load test with VPN
    $0 --profile load --vpn russia

    # Run custom test file with monitoring
    $0 --file tests/examples/api-crud-test.js --monitoring

    # Run stress test in production environment
    $0 --environment prod --profile stress

Environment Variables:
    VPN_USERNAME               VPN username (required if using VPN)
    VPN_PASSWORD               VPN password (required if using VPN)
    INFLUXDB_URL              InfluxDB URL for metrics storage
    PROMETHEUS_URL            Prometheus URL for metrics export

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--profile)
            TEST_PROFILE="$2"
            shift 2
            ;;
        -f|--file)
            TEST_FILE="$2"
            shift 2
            ;;
        -v|--vpn)
            VPN_CONFIG="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG="true"
            shift
            ;;
        -m|--monitoring)
            MONITORING="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
case $ENVIRONMENT in
    dev|staging|prod)
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT. Must be one of: dev, staging, prod"
        exit 1
        ;;
esac

# Validate test profile
case $TEST_PROFILE in
    smoke|load|stress|spike)
        ;;
    *)
        log_error "Invalid test profile: $TEST_PROFILE. Must be one of: smoke, load, stress, spike"
        exit 1
        ;;
esac

# Set default test file if not provided
if [ -z "$TEST_FILE" ]; then
    TEST_FILE="tests/google/google-api-test.js"
fi

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
    log_error "Test file not found: $TEST_FILE"
    exit 1
fi

# VPN validation
if [ -n "$VPN_CONFIG" ]; then
    if [ -z "${VPN_USERNAME:-}" ] || [ -z "${VPN_PASSWORD:-}" ]; then
        log_error "VPN_USERNAME and VPN_PASSWORD environment variables must be set when using VPN"
        exit 1
    fi
    
    vpn_file="vpnconfig/${VPN_CONFIG}.ovpn"
    if [ ! -f "$vpn_file" ]; then
        log_error "VPN config file not found: $vpn_file"
        exit 1
    fi
fi

# Create necessary directories
mkdir -p reports logs data

log_info "Starting K6 Performance Test"
log_info "Environment: $ENVIRONMENT"
log_info "Profile: $TEST_PROFILE"
log_info "Test File: $TEST_FILE"
log_info "VPN Config: ${VPN_CONFIG:-none}"
log_info "Debug Mode: $DEBUG"
log_info "Monitoring: $MONITORING"

# Prepare Docker Compose command
compose_cmd="docker-compose"
compose_profiles=""

if [ "$MONITORING" = "true" ]; then
    compose_profiles="--profile monitoring"
    log_info "Starting monitoring stack (InfluxDB + Grafana)..."
fi

# Set environment variables for Docker Compose
export ENVIRONMENT
export TEST_PROFILE
export TEST_FILE
export DEBUG
export VPN_CONFIG

# Start monitoring stack if requested
if [ "$MONITORING" = "true" ]; then
    log_info "Starting monitoring services..."
    $compose_cmd $compose_profiles up -d influxdb grafana
    
    # Wait for services to be ready
    log_info "Waiting for monitoring services to be ready..."
    sleep 10
    
    # Set InfluxDB URL for K6
    export INFLUXDB_URL="http://influxdb:8086"
fi

# Run the test
log_info "Running K6 performance test..."
if $compose_cmd up --build k6-performance-test; then
    log_success "Test completed successfully!"
    
    # Show results location
    log_info "Test results saved to: ./reports/"
    log_info "Test logs saved to: ./logs/"
    
    if [ "$MONITORING" = "true" ]; then
        log_info "Grafana dashboard available at: http://localhost:3000 (admin/admin123)"
        log_info "InfluxDB UI available at: http://localhost:8086"
    fi
else
    log_error "Test failed!"
    exit 1
fi

# Cleanup
log_info "Cleaning up containers..."
$compose_cmd down

if [ "$MONITORING" = "true" ]; then
    log_info "Monitoring stack is still running. Use 'docker-compose --profile monitoring down' to stop it."
fi

log_success "Test execution completed!"
