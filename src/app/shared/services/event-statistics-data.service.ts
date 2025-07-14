import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventStatistics {
  totalPhotos: number;
  totalViews: number;
  totalDownloads: number;
  totalRevenue: number;
  viewsToday: number;
  downloadsToday: number;
  revenueToday: number;
  popularPhotos: Array<{
    id: string;
    url: string;
    views: number;
    downloads: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    downloads: number;
    revenue: number;
  }>;
}

export interface RevenueBreakdown {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  topBuyers: Array<{
    buyerName: string;
    totalSpent: number;
    orderCount: number;
  }>;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenueByPhoto: Array<{
    photoId: string;
    photoUrl: string;
    revenue: number;
    salesCount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class EventStatisticsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/events`;

  constructor(private http: HttpClient) { }

  getEventStatistics(eventId: string): Observable<EventStatistics> {
    return this.http.get<EventStatistics>(`${this.baseUrl}/${eventId}/statistics`);
  }

  getRevenueBreakdown(eventId: string): Observable<RevenueBreakdown> {
    return this.http.get<RevenueBreakdown>(`${this.baseUrl}/${eventId}/revenue-breakdown`);
  }
}