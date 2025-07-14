import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: 'order_completed' | 'photo_uploaded' | 'event_created' | 'system_announcement' | 'revenue_share';
  title: string;
  message: string;
  isRead: boolean;
  data?: {
    orderId?: string;
    eventId?: string;
    eventName?: string;
    photoId?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export interface SendNotificationRequest {
  recipients: string[];
  type: string;
  title: string;
  message: string;
  channels: Array<'email' | 'push' | 'in_app'>;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  constructor(private http: HttpClient) { }

  getNotifications(filters: NotificationFilters = {}): Observable<NotificationsResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<NotificationsResponse>(this.baseUrl, { params });
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/mark-all-read`, {});
  }

  sendNotification(notification: SendNotificationRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/send`, notification);
  }
}