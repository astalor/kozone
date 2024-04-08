import { Component } from '@angular/core';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  isLoggedIn = false;
  userEmail = '';
  wifiCount = 0; // Update this based on actual WiFi devices found
  bluetoothCount = 0; // Update this based on actual Bluetooth devices found
  email = '';
  password = '';
  private dataSubscription!: Subscription;
  dataSource: [] = [];

  constructor(private socketService: SocketService) {
    this.dataSubscription = this.socketService.listen('wifiList').subscribe((data: any) => {
      this.wifiCount = data.length;
    });
  }

  login() {
    // Implement your login logic here
    this.isLoggedIn = true;
    this.userEmail = this.email; // For demonstration, set the logged-in user's email
  }

  logout() {
    // Implement your logout logic here
    this.isLoggedIn = false;
    this.userEmail = '';
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }
}
