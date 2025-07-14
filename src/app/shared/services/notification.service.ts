import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { NotificationsDataService, Notification as ApiNotification } from './notifications-data.service';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  duration?: number; // Add duration for backward compatibility
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private notificationsDataService: NotificationsDataService) {
    this.loadNotifications();
  }

  /**
   * For development - allow notifications to work without strict auth when API fails
   */
  private allowFallbackMode(): boolean {
    // In development, allow fallback to mock data if API authentication fails
    return !environment.production;
  }

  /**
   * Check if user is authenticated for API calls
   */
  private isUserAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Charger les notifications - now uses real API
   */
  loadNotifications(): void {
    // Check if user is authenticated
    if (!this.isUserAuthenticated() && !this.allowFallbackMode()) {
      console.warn('User not authenticated, using mock notifications');
      this.loadNotificationsMock().subscribe(response => {
        const notifications = this.mapApiNotificationsToLocal(response.notifications);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      });
      return;
    }

    this.notificationsDataService.getNotifications({ page: 1, limit: 50 }).pipe(
      catchError((error) => {
        console.warn('API call failed, falling back to mock data:', error);
        // Fallback to mock implementation
        return this.loadNotificationsMock();
      })
    ).subscribe(response => {
      const notifications = this.mapApiNotificationsToLocal(response.notifications);
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    });
  }

  /**
   * Marquer une notification comme lue - now uses real API
   */
  markAsRead(notificationId: string): Observable<boolean> {
    return this.notificationsDataService.markAsRead(notificationId).pipe(
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.markAsReadMock(notificationId);
      })
    );
  }

  /**
   * Marquer toutes les notifications comme lues - now uses real API
   */
  markAllAsRead(): Observable<boolean> {
    return this.notificationsDataService.markAllAsRead().pipe(
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.markAllAsReadMock();
      })
    );
  }

  /**
   * Supprimer une notification - uses mock for now (API method not available)
   */
  deleteNotification(notificationId: string): Observable<boolean> {
    return this.deleteNotificationMock(notificationId);
  }

  /**
   * Supprimer une notification (alias pour deleteNotification)
   */
  removeNotification(notificationId: string): void {
    this.deleteNotification(notificationId).subscribe();
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  /**
   * Afficher une notification toast temporaire
   */
  showToast(type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, duration: number = 5000): void {
    // This creates a temporary toast notification
    const toast: Notification = {
      id: 'toast_' + Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      icon: this.getIconForType(type),
      duration
    };

    // Add to notifications temporarily
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([toast, ...current]);

    // Remove after duration
    setTimeout(() => {
      const updated = this.notificationsSubject.value.filter(n => n.id !== toast.id);
      this.notificationsSubject.next(updated);
    }, duration);
  }

  /**
   * Méthodes de convenance pour les toasts
   */
  success(title: string, message: string = ''): void {
    this.showToast('success', title, message);
  }

  error(title: string, message: string = ''): void {
    this.showToast('error', title, message);
  }

  warning(title: string, message: string = ''): void {
    this.showToast('warning', title, message);
  }

  info(title: string, message: string = ''): void {
    this.showToast('info', title, message);
  }

  // Helper methods
  private mapApiNotificationsToLocal(apiNotifications: ApiNotification[]): Notification[] {
    return apiNotifications.map(apiNotification => ({
      id: apiNotification.id,
      type: this.mapApiTypeToLocal(apiNotification.type),
      title: apiNotification.title,
      message: apiNotification.message,
      timestamp: apiNotification.createdAt,
      read: apiNotification.isRead || false, // Use isRead from API if available
      actionUrl: undefined, // Not available in current API
      actionText: undefined, // Not available in current API
      icon: this.getIconForType(this.mapApiTypeToLocal(apiNotification.type))
    }));
  }

  private mapApiTypeToLocal(apiType: string): 'info' | 'success' | 'warning' | 'error' {
    switch (apiType.toLowerCase()) {
      case 'order_completed': return 'success';
      case 'photo_uploaded': return 'info';
      case 'event_created': return 'info';
      case 'system_announcement': return 'warning';
      case 'revenue_share': return 'info';
      default: return 'info';
    }
  }

  private getIconForType(type: 'info' | 'success' | 'warning' | 'error'): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  // Mock implementations for fallback
  private loadNotificationsMock(): Observable<{ notifications: ApiNotification[] }> {
    // Return empty notifications array - no more test notifications
    const mockNotifications: ApiNotification[] = [];

    return of({ notifications: mockNotifications }).pipe(delay(300));
  }

  private markAsReadMock(notificationId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
        return true;
      })
    );
  }

  private markAllAsReadMock(): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({ ...n, read: true }));
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
        return true;
      })
    );
  }

  private deleteNotificationMock(notificationId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(updatedNotifications);
        this.updateUnreadCount();
        return true;
      })
    );
  }
}
