#!/bin/bash

# Set VPN username and password from environment variables
vpn_username="$VPN_USERNAME"
vpn_password="$VPN_PASSWORD"

# Path to the OpenVPN configuration file
config_file="/app/vpnconfig/usa.ovpn"

# Path to the file containing VPN username and password
auth_file="/app/vpnconfig/auth.txt"

# Check if username and password are set
if [ -z "$vpn_username" ] || [ -z "$vpn_password" ]; then
    echo "Error: VPN_USERNAME and VPN_PASSWORD environment variables must be set."
    exit 1
fi

# Create the auth file
echo "$vpn_username" > "$auth_file"
echo "$vpn_password" >> "$auth_file"

# Run OpenVPN in the background
openvpn --config "$config_file" --auth-user-pass "$auth_file" &

# Wait for OpenVPN to initialize
sleep 10

# Display the routing table for debugging purposes
echo "Routing Table:"
ip route

echo "nameserver 8.8.8.8" > /etc/resolv.conf

echo "k6 Started"
# Run k6 with the provided parameters
k6 run "$APP/$FILE.js" --summary-trend-stats "min,avg,med,max,p(95),p(99),p(99.99)" --out json=my_test_result.json > logs.txt

# Optionally, you may want to wait for OpenVPN to finish before exiting the script
# This is useful if you want to perform cleanup or ensure OpenVPN has fully connected
wait
