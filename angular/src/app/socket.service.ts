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
    const protocol = window.location.protocol;
    let host = window.location.hostname;

    if (host == 'localhost') {
      host = '192.168.1.177';
    }

    this.socket = io(`${protocol}//${host}:3000`, {
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

  deauthConnectedClient(ssid: string, mac: string, channel: string, target: string) {
    this.socket.emit('deauthConnectedClient', {ssid, mac, channel, target});
  }

  deauthAll(ssid: string, mac: string, channel: string) {
    this.socket.emit('deauthAll', {ssid, mac, channel});
  }

  startSniff(ssid: string, password: string) {
    this.socket.emit('startSniff', {ssid, password});
  }

  setupWifi(ssid: string, password: string) {
    this.socket.emit('setupWifi', {ssid, password});
  }

  startHotspot(ssid: string, password: string) {
    this.socket.emit('startHotspot', {ssid, password});
  }

  reboot() {
    this.socket.emit('reboot');
  }

}