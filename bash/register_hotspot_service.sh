#!/bin/bash

# Define the path to the hotspot script
HOTSPOT_SCRIPT="/var/www/kozone/bash/start_hotspot.sh"

# Create the systemd service file
cat <<EOF | sudo tee /etc/systemd/system/hotspot.service
[Unit]
Description=Start Hotspot if no Wi-Fi connection
After=network.target

[Service]
ExecStart=/bin/bash $HOTSPOT_SCRIPT
Type=oneshot
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable hotspot.service

# Optional: start the service immediately
sudo systemctl start hotspot.service

echo "Hotspot service has been registered and started."
