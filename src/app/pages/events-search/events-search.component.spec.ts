import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsSearchComponent } from './events-search.component';

describe('EventsSearchComponent', () => {
  let component: EventsSearchComponent;
  let fixture: ComponentFixture<EventsSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
