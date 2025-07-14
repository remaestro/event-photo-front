import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'organizer' | 'photographer' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  stats: {
    totalEvents: number;
    totalPhotos: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;
}

export interface UpdateUserRoleRequest {
  role: 'admin' | 'organizer' | 'photographer' | 'client';
}

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  stats: {
    totalPhotos: number;
    totalViews: number;
    totalDownloads: number;
    totalRevenue: number;
  };
  createdAt: string;
  lastActivity: string;
}

export interface AdminEventFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  organizerId?: string;
}

export interface AdminEventsResponse {
  events: AdminEvent[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface UpdateEventStatusRequest {
  status: 'active' | 'inactive' | 'completed' | 'cancelled';
  reason?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalEvents: number;
  totalPhotos: number;
  totalRevenue: number;
  activeEvents: number;
  newUsersToday: number;
  revenueToday: number;
  popularEvents: Array<{
    id: string;
    title: string;
    views: number;
    downloads: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: 'user_registration' | 'event_created' | 'photo_uploaded' | 'order_placed';
    description: string;
    timestamp: string;
    userId?: string;
    eventId?: string;
  }>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    admin: number;
    organizer: number;
    photographer: number;
    client: number;
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
export class AdminDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient) { }

  // Users Management
  getUsers(filters: UserFilters = {}): Observable<UsersResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<UsersResponse>(`${this.baseUrl}/users`, { params });
  }

  getUser(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/users/${userId}`);
  }

  updateUserStatus(userId: string, statusData: UpdateUserStatusRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${userId}/status`, statusData);
  }

  updateUserRole(userId: string, roleData: UpdateUserRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/users/${userId}/role`, roleData);
  }

  // Events Management
  getEvents(filters: AdminEventFilters = {}): Observable<AdminEventsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<AdminEventsResponse>(`${this.baseUrl}/events`, { params });
  }

  updateEventStatus(eventId: string, statusData: UpdateEventStatusRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/events/${eventId}/status`, statusData);
  }

  deleteEvent(eventId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/events/${eventId}`);
  }

  // Statistics
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/statistics/dashboard`);
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.baseUrl}/statistics/users`);
  }
}