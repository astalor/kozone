const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');
  let tailProcess;

  socket.on('start-tail', (logFilePath) => {
    if (tailProcess) tailProcess.kill();
    tailProcess = spawn('tail', ['-f', logFilePath]);

    tailProcess.stdout.on('data', (data) => {
      socket.emit('log-update', data.toString());
    });
  });

  socket.on('stop-tail', () => {
    if (tailProcess) {
      tailProcess.kill();
      tailProcess = null;
    }
  });

  socket.on('disconnect', () => {
    if (tailProcess) tailProcess.kill();
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
