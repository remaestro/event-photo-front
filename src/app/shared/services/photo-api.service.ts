import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';

// Interfaces pour les réponses API
export interface PhotoUrl {
  thumbnail: string;
  watermarked: string;
  original: string;
}

export interface PhotoDimensions {
  width: number;
  height: number;
}

export interface Photographer {
  id: string;
  name: string;
}

export interface PhotoPricing {
  digital: number;
  print: number;
}

export interface PhotoAnalytics {
  views: number;
  sales: number;
  revenue: number;
}

export interface ApiPhoto {
  id: string;
  filename: string;
  urls: PhotoUrl;
  dimensions: PhotoDimensions;
  fileSize: number;
  tags: string[];
  status: string;
  uploadDate: string;
  photographer: Photographer;
  pricing: PhotoPricing;
  analytics: PhotoAnalytics;
}

export interface EventPhotoGroup {
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  photos: ApiPhoto[];
  photoCount: number;
}

export interface MyPhotosResponse {
  events: EventPhotoGroup[];
  totalPhotos: number;
  totalEvents: number;
  page: number;
  limit: number;
}

export interface PurchasedPhoto extends ApiPhoto {
  purchaseDate: string;
  orderId: string;
  purchasePrice: number;
  downloadUrl: string;
  isDownloadable: boolean;
  eventName: string;
}

export interface PurchasedPhotosResponse {
  photos: PurchasedPhoto[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface PhotoStats {
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  activePhotos: number;
  pendingPhotos: number;
}

export interface OrganizerPhotosResponse {
  events: EventPhotoGroup[];
  totalPhotos: number;
  totalEvents: number;
  page: number;
  limit: number;
  stats: PhotoStats;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoApiService {

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /**
   * Récupérer toutes les photos de l'utilisateur connecté (adaptées selon le rôle)
   */
  getMyPhotos(
    page: number = 1,
    limit: number = 20,
    status?: string,
    sortBy: string = 'date',
    sortOrder: string = 'desc'
  ): Observable<MyPhotosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    if (status) {
      params = params.set('status', status);
    }

    const headers = this.getAuthHeaders();
    const apiUrl = `${environment.apiUrl}/api/photos/my-photos`;

    return this.http.get<MyPhotosResponse>(apiUrl, {
      headers,
      params
    });
  }

  /**
   * Récupérer les photos achetées par l'utilisateur
   */
  getPurchasedPhotos(
    page: number = 1,
    limit: number = 20,
    eventId?: string
  ): Observable<PurchasedPhotosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (eventId) {
      params = params.set('eventId', eventId);
    }

    return this.http.get<PurchasedPhotosResponse>(
      `${environment.apiUrl}/api/photos/purchased`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
  }

  /**
   * Récupérer les photos d'un organisateur (pour ses propres événements)
   */
  getOrganizerPhotos(
    organizerId: string,
    page: number = 1,
    limit: number = 20,
    eventId?: string,
    status?: string
  ): Observable<OrganizerPhotosResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (eventId) {
      params = params.set('eventId', eventId);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<OrganizerPhotosResponse>(
      `${environment.apiUrl}/api/photos/organizer/${organizerId}`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
  }

  /**
   * Récupérer les photos d'un événement spécifique
   */
  getEventPhotos(
    eventId: number,
    page: number = 1,
    limit: number = 10,
    status?: string,
    tags?: string[],
    photographer?: string,
    dateFrom?: string,
    dateTo?: string
  ): Observable<{ photos: ApiPhoto[]; totalCount: number; page: number; limit: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (status) params = params.set('status', status);
    if (photographer) params = params.set('photographer', photographer);
    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo) params = params.set('dateTo', dateTo);
    if (tags && tags.length > 0) {
      tags.forEach(tag => params = params.append('tags', tag));
    }

    return this.http.get<{ photos: ApiPhoto[]; totalCount: number; page: number; limit: number }>(
      `${environment.apiUrl}/api/events/${eventId}/photos`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
  }

  /**
   * Télécharger une photo achetée
   */
  downloadPhoto(photoId: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}/api/photos/${photoId}/download`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      }
    );
  }
}