const { exec, spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ssid = '';
const mac = '';
const channel = '';
const WIFI_SCAN_OUTPUT_DIR = path.join('/tmp', 'ngcrack_output');
const WIFI_SCAN_FILE_PREFIX = 'clients';
let io;
let lastKnownClients = new Set();

function init(i, ssid, mac, channel) {
	cleanup();
    io = i;
	const command = `cd /tmp/ngcrack_output && airodump-ng --bssid ${mac} -c ${channel} -w clients wlan1 >> /dev/null`;

    airodumpProcess = spawn(command, {
        shell: true
    });
	
	setTimeout(monitorLatestScanFile, 2000);

}

function cleanup() {
	try {
		execSync("pkill -9 -f airodump-ng");
	} catch (error) {}
	
	lastKnownClients = new Set();
}


function getLatestScanFile() {
  const files = fs.readdirSync(WIFI_SCAN_OUTPUT_DIR);
  const csvFiles = files
    .filter(file => file.startsWith(WIFI_SCAN_FILE_PREFIX) && file.endsWith('.csv'))
    .map(file => ({
      file,
      time: fs.statSync(path.join(WIFI_SCAN_OUTPUT_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return csvFiles.length > 0 ? path.join(WIFI_SCAN_OUTPUT_DIR, csvFiles[0].file) : null;
}


function parseClientsFromCSV(filePath) {
  // Read the CSV file and parse clients
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const clients = new Set();

  // Assuming the MAC addresses of clients are in the first column
  lines.forEach(line => {
    const columns = line.split(',');
    const mac = columns[0].trim();
    if (mac.match(/^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/)) {
      clients.add(mac);
    }
  });

  return clients;
}

function monitorLatestScanFile() {
	
  const latestFile = getLatestScanFile();
  if (!latestFile) return;

  // Initial load of existing clients
  if (lastKnownClients.size === 0) {
    lastKnownClients = parseClientsFromCSV(latestFile);
	
	lastKnownClients.forEach(clientMac => io.emit('newClient', clientMac));
  }

  fs.watch(latestFile, (eventType, filename) => {
    if (eventType === 'change') {
      const currentClients = parseClientsFromCSV(latestFile);
      const newClients = new Set([...currentClients].filter(x => !lastKnownClients.has(x)));

      if (newClients.size > 0) {
        newClients.forEach(clientMac => io.emit('newClient', clientMac));
        lastKnownClients = new Set([...lastKnownClients, ...newClients]);
		console.log('New clients', newClients);
      }
    }
  });
}



module.exports = {
  init,
  cleanup
};
