import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { EventsDataService } from '../../../shared/services/events-data.service';
import { SalesStatisticsService, EventSalesStatistics, RecentSale, TopSellingPhoto } from '../../../shared/services/sales-statistics.service';

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  visibility: 'public' | 'private';
  code: string;
  qrCode: string;
  photosCount: number;
  revenue: number;
  price: number;
  tags: string[];
  organizer: string;
  beneficiaries: Beneficiary[];
  createdAt: string;
  updatedAt: string;
  soldPhotos?: number;
  totalViews?: number;
  conversionRate?: number;
}

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface EventStats {
  totalPhotos: number;
  soldPhotos: number;
  totalRevenue: number;
  totalViews: number;
  conversionRate: number;
  recentSales: RecentSale[];
  topPhotos: TopSellingPhoto[];
}

@Component({
  selector: 'app-manage-event',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manage-event.component.html',
  styleUrl: './manage-event.component.css'
})
export class ManageEventComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  eventId: string = '';
  event: Event | null = null;
  stats: EventStats | null = null;
  isLoading = true;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsDataService: EventsDataService,
    private salesService: SalesStatisticsService
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    if (!this.eventId) {
      this.router.navigate(['/organizer/events']);
      return;
    }
    
    this.loadEvent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEvent(): void {
    this.eventsDataService.getEvent(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event) {
            this.event = {
              ...event,
              name: event.name || event.title,
              code: event.code || event.publicCode,
              photosCount: event.stats?.totalPhotos || 0,
              revenue: event.stats?.totalRevenue || 0,
              price: event.photoPrice || 0,
              tags: event.tags || [],
              organizer: event.organizerName || event.organizer?.name || '',
              beneficiaries: [],
              soldPhotos: Math.floor((event.stats?.totalPhotos || 0) * 0.15),
              totalViews: (event.stats?.totalPhotos || 0) * 12,
              visibility: 'public',
              status: this.mapApiStatusToLocal(event.status),
              qrCode: event.qrCode || '',
              createdAt: event.createdAt || new Date().toISOString(),
              updatedAt: event.updatedAt || new Date().toISOString()
            };
            
            if (this.event.totalViews && this.event.totalViews > 0) {
              this.event.conversionRate = (this.event.soldPhotos || 0) / this.event.totalViews * 100;
            } else {
              this.event.conversionRate = 0;
            }
            
            this.loadStats();
          } else {
            console.error('Event not found');
            this.router.navigate(['/organizer/events']);
          }
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.isLoading = false;
          this.router.navigate(['/organizer/events']);
        }
      });
  }

  private mapApiStatusToLocal(apiStatus: string): 'draft' | 'active' | 'completed' {
    switch (apiStatus) {
      case 'inactive':
        return 'draft';
      case 'completed':
        return 'completed';
      case 'active':
      default:
        return 'active';
    }
  }

  private loadStats(): void {
    if (!this.event) return;

    // Charger les vraies statistiques de ventes depuis l'API
    forkJoin({
      salesStats: this.salesService.getEventSalesStatistics(this.eventId),
      recentSales: this.salesService.getEventRecentSales(this.eventId, 5),
      topPhotos: this.salesService.getTopSellingPhotos(this.eventId, 5)
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ salesStats, recentSales, topPhotos }) => {
        this.stats = {
          totalPhotos: this.event!.photosCount,
          soldPhotos: salesStats.totalPhotosSold,
          totalRevenue: salesStats.totalRevenue,
          totalViews: this.event!.totalViews || 0,
          conversionRate: salesStats.conversionRate,
          recentSales: recentSales,
          topPhotos: topPhotos
        };
        
        // Mettre à jour les stats de l'événement avec les vraies données
        if (this.event) {
          this.event.soldPhotos = salesStats.totalPhotosSold;
          this.event.revenue = salesStats.totalRevenue;
          this.event.conversionRate = salesStats.conversionRate;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading sales statistics:', error);
        // En cas d'erreur, afficher l'événement sans les statistiques
        this.stats = {
          totalPhotos: this.event!.photosCount,
          soldPhotos: 0,
          totalRevenue: 0,
          totalViews: 0,
          conversionRate: 0,
          recentSales: [],
          topPhotos: []
        };
        this.isLoading = false;
      }
    });
  }

  // Actions
  uploadPhotos(): void {
    this.router.navigate(['/organizer/events', this.eventId, 'upload']);
  }

  editEvent(): void {
    this.router.navigate(['/organizer/events/create'], {
      queryParams: { edit: this.eventId }
    });
  }

  shareEvent(): void {
    const url = `${window.location.origin}/events/${this.event?.code}/public`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Lien de l\'événement copié dans le presse-papier !');
    });
  }

  downloadQRCode(): void {
    alert('Fonctionnalité à implémenter : Téléchargement du QR Code');
  }

  exportData(): void {
    alert('Fonctionnalité à implémenter : Export des données');
  }

  manageBeneficiaries(): void {
    this.router.navigate(['/organizer/events', this.eventId, 'beneficiaries']);
  }

  viewAllPhotos(): void {
    this.router.navigate(['/organizer/photos'], {
      queryParams: { eventId: this.eventId }
    });
  }

  goBackToEvents(): void {
    this.router.navigate(['/organizer/events']);
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

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  getVisibilityIcon(visibility: string): string {
    return visibility === 'public' ? '🌍' : '🔒';
  }

  getConversionRateColor(rate: number): string {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  }
}
