import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { EventsDataService, Event as ApiEvent, EventFilters, SearchEventsRequest, EventsResponse } from './events-data.service';

export interface Event {
  id: string;
  name: string;
  code: string;
  date: string;
  location: string;
  organizer: string;
  photoCount: number;
  price: number;
  currency?: string;
  tags: string[];
  gradient: string;
  qrCode?: string;
  isPopular?: boolean;
  // Additional properties needed by templates
  description?: string;
  status: 'draft' | 'active' | 'completed';
  visibility: 'public' | 'private';
  revenue: number;
  photosCount: number; // Alias for photoCount for backward compatibility
  beneficiaries: Beneficiary[];
}

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'pending' | 'accepted' | 'declined';
}

export interface SearchFilters {
  searchTerm: string;
  eventCode: string;
  startDate: string;
  endDate: string;
  location: string;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private eventsDataService: EventsDataService) { }

  /**
   * Rechercher des événements - now uses real API only
   */
  searchEvents(filters: EventFilters): Observable<Event[]> {
    const request: SearchEventsRequest = {
      query: filters.searchTerm || '',
      filters: {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        location: filters.location,
        status: filters.status
      }
    };

    return this.eventsDataService.searchEvents(request).pipe(
      map(response => response.events.map(event => this.mapApiEventToLocal(event)))
    );
  }

  /**
   * Obtenir tous les événements - now uses real API only
   */
  getAllEvents(): Observable<Event[]> {
    return this.eventsDataService.getEvents({ page: 1, limit: 100 }).pipe(
      map(response => this.mapApiEventsToLocal(response.events))
    );
  }

  /**
   * Obtenir les événements de l'organisateur connecté
   */
  getMyEvents(): Observable<Event[]> {
    return this.eventsDataService.getMyEvents().pipe(
      map((response: EventsResponse) => this.mapApiEventsToLocal(response.events))
    );
  }

  /**
   * Obtenir un événement par ID - now uses real API only
   */
  getEventById(id: string): Observable<Event | null> {
    return this.eventsDataService.getEvent(id).pipe(
      map(apiEvent => this.mapApiEventToLocal(apiEvent)),
      catchError(() => of(null))
    );
  }

  /**
   * Obtenir les événements populaires
   */
  getPopularEvents(limit: number = 4): Observable<Event[]> {
    return this.eventsDataService.getEvents({ 
      page: 1, 
      limit, 
      sortBy: 'popularity', 
      sortOrder: 'desc' 
    }).pipe(
      map(response => this.mapApiEventsToLocal(response.events))
    );
  }

  /**
   * Obtenir les événements récents
   */
  getRecentEvents(limit: number = 6): Observable<Event[]> {
    return this.eventsDataService.getEvents({ 
      page: 1, 
      limit, 
      sortBy: 'date', 
      sortOrder: 'desc' 
    }).pipe(
      map(response => this.mapApiEventsToLocal(response.events))
    );
  }

  /**
   * Obtenir les événements à venir
   */
  getUpcomingEvents(limit: number = 6): Observable<Event[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.eventsDataService.getEvents({ 
      page: 1, 
      limit, 
      sortBy: 'date', 
      sortOrder: 'asc' 
    }).pipe(
      map(response => {
        const upcomingEvents = response.events.filter(event => event.date >= today);
        return this.mapApiEventsToLocal(upcomingEvents);
      })
    );
  }

  /**
   * Recherche rapide (pour la barre de recherche globale)
   */
  quickSearch(term: string): Observable<Event[]> {
    return this.eventsDataService.searchEvents({ query: term }).pipe(
      map(response => this.mapApiEventsToLocal(response.events.slice(0, 5)))
    );
  }

  /**
   * Obtenir les tags disponibles
   */
  getAvailableTags(): Observable<string[]> {
    // Return commonly used tags - this could be enhanced with a dedicated API endpoint
    return of([
      'Mariage', 'Anniversaire', 'Concert', 'Baptême', 'Gala', 
      'Graduation', 'Conférence', 'Sport', 'Festival', 'Corporate'
    ]);
  }

  /**
   * Rechercher un événement par QR code - now uses real API only
   */
  searchByQRCode(qrCode: string): Observable<Event | null> {
    return this.eventsDataService.searchEvents({ code: qrCode }).pipe(
      map(response => {
        const events = this.mapApiEventsToLocal(response.events);
        return events.length > 0 ? events[0] : null;
      }),
      catchError(() => of(null))
    );
  }

  // Helper methods to map API data to local interfaces
  private mapApiEventsToLocal(apiEvents: ApiEvent[]): Event[] {
    return apiEvents.map(apiEvent => this.mapApiEventToLocal(apiEvent));
  }

  private mapApiEventToLocal(apiEvent: ApiEvent): Event {
    // Determine status based on date and API status
    const getStatus = (): 'draft' | 'active' | 'completed' => {
      if (apiEvent.status === 'inactive') return 'draft';
      if (apiEvent.status === 'completed') return 'completed';
      
      const eventDate = new Date(apiEvent.date);
      const today = new Date();
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

      if (eventDateOnly > todayDateOnly) {
        return 'active'; // Future event
      } else if (eventDateOnly.getTime() === todayDateOnly.getTime()) {
        return 'active'; // Today's event
      } else {
        return 'completed'; // Past event
      }
    };

    return {
      id: apiEvent.id,
      name: apiEvent.name,
      code: apiEvent.code,
      date: apiEvent.date,
      location: apiEvent.location,
      organizer: apiEvent.organizer.name,
      photoCount: apiEvent.photosCount,
      photosCount: apiEvent.photosCount, // Alias for backward compatibility
      price: apiEvent.photoPrice,
      currency: apiEvent.currency,
      tags: apiEvent.tags,
      gradient: this.generateGradient(apiEvent.tags),
      qrCode: apiEvent.qrCode,
      isPopular: apiEvent.revenue > 1000,
      description: apiEvent.description || '',
      status: getStatus(),
      visibility: 'public', // All events are public for now
      revenue: apiEvent.revenue || 0,
      beneficiaries: [] // Empty for now until beneficiaries API is implemented
    };
  }

  private generateGradient(tags: string[]): string {
    const gradients = [
      'from-pink-400 to-red-400',
      'from-purple-400 to-pink-400',
      'from-blue-400 to-purple-400',
      'from-green-400 to-blue-400',
      'from-yellow-400 to-orange-400',
      'from-indigo-400 to-purple-400',
      'from-gray-400 to-blue-400',
      'from-green-400 to-yellow-400'
    ];
    
    const index = tags.length % gradients.length;
    return gradients[index];
  }
}