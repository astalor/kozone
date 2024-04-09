1. Download Raspberry Pi Imager
2. Install: Raspberry PI OS (other) > Raspberry PI OS (Legacy, 32 bit) Lite
3. Setup your settings, enter the username and password for your phone's WIFI hotspot - this is how the RPI will communicate with your phone.
4. Run commands:


sudo apt-get update && apt-get install -y git && mkdir /var/www && cd /var/www && git clone https://github.com/astalor/kozone.git && cd kozone && ./install.sh

