import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedWifiComponent } from './selected-wifi.component';

describe('SelectedWifiComponent', () => {
  let component: SelectedWifiComponent;
  let fixture: ComponentFixture<SelectedWifiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectedWifiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectedWifiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
