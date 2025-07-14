import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminEventFilters {
  page?: number;
  limit?: number;
  status?: string;
  organizer?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminEventsResponse {
  events: Array<{
    id: string;
    name: string;
    organizer: {
      id: string;
      name: string;
      email: string;
    };
    date: string;
    status: string;
    photosCount: number;
    revenue: number;
    createdAt: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminEventsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/events`;

  constructor(private http: HttpClient) { }

  getEvents(filters: AdminEventFilters = {}): Observable<AdminEventsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AdminEventsResponse>(this.baseUrl, { params });
  }

  updateEventStatus(eventId: string, status: string, reason?: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${eventId}/status`, { status, reason });
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}`);
  }
}