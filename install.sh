#!/bin/bash

# Exit if any command fails
set -e

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install necessary packages
echo "Installing necessary packages..."
sudo apt-get install -y tshark apt-transport-https ca-certificates curl software-properties-common git aircrack-ng python3 python3-pip libxslt1.1 hostapd dnsmasq

echo "Installing NodeJS..."
curl -sL https://deb.nodesource.com/setup_21.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing PM2..."
sudo npm install pm2 -g

cd nodejs
sudo pm2 start app.js
sudo pm2 startup
sudo pm2 save

pip3 install pyshark

git config --global user.email "me@kozone"
git config --global user.name "kozone"

sudo bash -c 'cat <<EOF > /etc/hostapd/hostapd.conf
interface=wlan0
driver=nl80211
ssid=kozone
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=111222333
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF'


./var/www/kozone/bash/register_hotspot_service.sh
