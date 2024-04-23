import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupWifiComponent } from './setup-wifi.component';

describe('SetupWifiComponent', () => {
  let component: SetupWifiComponent;
  let fixture: ComponentFixture<SetupWifiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupWifiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupWifiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
