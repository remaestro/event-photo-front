import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PhotoSearchFilters {
  eventCode?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PhotoSearchResponse {
  photos: Array<{
    id: string;
    eventId: string;
    eventName: string;
    thumbnail: string;
    watermarked: string;
    price: number;
    tags: string[];
    timestamp: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoSearchDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/photos/search`;

  constructor(private http: HttpClient) { }

  searchPhotos(filters: PhotoSearchFilters): Observable<PhotoSearchResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params = params.append(key, v.toString()));
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<PhotoSearchResponse>(this.baseUrl, { params });
  }
}