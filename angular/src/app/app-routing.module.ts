import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WifiComponent } from './wifi/wifi.component';
import { BluetoothComponent } from './bluetooth/bluetooth.component';
import { SelectedWifiComponent } from './selected-wifi/selected-wifi.component'; 


const routes: Routes = [
  { path: '', redirectTo: '/wifi', pathMatch: 'full' },
  { path: 'wifi', component: WifiComponent },
  { path: 'selected-wifi/:mac/:channel/:ssid', component: SelectedWifiComponent },
  { path: 'bluetooth', component: BluetoothComponent },
  // add other routes here
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }