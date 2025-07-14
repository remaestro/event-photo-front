import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ModerationFilters {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

export interface ModerationPhotosResponse {
  photos: Array<{
    id: string;
    eventId: string;
    eventName: string;
    organizer: string;
    filename: string;
    thumbnail: string;
    uploadDate: string;
    moderationStatus: 'pending' | 'approved' | 'rejected';
    flaggedReasons: string[];
    reportCount: number;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

export interface ReportFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ReportsResponse {
  reports: Array<{
    id: string;
    type: 'photo' | 'event' | 'user';
    resourceId: string;
    reason: string;
    description: string;
    reportedBy: string;
    status: 'pending' | 'resolved' | 'dismissed';
    createdAt: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class ContentModerationDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/moderation`;

  constructor(private http: HttpClient) { }

  getPendingPhotos(filters: ModerationFilters = {}): Observable<ModerationPhotosResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ModerationPhotosResponse>(`${this.baseUrl}/photos`, { params });
  }

  approvePhoto(photoId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/photos/${photoId}/approve`, {});
  }

  rejectPhoto(photoId: string, reason: string, message?: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/photos/${photoId}/reject`, { reason, message });
  }

  getReports(filters: ReportFilters = {}): Observable<ReportsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ReportsResponse>(`${this.baseUrl}/reports`, { params });
  }
}