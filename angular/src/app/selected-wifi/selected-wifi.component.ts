import { Component, OnInit, ChangeDetectorRef, ElementRef, Renderer2, ViewChild } from '@angular/core';
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
  private capSubscription!: Subscription;
  @ViewChild('myElement') myElement!: ElementRef;

  wifiData: any[] = [];
  mac: string = '';
  channel: string = '';
  ssid: string = '';
  state: string = '0'; //0 - not started, 1 - started, 3 - paused
  messages: string[] = [];
  connectedClients: any[] = [];
  password: string = '';
  sniffTimer: any;
  focusedClient: string = '';
  activityData:any = {}; // Assuming each item has { timestamp, domain }
  activityModel = {
    eapol: false,
    activities: [],
    traffic: {}
  }

  trafficData: Map<string, number> = new Map(); // Domain as key and MB as value

  constructor(private route: ActivatedRoute, private socketService: SocketService, private renderer: Renderer2, private el: ElementRef) {
    this.passwordFound = this.socketService.listen('getPasswordFound').subscribe((data: any) => {
      this.state = '4';
      this.password = data;
      this.setPassword();
    });

    this.passwordNotFound = this.socketService.listen('getPasswordNotFound').subscribe((data: any) => {
      this.state = '0';
    });

    this.dataSubscription = this.socketService.listen('getPasswordMessage').subscribe((data: any) => {
      this.messages.push(data);
    });

    this.clientsSubscription = this.socketService.listen('newClient').subscribe((data: any) => {
      if (data != this.mac)
        this.connectedClients.push(data);
    });

    this.capSubscription = this.socketService.listen('cap').subscribe((data: any) => {
      let d = data.split(' ');
      if (d.length == 0)
        return;

        console.log('<<', d);

      console.log('ad', this.activityData);


      if (d[0] == 'e') {
        // process eapol
        if (!this.connectedClients.includes(d[4].toUpperCase())) {
          if (d[4].toUpperCase() != this.mac) {
            this.connectedClients.push(d[4].toUpperCase());
          }
        }
        
        if (d[4].toUpperCase() != this.mac) {
          if (!this.activityData[d[4]]) {
            let m = JSON.parse(JSON.stringify(this.activityModel));
            this.activityData[d[4]] = m;
          }
          
          this.activityData[d[4]].eapol = true;
          setTimeout(() => {
            let el = this.el.nativeElement.querySelector(`#mac${this.getSafeMac(d[4].toUpperCase())}`);
            let eapol = this.el.nativeElement.querySelector(`#eapol${this.getSafeMac(d[4].toUpperCase())}`);
            if (el) {
              this.renderer.addClass(el, 'eapol');
              this.renderer.setProperty(eapol, 'innerHTML', 'Yes');
            }
          }, 0);

        }

      } else if (d[0] == 'd') {
        // process domains
        //add to connected clients
        if (!this.connectedClients.includes(d[5].toUpperCase())) {
          this.connectedClients.push(d[5].toUpperCase());
        }

        if (this.connectedClients.includes(d[5].toUpperCase())) {
          if (!this.activityData[d[5]]) {
              let m = JSON.parse(JSON.stringify(this.activityModel));
              this.activityData[d[5]] = m;
          }

          this.activityData[d[5]].activities.unshift({
            time: d[1] + ' ' + d[2],
            domain: d[3],
            size: d[4],
            src: d[5],
            dst: d[6],
            msrc: d[7],
            mdst: d[8]
          });

          if (!this.activityData[d[5]].traffic[d[3]])
            this.activityData[d[5]].traffic[d[3]] = 0;
          this.activityData[d[5]].traffic[d[3]]++;

        } else if (this.connectedClients.includes(d[6].toUpperCase())) {
          if (!this.activityData[d[6]]) {
            let m = JSON.parse(JSON.stringify(this.activityModel));
            this.activityData[d[6]] = m;
          }
          
          this.activityData[d[6]].activities.unshift({
            time: d[1] + ' ' + d[2],
            domain: d[3],
            size: d[4],
            src: d[5],
            dst: d[6],
            msrc: d[7],
            mdst: d[8]
          });

          if (!this.activityData[d[6]].traffic[d[3]])
            this.activityData[d[6]].traffic[d[3]] = 0;
          this.activityData[d[6]].traffic[d[3]]++;
          
        } else {
          console.log('Unknown client', this.connectedClients, d)
        }
      }

    });
  }

  getSafeMac(mac:string) {
    return mac.replace(/:/g, '_');
  }

  getActivityDataKeys() {
    if (this.focusedClient.length > 0) {
      return [this.focusedClient.toLowerCase()];
    }

    return Object.keys(this.activityData);
  }

  startSniff() {
    this.socketService.startSniff(this.ssid, this.password);
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

  setPassword() {
    if (this.password.length >= 6) {
      this.state = '4';

      const ssid = encodeURIComponent(this.ssid); // Make sure SSID is URL-safe
      const passwordEncoded = encodeURIComponent(this.password); // Encode password to make it cookie-safe
      const d = new Date();
      d.setTime(d.getTime() + (365*24*60*60*1000)); // Set the expiration to 365 days from now
      const expires = "expires="+ d.toUTCString();
      document.cookie = `wifiPassword_${ssid}=${passwordEncoded};${expires};path=/`; // Use SSID in the cookie name
      this.startSniff();
    }
  }

  clearPassword() {
    this.password = '';
    this.state = '0';

    const ssid = encodeURIComponent(this.ssid);
    const d = new Date();
    d.setTime(d.getTime() + (365*24*60*60*1000)); // Set the expiration to 365 days from now
    const expires = "expires="+ d.toUTCString();
    document.cookie = `wifiPassword_${ssid}=;${expires};path=/`;
  }

  retrievePassword() {
    const ssid = encodeURIComponent(this.ssid); // Make sure SSID is URL-safe
    const name = `wifiPassword_${ssid}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(decodeURIComponent(name)) == 0) {
            const password = decodeURIComponent(c.substring(decodeURIComponent(name).length, c.length));
            // Assuming you have a model or variable to hold the password, set it here
            return password; // You can return it if needed
        }
    }
    return ""; // Return empty if not found
  }

  deauthClient(target: string) {
    // Placeholder for deauthentication logic
    // Example:
    // this.socketService.deauthClient(mac).subscribe(() => console.log(`Deauth sent for MAC: ${mac}`));
    console.log(this.ssid, this.mac, this.channel, target);
    this.socketService.deauthConnectedClient(this.ssid, this.mac, this.channel, target);

  }

  focusClient(client: string) {
    this.focusedClient = client;
  }

  clearFocus() {
    this.focusedClient = '';
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.ssid = params.get('ssid') || '';
      this.mac = params.get('mac') || '';
      this.channel = params.get('channel') || '';

      this.password = this.retrievePassword();
      if (this.password.length >= 6) {
        this.setPassword();
      }

      this.socketService.getConnectedClients(this.ssid, this.mac, this.channel);
    });
  }

  ngOnDestroy() {
    //this.dataSubscription.unsubscribe();
    this.passwordFound.unsubscribe();
    this.passwordNotFound.unsubscribe();
  }
}