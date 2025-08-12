import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { EventService, Event } from '../../shared/services/event.service';
import { EventsDataService } from '../../shared/services/events-data.service';

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface EventFilters {
  status: string;
  visibility: string;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  events: Event[] = [];
  filteredEvents: Event[] = [];
  isLoading = true;
  
  filters: EventFilters = {
    status: 'all',
    visibility: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private eventService: EventService,
    private eventsDataService: EventsDataService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEvents() {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      return;
    }

    // Récupérer seulement les événements de l'organisateur connecté
    this.eventService.getMyEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.events = events;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading my events:', error);
          this.events = [];
          this.filteredEvents = [];
          this.isLoading = false;
        }
      });
  }

  applyFilters() {
    this.filteredEvents = this.events.filter(event => {
      const eventStatus = this.getEventStatus(event.date);
      const matchesStatus = this.filters.status === 'all' || eventStatus === this.filters.status;
      const matchesVisibility = this.filters.visibility === 'all'; // All events are public for now
      const matchesSearch = !this.filters.search || 
        event.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        event.location.toLowerCase().includes(this.filters.search.toLowerCase()) ||
        event.code.toLowerCase().includes(this.filters.search.toLowerCase());

      return matchesStatus && matchesVisibility && matchesSearch;
    });

    // Apply sorting
    this.filteredEvents.sort((a, b) => {
      let aValue, bValue;
      
      switch (this.filters.sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'revenue':
          aValue = 0; // Revenue not available in current Event interface
          bValue = 0;
          break;
        case 'photos':
          aValue = a.photoCount;
          bValue = b.photoCount;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (this.filters.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
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

  onFilterChange() {
    this.applyFilters();
  }

  createEvent() {
    this.router.navigate(['/organizer/events/create']);
  }

  manageEvent(eventId: string) {
    this.router.navigate(['/organizer/events', eventId, 'manage']);
  }

  uploadPhotos(eventId: string) {
    this.router.navigate(['/organizer/events', eventId, 'upload']);
  }

  duplicateEvent(event: Event) {
    this.router.navigate(['/organizer/events/create'], {
      queryParams: { duplicate: event.id }
    });
  }

  deleteEvent(event: Event) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.name}" ?`)) {
      // Call the actual delete API
      this.eventsDataService.deleteEvent(event.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // Remove from local array after successful API call
            this.events = this.events.filter(e => e.id !== event.id);
            this.applyFilters();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression de l\'événement:', error);
            alert('Erreur lors de la suppression de l\'événement. Veuillez réessayer.');
          }
        });
    }
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
    return '🌍'; // All events are public for now
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

  getBeneficiariesSummary(beneficiaries: Beneficiary[]): string {
    if (beneficiaries.length === 0) return 'Aucun bénéficiaire';
    const accepted = beneficiaries.filter(b => b.status === 'accepted').length;
    const pending = beneficiaries.filter(b => b.status === 'pending').length;
    return `${accepted} confirmé(s), ${pending} en attente`;
  }

  copyEventCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
    });
  }

  shareEvent(event: Event): void {
    const url = `${window.location.origin}/events/${event.code}`;
    navigator.clipboard.writeText(url).then(() => {
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}
