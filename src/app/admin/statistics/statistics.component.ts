import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface GrowthMetrics {
  userGrowth: number;
  eventGrowth: number;
  revenueGrowth: number;
  photoGrowth: number;
}

interface ConversionRates {
  visitorToUser: number;
  userToClient: number;
  scanToSale: number;
  cartToCheckout: number;
}

interface RegionalPerformance {
  region: string;
  users: number;
  events: number;
  revenue: number;
  averageOrderValue: number;
}

interface EventTypePerformance {
  type: string;
  count: number;
  totalPhotos: number;
  totalSales: number;
  averagePrice: number;
}

interface CustomReport {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  lastGenerated?: Date;
}

interface UsageTrend {
  date: Date;
  activeUsers: number;
  newUsers: number;
  events: number;
  revenue: number;
}

interface AdvancedMetrics {
  userRetentionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  customerLifetimeValue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
}

interface TopPerformer {
  id: string;
  name: string;
  type: 'organizer' | 'event' | 'photo';
  value: number;
  metric: string;
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  condition: 'above' | 'below';
  message: string;
}

interface SystemHealth {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeConnections: number;
  memoryUsage: number;
  cpuUsage: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, OnDestroy {
  isLoading = true;
  
  // Filters
  selectedPeriod = '30d';
  selectedRegion = 'all';
  selectedEventType = 'all';
  exportFormat = 'xlsx';

  // Data
  growthMetrics: GrowthMetrics = {
    userGrowth: 15.7,
    eventGrowth: 23.4,
    revenueGrowth: 18.9,
    photoGrowth: 32.1
  };

  conversionRates: ConversionRates = {
    visitorToUser: 12.5,
    userToClient: 34.8,
    scanToSale: 28.3,
    cartToCheckout: 72.1
  };

  regionalPerformance: RegionalPerformance[] = [
    { region: 'Île-de-France', users: 1284, events: 156, revenue: 45670, averageOrderValue: 78.50 },
    { region: 'PACA', users: 892, events: 98, revenue: 32150, averageOrderValue: 82.30 },
    { region: 'Auvergne-Rhône-Alpes', users: 743, events: 87, revenue: 28420, averageOrderValue: 75.60 },
    { region: 'Occitanie', users: 621, events: 72, revenue: 24780, averageOrderValue: 79.80 },
    { region: 'Nouvelle-Aquitaine', users: 534, events: 61, revenue: 19340, averageOrderValue: 74.20 }
  ];

  eventTypePerformance: EventTypePerformance[] = [
    { type: 'Mariage', count: 298, totalPhotos: 45780, totalSales: 8934, averagePrice: 12.50 },
    { type: 'Concert', count: 124, totalPhotos: 32150, totalSales: 6721, averagePrice: 8.90 },
    { type: 'Événement d\'entreprise', count: 89, totalPhotos: 18640, totalSales: 3892, averagePrice: 15.20 },
    { type: 'Festival', count: 67, totalPhotos: 28390, totalSales: 5234, averagePrice: 10.80 },
    { type: 'Autre', count: 156, totalPhotos: 21450, totalSales: 4187, averagePrice: 11.30 }
  ];

  customReports: CustomReport[] = [
    {
      id: '1',
      name: 'Rapport mensuel des ventes',
      description: 'Analyse complète des performances de vente sur 30 jours',
      metrics: ['revenue', 'conversion_rate', 'regional_performance'],
      lastGenerated: new Date('2025-07-06T10:30:00')
    },
    {
      id: '2',
      name: 'Analyse des organisateurs top',
      description: 'Performances des 20 meilleurs organisateurs',
      metrics: ['user_growth', 'event_performance', 'photo_uploads'],
      lastGenerated: new Date('2025-07-05T14:15:00')
    }
  ];

  usageTrends: UsageTrend[] = [];

  // New report builder
  newReport: Partial<CustomReport> = {
    name: '',
    description: '',
    metrics: []
  };

  availableMetrics = [
    'user_growth',
    'event_growth',
    'revenue_growth',
    'photo_growth',
    'conversion_rate',
    'regional_performance',
    'event_performance',
    'photo_uploads',
    'user_engagement',
    'payment_methods'
  ];

  // Advanced analytics data
  advancedMetrics: AdvancedMetrics = {
    userRetentionRate: 78.5,
    averageSessionDuration: 12.3,
    bounceRate: 23.7,
    customerLifetimeValue: 234.50,
    monthlyRecurringRevenue: 45670,
    churnRate: 4.2
  };

  topPerformers: TopPerformer[] = [
    { id: '1', name: 'PhotoPro Paris', type: 'organizer', value: 15680, metric: 'Revenus (€)' },
    { id: '2', name: 'Mariage de Sophie & Marc', type: 'event', value: 1234, metric: 'Photos vendues' },
    { id: '3', name: 'IMG_2023_wedding_001.jpg', type: 'photo', value: 156, metric: 'Ventes' },
    { id: '4', name: 'EventMaster Lyon', type: 'organizer', value: 12450, metric: 'Revenus (€)' },
    { id: '5', name: 'Festival Rock 2025', type: 'event', value: 987, metric: 'Photos vendues' }
  ];

  alertThresholds: AlertThreshold[] = [
    { metric: 'error_rate', threshold: 5, condition: 'above', message: 'Taux d\'erreur élevé détecté' },
    { metric: 'conversion_rate', threshold: 10, condition: 'below', message: 'Taux de conversion faible' },
    { metric: 'revenue_growth', threshold: 0, condition: 'below', message: 'Croissance des revenus négative' }
  ];

  systemHealth: SystemHealth = {
    uptime: 99.8,
    responseTime: 245,
    errorRate: 0.12,
    activeConnections: 1847,
    memoryUsage: 67.3,
    cpuUsage: 34.2
  };

  ngOnInit() {
    this.loadStatistics();
  }

  async loadStatistics() {
    this.isLoading = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate usage trends data
    this.generateUsageTrends();
    
    this.isLoading = false;
  }

  generateUsageTrends() {
    const days = this.getPeriodDays();
    this.usageTrends = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      this.usageTrends.push({
        date,
        activeUsers: Math.floor(Math.random() * 500) + 200,
        newUsers: Math.floor(Math.random() * 50) + 10,
        events: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 1000
      });
    }
  }

  getPeriodDays(): number {
    switch (this.selectedPeriod) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  onPeriodChange() {
    this.loadStatistics();
  }

  onRegionChange() {
    this.loadStatistics();
  }

  onEventTypeChange() {
    this.loadStatistics();
  }

  // Handle metric checkbox changes
  onMetricChange(event: Event, metric: string) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.addMetricToReport(metric);
    } else {
      this.removeMetricFromReport(metric);
    }
  }

  exportData() {
    const data = {
      period: this.selectedPeriod,
      region: this.selectedRegion,
      eventType: this.selectedEventType,
      growthMetrics: this.growthMetrics,
      conversionRates: this.conversionRates,
      regionalPerformance: this.regionalPerformance,
      eventTypePerformance: this.eventTypePerformance,
      usageTrends: this.usageTrends,
      exportedAt: new Date()
    };

    const filename = `statistics_${this.selectedPeriod}_${Date.now()}`;
    
    switch (this.exportFormat) {
      case 'json':
        this.downloadJSON(data, filename);
        break;
      case 'csv':
        this.downloadCSV(data, filename);
        break;
      case 'xlsx':
        this.downloadExcel(data, filename);
        break;
    }
  }

  downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${filename}.json`);
  }

  downloadCSV(data: any, filename: string) {
    // Convert regional performance to CSV
    let csv = 'Region,Users,Events,Revenue,Average Order Value\n';
    data.regionalPerformance.forEach((row: RegionalPerformance) => {
      csv += `${row.region},${row.users},${row.events},${row.revenue},${row.averageOrderValue}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadBlob(blob, `${filename}.csv`);
  }

  downloadExcel(data: any, filename: string) {
    // Simplified Excel export (would use a library like XLSX in real implementation)
    alert('Export Excel nécessite une bibliothèque dédiée (XLSX.js)');
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  getGrowthColor(value: number): string {
    if (value >= 20) {
      return 'text-green-600';
    } else if (value >= 10) {
      return 'text-blue-600';
    } else if (value >= 0) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  getGrowthIcon(value: number): string {
    if (value >= 10) {
      return '📈';
    } else if (value >= 0) {
      return '➡️';
    } else {
      return '📉';
    }
  }

  getConversionColor(value: number): string {
    if (value >= 50) {
      return 'text-green-600';
    } else if (value >= 30) {
      return 'text-blue-600';
    } else if (value >= 15) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  // Custom Reports functionality
  generateReport(reportId: string) {
    const report = this.customReports.find(r => r.id === reportId);
    if (report) {
      // Simulate report generation
      console.log(`Génération du rapport: ${report.name}`);
      
      // Update last generated date
      report.lastGenerated = new Date();
      
      // In real implementation, this would trigger a backend API call
      alert(`Rapport "${report.name}" généré avec succès !`);
    }
  }

  deleteReport(reportId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      this.customReports = this.customReports.filter(r => r.id !== reportId);
      alert('Rapport supprimé avec succès !');
    }
  }

  createCustomReport() {
    if (!this.newReport.name || !this.newReport.description || !this.newReport.metrics || this.newReport.metrics.length === 0) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const report: CustomReport = {
      id: Date.now().toString(),
      name: this.newReport.name,
      description: this.newReport.description,
      metrics: [...this.newReport.metrics],
      lastGenerated: undefined
    };

    this.customReports.push(report);
    
    // Reset form
    this.newReport = {
      name: '',
      description: '',
      metrics: []
    };

    alert('Rapport personnalisé créé avec succès !');
  }

  addMetricToReport(metric: string) {
    if (!this.newReport.metrics) {
      this.newReport.metrics = [];
    }
    
    if (!this.newReport.metrics.includes(metric)) {
      this.newReport.metrics.push(metric);
    }
  }

  removeMetricFromReport(metric: string) {
    if (this.newReport.metrics) {
      this.newReport.metrics = this.newReport.metrics.filter(m => m !== metric);
    }
  }

  // Advanced Analytics Methods
  getTopPerformingRegion(): RegionalPerformance {
    return this.regionalPerformance.reduce((top, current) => 
      current.revenue > top.revenue ? current : top
    );
  }

  getTopPerformingEventType(): EventTypePerformance {
    return this.eventTypePerformance.reduce((top, current) => 
      current.totalSales > top.totalSales ? current : top
    );
  }

  getTotalRevenue(): number {
    return this.regionalPerformance.reduce((total, region) => total + region.revenue, 0);
  }

  getAverageConversionRate(): number {
    const rates = Object.values(this.conversionRates);
    return rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
  }

  // Real-time updates simulation
  private updateInterval: any;

  startRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.simulateRealTimeUpdate();
    }, 30000); // Update every 30 seconds
  }

  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  private simulateRealTimeUpdate() {
    // Simulate small changes in metrics
    this.growthMetrics.userGrowth += (Math.random() - 0.5) * 0.5;
    this.growthMetrics.eventGrowth += (Math.random() - 0.5) * 0.5;
    this.growthMetrics.revenueGrowth += (Math.random() - 0.5) * 0.5;
    this.growthMetrics.photoGrowth += (Math.random() - 0.5) * 0.5;

    // Update conversion rates slightly
    Object.keys(this.conversionRates).forEach(key => {
      (this.conversionRates as any)[key] += (Math.random() - 0.5) * 0.2;
    });
  }

  ngOnDestroy() {
    this.stopRealTimeUpdates();
  }
}
