const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn, exec, execSync } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const processManager = require('./processManager');
const wifiManager = require('./wifiManager');
const wifiPasswordManager = require('./wifiPasswordManager');
const wifiClientsManager = require('./wifiClientsManager');

const app = express();
app.use(cors({
  origin: function (origin, callback) {
	if (!origin) return callback(null, true);
	return callback(null, origin);
  },
  credentials: true  // if your frontend includes credentials like cookies
}));

processManager.init();
wifiManager.init();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
	origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
	methods: ["GET", "POST"],
	credentials: true
  }
});


wifiPasswordManager.init(io);

io.on('connection', (socket) => {
  socket.on('startWifiScan', () => {
    wifiManager.startWifiScan(io);
  });

  socket.on('stopWifiScan', () => {
    wifiManager.cleanup();
  });
  
  socket.on('getPasswordStart', (data) => {
	if(data && data.ssid && data.channel && data.mac) {
		wifiManager.cleanup();
		wifiPasswordManager.getPasswordStart(data.ssid, data.channel, data.mac);
		
	} else {
		console.error('Missing parameters for getPasswordStart', data);
	}
  });
  
  socket.on('getPasswordStop', () => {
    wifiPasswordManager.getPasswordStop();
  });
  
  socket.on('getPasswordPause', () => {
    wifiPasswordManager.getPasswordPause();
  });
  
  socket.on('getPasswordResume', () => {
    wifiPasswordManager.getPasswordResume();
  });
  
  socket.on('getConnectedClients', (data) => {
	wifiManager.cleanup();
	wifiClientsManager.init(io, data.ssid, data.mac, data.channel);
  });
  
  
  
});


function cleanup() {
	processManager.shutdownServer();
	wifiManager.cleanup();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

server.listen(3000, () => {
  console.log('listening on *:3000');
});
