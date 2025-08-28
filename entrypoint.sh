#!/bin/bash

# Enhanced entrypoint script for K6 performance testing
# Supports VPN configuration, flexible test execution, and proper logging

set -euo pipefail

# Configuration
LOG_LEVEL="${LOG_LEVEL:-info}"
DEBUG="${DEBUG:-false}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
TEST_PROFILE="${TEST_PROFILE:-smoke}"

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" | tee -a /app/logs/entrypoint.log
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Cleanup function
cleanup() {
    log "INFO" "Cleaning up..."
    if [ -n "${vpn_pid:-}" ]; then
        kill "$vpn_pid" 2>/dev/null || true
    fi
    rm -f /app/vpnconfig/auth.txt
}

trap cleanup EXIT

log "INFO" "Starting K6 Performance Testing Container"
log "INFO" "Environment: $ENVIRONMENT, Profile: $TEST_PROFILE, Debug: $DEBUG"

# VPN Configuration (optional)
if [ -n "${VPN_USERNAME:-}" ] && [ -n "${VPN_PASSWORD:-}" ]; then
    log "INFO" "Configuring VPN connection"
    
    vpn_config="${VPN_CONFIG:-russia}"
    case "$vpn_config" in
        "russia")
            config_file="/app/vpnconfig/Russia.ovpn"
            ;;
        "usa")
            config_file="/app/vpnconfig/usa.ovpn"
            ;;
        *)
            config_file="/app/vpnconfig/$vpn_config.ovpn"
            ;;
    esac
    
    if [ ! -f "$config_file" ]; then
        error_exit "VPN config file not found: $config_file"
    fi
    
    # Create auth file
    auth_file="/app/vpnconfig/auth.txt"
    echo "$VPN_USERNAME" > "$auth_file"
    echo "$VPN_PASSWORD" >> "$auth_file"
    chmod 600 "$auth_file"
    
    # Start VPN
    log "INFO" "Starting OpenVPN with config: $config_file"
    openvpn --config "$config_file" --auth-user-pass "$auth_file" --daemon
    vpn_pid=$!
    
    # Wait for VPN to establish connection
    log "INFO" "Waiting for VPN connection..."
    sleep 15
    
    # Verify VPN connection
    if curl -s --max-time 10 https://api.country.is > /dev/null; then
        log "INFO" "VPN connection established successfully"
        if [ "$DEBUG" = "true" ]; then
            log "DEBUG" "Current IP info: $(curl -s https://api.country.is)"
        fi
    else
        log "WARN" "VPN connection verification failed, continuing anyway"
    fi
    
    # Update DNS
    echo "nameserver 8.8.8.8" > /etc/resolv.conf
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf
else
    log "INFO" "VPN not configured, running without VPN"
fi

# Determine test file to run
if [ -n "${TEST_FILE:-}" ]; then
    test_script="$TEST_FILE"
elif [ -n "${APP:-}" ] && [ -n "${FILE:-}" ]; then
    # Backward compatibility
    test_script="$APP/$FILE.js"
else
    # Default test
    test_script="tests/google/google-api-test.js"
fi

# Validate test file exists
if [ ! -f "/app/$test_script" ]; then
    error_exit "Test file not found: /app/$test_script"
fi

log "INFO" "Running test: $test_script"

# Prepare K6 options
k6_options=(
    "--summary-trend-stats" "min,avg,med,max,p(90),p(95),p(99),p(99.9)"
    "--out" "json=/app/reports/test_results_$(date +%Y%m%d_%H%M%S).json"
)

# Add additional outputs if specified
if [ -n "${INFLUXDB_URL:-}" ]; then
    k6_options+=("--out" "influxdb=$INFLUXDB_URL")
fi

if [ -n "${PROMETHEUS_URL:-}" ]; then
    k6_options+=("--out" "experimental-prometheus-rw")
fi

# Set environment variables for the test
export ENVIRONMENT
export TEST_PROFILE
export DEBUG

# Run K6 test
log "INFO" "Executing K6 test with profile: $TEST_PROFILE"
if k6 run "${k6_options[@]}" "/app/$test_script" 2>&1 | tee "/app/logs/k6_$(date +%Y%m%d_%H%M%S).log"; then
    log "INFO" "Test completed successfully"
    exit_code=0
else
    log "ERROR" "Test failed"
    exit_code=1
fi

# Display results summary
if [ -f "/app/reports/test_results_"*.json ]; then
    log "INFO" "Test results saved to /app/reports/"
fi

log "INFO" "Test execution finished with exit code: $exit_code"
exit $exit_code
