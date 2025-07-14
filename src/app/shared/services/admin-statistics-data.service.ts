import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminDashboardStats {
  platform: {
    totalUsers: number;
    totalEvents: number;
    totalPhotos: number;
    totalRevenue: number;
    monthlyActiveUsers: number;
  };
  growth: {
    usersGrowth: number;
    eventsGrowth: number;
    revenueGrowth: number;
  };
  recentActivity: Array<{
    type: string;
    user: string;
    eventName?: string;
    timestamp: string;
  }>;
}

export interface UserStats {
  usersByRole: {
    clients: number;
    organizers: number;
    admins: number;
  };
  usersByStatus: {
    active: number;
    inactive: number;
    suspended: number;
  };
  registrationTrend: Array<{
    date: string;
    count: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminStatisticsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/statistics`;

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<AdminDashboardStats> {
    return this.http.get<AdminDashboardStats>(`${this.baseUrl}/dashboard`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.baseUrl}/users`);
  }
}