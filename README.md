
# Performance Testing with Docker and OpenVPN

This guide provides the steps to run performance tests using Docker and OpenVPN.

## Prerequisites
- Docker installed on your machine.
- OpenVPN configuration files available.

## Running the Tests

### Basic Test
Run the following command to execute a basic test:

```sh
docker run -e APP=Google -e FILE=googlebrowse -e STAGE_1_DUR=1m -e STAGE_1_VUS=3 ae1986694f40
```

### Extended Test with VPN
Use this command to run an extended test with VPN:

```sh
docker run -e APP=Google -e FILE=googlebrowse -e STAGE_1_DUR=20m -e STAGE_1_VUS=1 -e VPN_USERNAME=freeopenvpn -e VPN_PASSWORD=180846206 --cap-add=NET_ADMIN -v /dev/net:/dev/net --network k6_bridge 08b45d28b828
```

### OpenVPN Client
To start an OpenVPN client container, execute:

```sh
docker run -it --rm --cap-add=NET_ADMIN -v /dev/net:/dev/net -v /Users/prem/Desktop/premsvmm/PerformanceTestingK6/vpnbook-openvpn-fr200:/etc/openvpn openvpn-client
```

### Running k6 with Custom Network
If you need to run k6 with a custom network configuration, use:

```sh
docker run --rm -it --network my_network your-k6-image [K6_OPTIONS]
```

## Setting Up OpenVPN on Alpine Linux

1. Update the package index:

    ```sh
    apk update
    ```

2. Install OpenVPN:

    ```sh
    apk add openvpn
    ```

3. Copy the OpenVPN configuration file into the container:

    ```sh
    docker cp /Users/prem/Desktop/premsvmm/PerformanceTestingK6/vpnbook-openvpn-fr200/vpnbook-fr200-tcp80.ovpn d789d7ecd050:/app/
    ```

4. Start OpenVPN with the configuration file:

    ```sh
    sudo openvpn --config vpnbook-fr200-tcp80.ovpn
    ```

## Useful Links

- [List of Countries API](https://api.first.org/v1/get-countries)
- [Free OpenVPN](https://www.freeopenvpn.org/)
