import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalPhotos: number;
  activeEvents: number;
  pendingModeration: number;
  platformGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'user_register' | 'event_created' | 'photo_upload' | 'purchase' | 'report';
  description: string;
  user: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
}

interface Alert {
  id: string;
  type: 'security' | 'performance' | 'moderation' | 'system';
  message: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: AdminStats = {
    totalUsers: 0,
    totalEvents: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalPhotos: 0,
    activeEvents: 0,
    pendingModeration: 0,
    platformGrowth: 0
  };

  recentActivity: RecentActivity[] = [];
  alerts: Alert[] = [];
  performanceMetrics: PerformanceMetric[] = [];
  isLoading = true;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    // Simulate API call
    setTimeout(() => {
      this.stats = {
        totalUsers: 1247,
        totalEvents: 89,
        totalRevenue: 34567.89,
        monthlyRevenue: 5670.23,
        totalPhotos: 12456,
        activeEvents: 23,
        pendingModeration: 15,
        platformGrowth: 23.5
      };

      this.recentActivity = [
        {
          id: '1',
          type: 'user_register',
          description: 'Nouvel utilisateur organisateur inscrit',
          user: 'marie.dupont@example.com',
          timestamp: '2 min',
          severity: 'info'
        },
        {
          id: '2',
          type: 'event_created',
          description: 'Événement "Concert Jazz 2025" créé',
          user: 'Pierre Martin',
          timestamp: '15 min',
          severity: 'info'
        },
        {
          id: '3',
          type: 'report',
          description: 'Signalement de contenu inapproprié',
          user: 'Utilisateur anonyme',
          timestamp: '1h',
          severity: 'warning'
        },
        {
          id: '4',
          type: 'photo_upload',
          description: '156 photos uploadées pour "Mariage Julie & Tom"',
          user: 'Sophie Photo',
          timestamp: '2h',
          severity: 'info'
        },
        {
          id: '5',
          type: 'purchase',
          description: 'Achat de 12 photos pour 89.50€',
          user: 'Client VIP',
          timestamp: '3h',
          severity: 'info'
        }
      ];

      this.alerts = [
        {
          id: '1',
          type: 'moderation',
          message: '15 photos en attente de modération depuis plus de 24h',
          timestamp: '1h',
          status: 'new',
          priority: 'high'
        },
        {
          id: '2',
          type: 'performance',
          message: 'Temps de réponse API supérieur à 2s',
          timestamp: '3h',
          status: 'acknowledged',
          priority: 'medium'
        },
        {
          id: '3',
          type: 'security',
          message: 'Tentatives de connexion suspectes détectées',
          timestamp: '6h',
          status: 'new',
          priority: 'critical'
        }
      ];

      this.performanceMetrics = [
        {
          name: 'Temps de réponse moyen',
          value: 1.2,
          unit: 's',
          status: 'good',
          trend: 'stable'
        },
        {
          name: 'Taux de conversion',
          value: 3.4,
          unit: '%',
          status: 'warning',
          trend: 'down'
        },
        {
          name: 'Uptime',
          value: 99.9,
          unit: '%',
          status: 'good',
          trend: 'stable'
        },
        {
          name: 'Stockage utilisé',
          value: 67,
          unit: '%',
          status: 'warning',
          trend: 'up'
        }
      ];

      this.isLoading = false;
    }, 1000);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  resolveAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_register':
        return '👤';
      case 'event_created':
        return '📅';
      case 'photo_upload':
        return '📸';
      case 'purchase':
        return '💰';
      case 'report':
        return '⚠️';
      default:
        return '📋';
    }
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'security':
        return '🔒';
      case 'performance':
        return '⚡';
      case 'moderation':
        return '🛡️';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  }

  getAlertColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  }

  getMetricColor(status: string): string {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return '➡️';
    }
  }

  getCriticalAlertsCount(): number {
    return this.alerts.filter(a => a.priority === 'critical' && a.status === 'new').length;
  }

  getNewAlertsCount(): number {
    return this.alerts.filter(a => a.status === 'new').length;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR').format(num);
  }
}
