const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn, execSync } = require('child_process');
const cors = require('cors');
const fs = require('fs');
const processManager = require('./processManager');
const wifiManager = require('./wifiManager');

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



io.on('connection', (socket) => {
  socket.on('startWifiScan', () => {
    wifiManager.startWifiScan(io);
  });

  socket.on('stopWifiScan', () => {
    wifiManager.stopWifiScan();
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
