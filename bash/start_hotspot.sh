#!/bin/bash
if ! iwgetid wlan0 --scheme; then
    echo "Wi-Fi not connected, switching to hotspot..."

    # Stop Wi-Fi client services
    sudo wpa_cli -i wlan0 terminate
    sudo systemctl stop dhcpcd

#    ip link set wlan0 up
    ip addr add 192.168.111.1/24 dev wlan0


    # Start hotspot services
    sudo systemctl start hostapd
    sudo systemctl start dnsmasq

    ifconfig wlan0 down
    ifconfig wlan0 up

else
    echo "Connected to Wi-Fi. No action needed."
fi
