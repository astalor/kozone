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

}