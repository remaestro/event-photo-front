import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SalesStatisticsService, SalesStatistics, RecentSale } from '../../shared/services/sales-statistics.service';
import { forkJoin } from 'rxjs';

interface Stats {
  totalPhotos: number;
  totalEarnings: number;
  totalSales: number;
  eventsCount: number;
}

interface Photo {
  id: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: Stats = {
    totalPhotos: 0,
    totalEarnings: 0,
    totalSales: 0,
    eventsCount: 0
  };

  recentSales: RecentSale[] = [];
  recentPhotos: Photo[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private salesService: SalesStatisticsService
  ) {}

  ngOnInit() {
    this.loadRealData();
  }

  private loadRealData() {
    // Charger les vraies données depuis l'API
    forkJoin({
      salesStats: this.salesService.getPhotographerSalesStatistics(),
      recentSales: this.salesService.getPhotographerRecentSales(5)
    }).subscribe({
      next: ({ salesStats, recentSales }) => {
        // Mapper les statistiques réelles
        this.stats = {
          totalPhotos: salesStats.totalPhotosSold, // Photos vendues par le photographe
          totalEarnings: salesStats.totalRevenue,
          totalSales: salesStats.totalSales,
          eventsCount: this.calculateEventsCount(recentSales) // Calculer depuis les ventes
        };

        // Utiliser les vraies ventes récentes
        this.recentSales = recentSales;

        // TODO: Charger les photos récentes depuis l'API photos
        // Pour l'instant, on garde une liste vide
        this.recentPhotos = [];

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading photographer data:', error);
        // En cas d'erreur, afficher des valeurs par défaut
        this.stats = {
          totalPhotos: 0,
          totalEarnings: 0,
          totalSales: 0,
          eventsCount: 0
        };
        this.recentSales = [];
        this.recentPhotos = [];
        this.isLoading = false;
      }
    });
  }

  private calculateEventsCount(sales: RecentSale[]): number {
    // Compter le nombre d'événements uniques dans les ventes récentes
    const uniqueEvents = new Set(sales.map(sale => sale.eventId));
    return uniqueEvents.size;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
