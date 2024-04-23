#!/bin/bash

# Check if SSID and password are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <SSID> <Password>"
    exit 1
fi

SSID=$1
PASSWORD=$2

# Stop hostapd and dnsmasq services if they are running
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq

sudo ip addr flush dev wlan0

# Generate a new wpa_supplicant configuration
cat <<EOF | sudo tee /etc/wpa_supplicant/wpa_supplicant.conf > /dev/null
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=US

network={
    ssid="$SSID"
    psk="$PASSWORD"
    key_mgmt=WPA-PSK
}
EOF

# Restart the wpa_supplicant and dhcpcd services
sudo systemctl restart wpa_supplicant
sudo systemctl restart dhcpcd
ifconfig wlan0 down
ifconfig wlan0 up

#sudo reboot
