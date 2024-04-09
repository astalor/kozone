import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../environments/environment'; // Adjust the path as necessary
import { Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  wifiCount = 0;
  btCount = 0;
  wifiData: any[] = [];
  constructor() {
    this.socket = io(environment.backendUrl, {
      withCredentials: true
    });
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  listen<T>(eventName: string): Observable<T> {
    return new Observable((subscriber: Observer<T>) => {
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });

      // Provide a way for the subscription to unsubscribe from the event
      return () => this.socket.off(eventName);
    });
  }

  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  onLogUpdate(handler: (log: string) => void) {
    this.socket.on('log-update', handler);
  }

  startWifiScan() {
    this.socket.emit('startWifiScan');
  }

  stopWifiScan() {
    this.socket.emit('stopWifiScan');
  }

  getPasswordStart(ssid: string, channel: string, mac: string) {
    this.socket.emit('getPasswordStart', {
      ssid,
      channel,
      mac
    });
  }

  getPasswordPause(ssid: string) {
    this.socket.emit('getPasswordPause');
  }

  getPasswordResume(ssid: string) {
    this.socket.emit('getPasswordResume');
  }

  getPasswordStop(ssid: string) {
    this.socket.emit('getPasswordStop');
  }

  getConnectedClients(ssid: string, mac: string, channel: string) {
    this.socket.emit('getConnectedClients', {ssid, mac, channel});
  }

}