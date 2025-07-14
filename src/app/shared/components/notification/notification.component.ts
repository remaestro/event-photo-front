import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications$: Observable<Notification[]>;
  private destroy$ = new Subject<void>();
  private notificationTimers = new Map<string, { startTime: number, duration: number }>();
  private progressCache = new Map<string, { value: number, timestamp: number }>();

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {
    // Track notification timers for progress bars
    this.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      // Add timers for new notifications
      notifications.forEach(notification => {
        if (!this.notificationTimers.has(notification.id)) {
          this.notificationTimers.set(notification.id, {
            startTime: Date.now(),
            duration: notification.duration || 5000
          });
        }
      });

      // Remove timers for dismissed notifications
      const currentIds = new Set(notifications.map(n => n.id));
      for (const [id] of this.notificationTimers) {
        if (!currentIds.has(id)) {
          this.notificationTimers.delete(id);
        }
      }
    });
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  getProgressWidth(notification: Notification): number {
    const timer = this.notificationTimers.get(notification.id);
    if (!timer) return 100;

    const now = Date.now();
    const cacheKey = notification.id;
    const cached = this.progressCache.get(cacheKey);
    
    // Use cached value if calculated within the same 100ms window to avoid rapid changes
    if (cached && (now - cached.timestamp) < 100) {
      return cached.value;
    }

    const elapsed = now - timer.startTime;
    const progress = Math.max(0, Math.min(100, (elapsed / timer.duration) * 100));
    const result = Math.round((100 - progress) * 10) / 10; // Round to 1 decimal place
    
    // Cache the result
    this.progressCache.set(cacheKey, {
      value: result,
      timestamp: now
    });
    
    return result;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.progressCache.clear();
  }
}
