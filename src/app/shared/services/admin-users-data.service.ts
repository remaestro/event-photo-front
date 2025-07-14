import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUserDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'organizer' | 'admin' | 'client';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  activity: Array<{
    type: string;
    details: string;
    timestamp: string;
  }>;
  stats: {
    eventsCount: number;
    photosCount: number;
    totalRevenue: number;
    totalOrders: number;
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
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
    stats: {
      eventsCount: number;
      photosCount: number;
      totalRevenue: number;
    };
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsersDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/admin/users`;

  constructor(private http: HttpClient) { }

  getUsers(filters: UserFilters = {}): Observable<UsersResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<UsersResponse>(this.baseUrl, { params });
  }

  getUser(userId: string): Observable<AdminUserDetails> {
    return this.http.get<AdminUserDetails>(`${this.baseUrl}/${userId}`);
  }

  updateUserStatus(userId: string, status: string, reason?: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/status`, { status, reason });
  }

  updateUserRole(userId: string, role: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${userId}/role`, { role });
  }
}