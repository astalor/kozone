import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

interface WifiNetwork {
  ssid: string;
  mac: string;
  signalStrength: string;
  channel: string;
  securityType: string;
  beacons: string;
}

@Component({
  selector: 'app-wifi',
  templateUrl: './wifi.component.html',
  styleUrls: ['./wifi.component.scss'],
})
export class WifiComponent implements OnInit, OnDestroy {
  private dataSubscription!: Subscription;
  isLoading = true;
  dataSource: WifiNetwork[] = [];
  displayedColumns: string[] = ['SSID', 'MAC', 'SignalStrength', 'Channel', 'Security', 'Beacons', 'Action'];

  constructor(private socketService: SocketService, private router: Router) {
    this.getCurrentLocation();
  }

  ngOnInit() {
    this.socketService.connect();
    this.dataSubscription = this.socketService.listen('wifiList').subscribe((data: any) => {
      this.dataSource = data;
      this.isLoading = false;
      this.socketService.wifiData = data;
    });

    // Example: Request the server to send the list of WiFi networks
    this.socketService.startWifiScan();
  }

  startScan() {
    this.socketService.startWifiScan();
  }

  stopScan() {
    this.socketService.stopWifiScan();
  }

  select(ssid: string, mac: string, channel: string) {
    this.router.navigate(['/selected-wifi', mac, channel, ssid]);
  }

  // Function to get the current position
  getCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
        // Extract latitude and longitude
        const { latitude, longitude } = position.coords;

        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

        
      }, function(error) {
        console.error('Error getting location', error);
      });
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}