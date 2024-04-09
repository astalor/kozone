// processManager.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROCESSES_FILE = path.join(__dirname, 'config.json');

function readProcesses() {
  if (!fs.existsSync(PROCESSES_FILE)) {
    fs.writeFileSync(PROCESSES_FILE, '{}');
  }
  return JSON.parse(fs.readFileSync(PROCESSES_FILE));
}

function writeProcesses(data) {
  fs.writeFileSync(PROCESSES_FILE, JSON.stringify(data, null, 2));
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function startProcess(key, command, args) {
  const processes = readProcesses();

  if (processes[key] && processes[key].isRunning && isProcessRunning(processes[key].pid)) {
    console.log(`Process ${key} is already running with PID: ${processes[key].pid}`);
    return;
  }

  const processSpawn = spawn(command, args);
  processes[key] = { pid: processSpawn.pid, isRunning: true };
  writeProcesses(processes);

  console.log(`Started process ${key} with PID: ${processSpawn.pid}`);
}

function stopProcess(key) {
  const processes = readProcesses();

  if (processes[key] && processes[key].isRunning && isProcessRunning(processes[key].pid)) {
    try {
      process.kill(processes[key].pid);
      console.log(`Stopped process ${key} with PID: ${processes[key].pid}`);
    } catch (e) {
      console.error(`Failed to stop process ${key} with PID: ${processes[key].pid}`, e);
    }
    processes[key].isRunning = false;
    writeProcesses(processes);
  }
}

function init() {
   // Check if tmp directory exists, if not create it
	const tmpDir = '/tmp/ngcrack_output';
	if (!fs.existsSync(tmpDir)) {
	  fs.mkdirSync(tmpDir);
	}
	
  const processes = readProcesses();
  Object.keys(processes).forEach(key => {
    if (processes[key].isRunning && !isProcessRunning(processes[key].pid)) {
      console.log(`Cleaning up the stale process ${key} with PID: ${processes[key].pid}`);
      processes[key].isRunning = false;
    }
  });
  writeProcesses(processes);
}

function shutdownServer() {
  const processes = readProcesses();
  Object.keys(processes).forEach(key => {
    if (processes[key].isRunning) {
      stopProcess(key);
    }
  });
  process.exit(0);
}

module.exports = {
  startProcess,
  stopProcess,
  init,
  shutdownServer,
};
