import { Component, OnInit } from '@angular/core';

interface BluetoothDevice {
  name: string;
  signalStrength: string;
}

@Component({
  selector: 'app-bluetooth',
  templateUrl: './bluetooth.component.html',
  styleUrls: ['./bluetooth.component.scss']
})
export class BluetoothComponent implements OnInit {
  isLoading = true;
  dataSource: BluetoothDevice[] = [];

  ngOnInit() {
    setTimeout(() => {
      this.isLoading = false;
      this.dataSource = [
        { name: 'Bluetooth Speaker', signalStrength: '-59 dBm' },
        { name: 'Wireless Headphones', signalStrength: '-75 dBm' },
        // Add more devices as needed
      ];
    }, 2000); // Simulates delay in fetching data
  }
}