import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'; // Adjust the path as necessary

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  constructor() {
    this.socket = io(environment.backendUrl);
  }

  startTail(logFilePath: string) {
    this.socket.emit('start-tail', logFilePath);
  }

  stopTail() {
    this.socket.emit('stop-tail');
  }

  onLogUpdate(handler: (log: string) => void) {
    this.socket.on('log-update', handler);
  }
}