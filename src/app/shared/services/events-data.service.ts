import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Event {
  id: string;
  title: string;
  name: string;
  code: string;
  description: string;
  location: string;
  date: string;
  publicCode: string;
  status: 'active' | 'inactive' | 'completed';
  organizerId: string;
  organizerName: string;
  organizer: {
    name: string;
  };
  photosCount: number;
  photoPrice: number;
  currency?: string; // NOUVEAU : Ajouter la devise pour l'affichage
  tags: string[];
  qrCode: string;
  revenue: number;
  settings: {
    allowDownload: boolean;
    allowShare: boolean;
    requireApproval: boolean;
    pricingTier: string;
  };
  stats: {
    totalPhotos: number;
    totalViews: number;
    totalDownloads: number;
    totalRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  organizerId?: string;
  sortBy?: 'popularity' | 'date' | 'name';
  searchTerm?: string; // Added property
  location?: string;   // Added property
  sortOrder?: 'asc' | 'desc'; // Added property
}

export interface EventsResponse {
  events: Event[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  location: string;
  date: string;
  organizerId?: string;
  photoPrice: number;
  currency?: string; // NOUVEAU : Ajouter le support de la devise
  settings?: {
    allowDownload: boolean;
    allowShare: boolean;
    requireApproval: boolean;
    pricingTier: string;
  };
  tags?: string[];
  beneficiaries?: {
    email: string;
    percentage: number;
    status: string;
  }[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  status?: string;
  settings?: {
    allowDownload?: boolean;
    allowShare?: boolean;
    requireApproval?: boolean;
    pricingTier?: string;
  };
}

export interface SearchEventsRequest {
  query?: string;
  code?: string;
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    location?: string;
    status?: string;
  };
  page?: number;
  limit?: number;
}

export interface PublicEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organizerName: string;
  totalPhotos: number;
  settings: {
    allowDownload: boolean;
    allowShare: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EventsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/events`;

  constructor(private http: HttpClient) { }

  getEvents(filters: EventFilters = {}): Observable<EventsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<EventsResponse>(this.baseUrl, { params });
  }

  /**
   * Obtenir les événements de l'organisateur connecté
   */
  getMyEvents(filters: EventFilters = {}): Observable<EventsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<EventsResponse>(`${this.baseUrl}/user/events`, { params });
  }

  getEvent(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.baseUrl}/${id}`);
  }

  getEventById(id: string): Observable<Event> {
    return this.getEvent(id);
  }

  createEvent(event: CreateEventRequest): Observable<Event> {
    return this.http.post<Event>(this.baseUrl, event);
  }

  updateEvent(id: string, event: UpdateEventRequest): Observable<Event> {
    return this.http.put<Event>(`${this.baseUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  duplicateEvent(id: string): Observable<Event> {
    return this.http.post<Event>(`${this.baseUrl}/${id}/duplicate`, {});
  }

  searchEvents(query: SearchEventsRequest): Observable<EventsResponse> {
    return this.http.get<EventsResponse>(`${this.baseUrl}/search`, { 
      params: new HttpParams({ fromObject: query as any })
    });
  }

  getPublicEvent(code: string): Observable<PublicEvent> {
    return this.http.get<PublicEvent>(`${this.baseUrl}/public/${code}`);
  }
}