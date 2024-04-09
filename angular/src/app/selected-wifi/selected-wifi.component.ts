import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketService } from '../socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-selected-wifi',
  templateUrl: './selected-wifi.component.html',
  styleUrls: ['./selected-wifi.component.scss']
})
export class SelectedWifiComponent implements OnInit {
  private dataSubscription!: Subscription;
  private clientsSubscription!: Subscription;
  private passwordFound!: Subscription;
  private passwordNotFound!: Subscription;
  wifiData: any[] = [];
  mac: string = '';
  channel: string = '';
  ssid: string = '';
  state: string = '0'; //0 - not started, 1 - started, 3 - paused
  messages: string[] = [];
  connectedClients: any[] = [];
  constructor(private route: ActivatedRoute, private socketService: SocketService) {
    this.passwordFound = this.socketService.listen('getPasswordFound').subscribe((data: any) => {
      this.state = '0';
    });

    this.passwordNotFound = this.socketService.listen('getPasswordNotFound').subscribe((data: any) => {
      this.state = '0';
    });

    this.dataSubscription = this.socketService.listen('getPasswordMessage').subscribe((data: any) => {
      this.messages.push(data);
    });

    this.clientsSubscription = this.socketService.listen('newClient').subscribe((data: any) => {
      this.connectedClients.push(data);
    });


  }

  getPasswordStart() {
    this.state = '1';
    this.socketService.getPasswordStart(this.ssid, this.channel, this.mac);
  }

  getPasswordPause() {
    this.state = '3';
    this.socketService.getPasswordPause(this.ssid);
  }

  getPasswordResume() {
    this.state = '1';
    this.socketService.getPasswordResume(this.ssid);
  }

  getPasswordStop() {
    this.state = '0';
    this.socketService.getPasswordStop(this.ssid);
  }

  deauthClient(mac: string) {
    // Placeholder for deauthentication logic
    // Example:
    // this.socketService.deauthClient(mac).subscribe(() => console.log(`Deauth sent for MAC: ${mac}`));
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.ssid = params.get('ssid') || '';
      this.mac = params.get('mac') || '';
      this.channel = params.get('channel') || '';

      this.socketService.getConnectedClients(this.ssid, this.mac, this.channel);
    });
  }

  ngOnDestroy() {
    //this.dataSubscription.unsubscribe();
    this.passwordFound.unsubscribe();
    this.passwordNotFound.unsubscribe();
  }
}