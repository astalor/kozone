#!/bin/bash

# Exit if any command fails
set -e

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install necessary packages
echo "Installing necessary packages..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common git

echo "Installing NodeJS..."
curl -sL https://deb.nodesource.com/setup_21.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing PM2..."
sudo npm install pm2 -g

cd nodejs
sudo pm2 start app.js
sudo pm2 startup
sudo pm2 save

git config --global user.email "me@kozone"
git config --global user.name "kozone"

