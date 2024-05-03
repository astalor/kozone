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
console.log('connection');
  socket.on('startWifiScan', () => {
console.log('startwifiscan');
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
  
  socket.on('deauthConnectedClient', (data) => {
	wifiClientsManager.deauth(io, data.ssid, data.mac, data.channel, data.target);
  });
  
  socket.on('deauthAll', (data) => {
	wifiClientsManager.deauthAll(io, data.ssid, data.mac, data.channel);
  });
  
  socket.on('startSniff', (data) => {
	console.log(data);
	wifiClientsManager.startSniff(io, data.password, data.ssid);
  });
  
  socket.on('setupWifi', (data) => {
	console.log('<<<', data);
	wifiManager.setupWifi(io, data.password, data.ssid);
  });

  socket.on('startHotspot', (data) => {
        wifiManager.startHotspot(io, data.password, data.ssid);
  });

  socket.on('reboot', (data) => {
        wifiManager.reboot();
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
