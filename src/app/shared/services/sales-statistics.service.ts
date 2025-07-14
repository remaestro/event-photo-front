import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecentSale {
  id: string;
  photoId: string;
  eventId: string;
  eventName: string;
  amount: number;
  date: string;
  buyerName: string;
  buyerEmail: string;
  photoCount: number;
}

export interface TopSellingPhoto {
  id: string;
  photoId: string;
  name: string;
  thumbnail: string;
  sales: number;
  views: number;
  revenue: number;
}

export interface SalesStatistics {
  totalSales: number;
  totalRevenue: number;
  totalPhotosSold: number;
  averageOrderValue: number;
  recentSales: RecentSale[];
  topSellingPhotos: TopSellingPhoto[];
}

export interface EventSalesStatistics {
  eventId: string;
  totalSales: number;
  totalRevenue: number;
  totalPhotosSold: number;
  conversionRate: number;
  recentSales: RecentSale[];
  topSellingPhotos: TopSellingPhoto[];
}

@Injectable({
  providedIn: 'root'
})
export class SalesStatisticsService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  // Obtenir les statistiques globales de ventes pour un organisateur
  getOrganizerSalesStatistics(): Observable<SalesStatistics> {
    return this.http.get<SalesStatistics>(`${this.baseUrl}/organizers/sales-statistics`);
  }

  // Obtenir les ventes récentes pour un organisateur
  getRecentSales(limit: number = 5): Observable<RecentSale[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentSale[]>(`${this.baseUrl}/organizers/recent-sales`, { params });
  }

  // Obtenir les statistiques de ventes pour un événement spécifique
  getEventSalesStatistics(eventId: string): Observable<EventSalesStatistics> {
    return this.http.get<EventSalesStatistics>(`${this.baseUrl}/events/${eventId}/sales-statistics`);
  }

  // Obtenir les photos les plus vendues pour un événement
  getTopSellingPhotos(eventId: string, limit: number = 5): Observable<TopSellingPhoto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopSellingPhoto[]>(`${this.baseUrl}/events/${eventId}/top-selling-photos`, { params });
  }

  // Obtenir les ventes récentes pour un événement spécifique
  getEventRecentSales(eventId: string, limit: number = 5): Observable<RecentSale[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentSale[]>(`${this.baseUrl}/events/${eventId}/recent-sales`, { params });
  }

  // Obtenir les statistiques de ventes pour un photographe
  getPhotographerSalesStatistics(): Observable<SalesStatistics> {
    return this.http.get<SalesStatistics>(`${this.baseUrl}/photographers/sales-statistics`);
  }

  // Obtenir les ventes récentes pour un photographe
  getPhotographerRecentSales(limit: number = 5): Observable<RecentSale[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentSale[]>(`${this.baseUrl}/photographers/recent-sales`, { params });
  }
}