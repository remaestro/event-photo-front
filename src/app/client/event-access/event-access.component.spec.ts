import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventAccessComponent } from './event-access.component';

describe('EventAccessComponent', () => {
  let component: EventAccessComponent;
  let fixture: ComponentFixture<EventAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventAccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
