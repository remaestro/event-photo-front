import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrganizerDashboardStats {
  totalEvents: number;
  totalPhotos: number;
  totalRevenue: number;
  monthlyRevenue: number;
  photosSold: number;
  activeEvents: number;
  recentEvents: Array<{
    id: string;
    name: string;
    date: string;
    photosCount: number;
    revenue: number;
    status: string;
  }>;
  recentSales: Array<{
    photoId: string;
    eventName: string;
    amount: number;
    date: string;
    buyerName: string;
  }>;
}

export interface RevenueFilters {
  period?: 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface RevenueStats {
  period: string;
  data: Array<{
    date: string;
    revenue: number;
    sales: number;
    events: number;
  }>;
  totals: {
    revenue: number;
    sales: number;
    events: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrganizerStatisticsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/organizers/statistics`;

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<OrganizerDashboardStats> {
    return this.http.get<OrganizerDashboardStats>(`${this.baseUrl}/dashboard`);
  }

  getRevenueStats(filters: RevenueFilters = {}): Observable<RevenueStats> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<RevenueStats>(`${this.baseUrl}/revenue`, { params });
  }
}