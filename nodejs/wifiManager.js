const { exec, spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const WIFI_SCAN_OUTPUT_DIR = path.join('/tmp', 'ngcrack_output');
const WIFI_SCAN_FILE_PREFIX = 'scan';
let wifiScanProcess;
let fileReadInterval;
let io;

function init() {
	spawn('airmon-ng', ['start', 'wlan1']);
}


function setupWifi(io, pass, ssid) {
    try {
        // Safely format the parameters to avoid shell injection
	const safePass = escapeShellArg(pass); 
	const safeSsid = escapeShellArg(ssid);

        // Include the parameters in the command
        execSync(`/var/www/kozone/bash/connect_wifi.sh ${safeSsid} ${safePass}`);
    } catch (error) {
        console.error("Failed to set up WiFi:", error);
    }
}

function escapeShellArg(arg) {
    // Escape potentially dangerous characters in arguments
    return `'${arg.replace(/'/g, "'\\''")}'`;
}

function cleanup() {
	try {
		execSync("pkill -9 -f airodump-ng");
	} catch (error) {}
  
  if (fileReadInterval) {
    clearInterval(fileReadInterval);
  }
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

function parseCSVLine(line) {
  // Split the line by semicolon and trim each field to remove leading/trailing whitespace
  const fields = line.split(';').map(field => field.trim());
  
  // Create and return the network object with the required information
  return {
    ssid: fields[2], // ESSID
    mac: fields[3], // BSSID
    channel: fields[5], // Channel
    securityType: fields[7], // Encryption
    signalStrength: fields[21], // BestSignal
    beacons: fields[11] // Beacon
  };
}


function startWifiScan(ioInstance) {
  
  cleanup();


  io = ioInstance;
  const command = 'airodump-ng';
  const outputFilePrefixPath = path.join(WIFI_SCAN_OUTPUT_DIR, WIFI_SCAN_FILE_PREFIX);
  const args = ['wlan1mon', '-w', outputFilePrefixPath, '--output-format', 'kismet'];
  console.log(`Output file prefix path: ${outputFilePrefixPath}`);

  wifiScanProcess = spawn(command, args);
  console.log(`Started WiFi scanning process with PID: ${wifiScanProcess.pid}`);

  wifiScanProcess.on('exit', () => {
	console.log('WiFi scanning process finished.');
	wifiScanProcess = null;
  });

  startSendingFileContentsEvery2Seconds();

}


function startSendingFileContentsEvery2Seconds() {
  if (fileReadInterval) clearInterval(fileReadInterval);

  fileReadInterval = setInterval(() => {
    const latestFile = getLatestScanFile();
    if (!latestFile) {
      console.log('No WiFi scan file found.');
      return;
    }

    const fileStream = fs.createReadStream(latestFile);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let networks = [];

    rl.on('line', (line) => {
      // Skip header or empty lines
      if (!line || line.startsWith('Network')) return;
      
      const network = parseCSVLine(line);
	  if (network.ssid.length > 0)
		networks.push(network);
    });

    rl.on('close', () => {
      // Send the parsed networks data. For example:
      io.emit('wifiList', networks);
    });
  }, 2000);
}

module.exports = {
  init,
  cleanup,
  startWifiScan,
  startSendingFileContentsEvery2Seconds,
  setupWifi,
};
