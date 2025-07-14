import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventPublicComponent } from './event-public.component';
import { EventService } from '../../shared/services/event.service';

describe('EventPublicComponent', () => {
  let component: EventPublicComponent;
  let fixture: ComponentFixture<EventPublicComponent>;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  const mockEvent = {
    id: '1',
    name: 'Test Event',
    description: 'A test event description',
    date: '2025-08-15',
    time: '14:30',
    location: 'Test Venue',
    organizer: 'Test Organizer',
    isPublic: true,
    status: 'active',
    category: 'concert',
    price: 25,
    totalPhotos: 150,
    coverImage: '/assets/test-cover.jpg',
    samplePhotos: [
      { id: '1', url: '/assets/sample1.jpg', thumbnail: '/assets/thumb1.jpg' },
      { id: '2', url: '/assets/sample2.jpg', thumbnail: '/assets/thumb2.jpg' }
    ]
  };

  beforeEach(async () => {
    const eventServiceSpy = jasmine.createSpyObj('EventService', ['getPublicEvent']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    mockActivatedRoute = {
      paramMap: of(new Map([['id', '1']]))
    };

    await TestBed.configureTestingModule({
      declarations: [EventPublicComponent],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventPublicComponent);
    component = fixture.componentInstance;
    mockEventService = TestBed.inject(EventService) as jasmine.SpyObj<EventService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load event on init', () => {
    mockEventService.getPublicEvent.and.returnValue(of(mockEvent));
    
    component.ngOnInit();
    
    expect(mockEventService.getPublicEvent).toHaveBeenCalledWith('1');
    expect(component.event).toEqual(mockEvent);
    expect(component.loading).toBeFalse();
  });

  it('should handle event loading error', () => {
    mockEventService.getPublicEvent.and.returnValue(throwError('Event not found'));
    
    component.ngOnInit();
    
    expect(component.error).toBe('Événement non trouvé ou non accessible');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to scan page', () => {
    component.event = mockEvent;
    
    component.goToScan();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/scan'], {
      queryParams: { eventId: '1' }
    });
  });

  it('should show contact modal', () => {
    component.showContactModal();
    
    expect(component.showContact).toBeTrue();
  });

  it('should close contact modal', () => {
    component.showContact = true;
    
    component.closeContactModal();
    
    expect(component.showContact).toBeFalse();
  });

  it('should format date correctly', () => {
    const formattedDate = component.formatDate('2025-08-15');
    
    expect(formattedDate).toBe('15 août 2025');
  });

  it('should format time correctly', () => {
    const formattedTime = component.formatTime('14:30');
    
    expect(formattedTime).toBe('14h30');
  });

  it('should get category label', () => {
    expect(component.getCategoryLabel('concert')).toBe('Concert');
    expect(component.getCategoryLabel('wedding')).toBe('Mariage');
    expect(component.getCategoryLabel('corporate')).toBe('Événement d\'entreprise');
    expect(component.getCategoryLabel('unknown')).toBe('Autre');
  });

  it('should get status label', () => {
    expect(component.getStatusLabel('active')).toBe('En cours');
    expect(component.getStatusLabel('upcoming')).toBe('À venir');
    expect(component.getStatusLabel('completed')).toBe('Terminé');
    expect(component.getStatusLabel('unknown')).toBe('Inconnu');
  });

  it('should get status color', () => {
    expect(component.getStatusColor('active')).toBe('bg-green-100 text-green-800');
    expect(component.getStatusColor('upcoming')).toBe('bg-blue-100 text-blue-800');
    expect(component.getStatusColor('completed')).toBe('bg-gray-100 text-gray-800');
    expect(component.getStatusColor('unknown')).toBe('bg-yellow-100 text-yellow-800');
  });

  it('should handle event not found', () => {
    mockActivatedRoute.paramMap = of(new Map([['id', 'invalid']]));
    mockEventService.getPublicEvent.and.returnValue(throwError({ status: 404 }));
    
    component.ngOnInit();
    
    expect(component.error).toBe('Événement non trouvé ou non accessible');
  });

  it('should handle private event access', () => {
    const privateEvent = { ...mockEvent, isPublic: false };
    mockEventService.getPublicEvent.and.returnValue(of(privateEvent));
    
    component.ngOnInit();
    
    expect(component.error).toBe('Cet événement n\'est pas accessible au public');
  });
});
