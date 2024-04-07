import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WifiComponent } from './wifi/wifi.component';
import { BluetoothComponent } from './bluetooth/bluetooth.component';

const routes: Routes = [
  { path: 'wifi', component: WifiComponent },
  { path: 'bluetooth', component: BluetoothComponent },
  // add other routes here
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }