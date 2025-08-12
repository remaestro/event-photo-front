import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventService } from '../../shared/services/event.service';
import { AuthService } from '../../shared/services/auth.service';
import { SalesStatisticsService, RecentSale } from '../../shared/services/sales-statistics.service';
import { forkJoin } from 'rxjs';

interface OrganizerStats {
  totalEvents: number;
  totalPhotos: number;
  totalRevenue: number;
  monthlyRevenue: number;
  photosSold: number;
  activeEvents: number;
}

interface RecentEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  photosCount: number;
  status: 'draft' | 'active' | 'completed';
  revenue: number;
}

interface BeneficiaryEvent {
  id: string;
  name: string;
  organizer: string;
  percentage: number;
  revenue: number;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: OrganizerStats = {
    totalEvents: 0,
    totalPhotos: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    photosSold: 0,
    activeEvents: 0
  };

  recentEvents: RecentEvent[] = [];
  recentSales: RecentSale[] = [];
  beneficiaryEvents: BeneficiaryEvent[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private eventService: EventService,
    private authService: AuthService,
    private salesService: SalesStatisticsService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    // Charger seulement les événements de l'organisateur connecté pour l'instant
    // Les autres services seront ajoutés quand ils seront disponibles
    this.eventService.getMyEvents().subscribe({
      next: (events) => {
        // Calculer les statistiques à partir des événements uniquement
        this.stats = {
          totalEvents: events.length,
          totalPhotos: events.reduce((sum, event) => sum + event.photoCount, 0),
          totalRevenue: 0, // À implémenter quand le service de ventes sera disponible
          monthlyRevenue: 0, // À implémenter quand le service de ventes sera disponible
          photosSold: 0, // À implémenter quand le service de ventes sera disponible
          activeEvents: events.filter(e => this.getEventStatus(e.date) === 'active').length
        };

        // Mapper les événements récents
        this.recentEvents = events
          .slice(0, 3)
          .map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            location: event.location,
            photosCount: event.photoCount,
            status: this.getEventStatus(event.date),
            revenue: 0 // À implémenter quand le service de ventes sera disponible
          }));

        // Vides pour l'instant
        this.recentSales = [];
        this.beneficiaryEvents = [];

        this.isLoading = false;
        console.log('Dashboard loaded successfully with events:', events);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  private calculateMonthlyRevenue(sales: RecentSale[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);
  }

  private calculateEventRevenue(eventId: string, sales: RecentSale[]): number {
    return sales
      .filter(sale => sale.eventId === eventId)
      .reduce((sum, sale) => sum + sale.amount, 0);
  }

  private getEventStatus(dateString: string): 'draft' | 'active' | 'completed' {
    const eventDate = new Date(dateString);
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    if (eventDateOnly > todayDateOnly) {
      return 'active'; // Future event
    } else if (eventDateOnly.getTime() === todayDateOnly.getTime()) {
      return 'active'; // Today's event
    } else {
      return 'completed'; // Past event
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  createNewEvent() {
    this.router.navigate(['/organizer/events/create']);
  }

  manageEvent(eventId: string) {
    this.router.navigate(['/organizer/events', eventId, 'manage']);
  }

  uploadPhotos(eventId: string) {
    this.router.navigate(['/organizer/events', eventId, 'upload']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'completed':
        return 'Terminé';
      case 'draft':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
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
