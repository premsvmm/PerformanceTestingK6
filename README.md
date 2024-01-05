Run the test :  docker run -e APP=Google -e FILE=googlebrowse -e STAGE_1_DUR=1m -e STAGE_1_VUS=3 ae1986694f40






docker run -e APP=Google -e FILE=googlebrowse -e STAGE_1_DUR=20m -e STAGE_1_VUS=1 -e VPN_USERNAME=freeopenvpn -e VPN_PASSWORD=180846206 --cap-add=NET_ADMIN -v /dev/net:/dev/net --network k6_bridge 08b45d28b828



docker run -it --rm --cap-add=NET_ADMIN -v /dev/net:/dev/net -v /Users/prem/Desktop/premsvmm/PerformanceTestingK6/vpnbook-openvpn-fr200:/etc/openvpn openvpn-client



docker run --rm -it --network my_network your-k6-image [K6_OPTIONS]


apk update
apk add openvpn


docker cp /Users/prem/Desktop/premsvmm/PerformanceTestingK6/vpnbook-openvpn-fr200/vpnbook-fr200-tcp80.ovpn d789d7ecd050:/app/


sudo openvpn --config vpnbook-fr200-tcp80.ovpn


https://api.first.org/v1/get-countries
https://www.freeopenvpn.org/

