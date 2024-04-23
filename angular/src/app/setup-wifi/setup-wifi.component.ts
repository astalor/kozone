import { Component } from '@angular/core';
import { SocketService } from '../socket.service';

@Component({
  selector: 'app-setup-wifi',
  templateUrl: './setup-wifi.component.html',
  styleUrls: ['./setup-wifi.component.scss']
})
export class SetupWifiComponent {
  wifiSsid: string = '';
  wifiPassword: string = '';
  connectionMessage: string = '';
  isLoading: boolean = false;

  constructor(private socketService: SocketService) { }

  connectToWifi() {
    this.isLoading = true;
    console.log(`Connecting to SSID: ${this.wifiSsid}, with password: ${this.wifiPassword}`);
    this.socketService.setupWifi(this.wifiSsid, this.wifiPassword);
  }
}
