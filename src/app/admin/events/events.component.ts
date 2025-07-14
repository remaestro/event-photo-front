import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

interface AdminEvent {
  id: string;
  name: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  date: string;
  location: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'suspended' | 'cancelled';
  visibility: 'public' | 'private';
  photosCount: number;
  photosApproved: number;
  photosPending: number;
  photosRejected: number;
  salesCount: number;
  totalRevenue: number;
  participantsCount: number;
  beneficiaries: Beneficiary[];
  createdAt: string;
  lastActivity: string;
  reports: EventReport[];
  tags: string[];
  qrCode: string;
  eventCode: string;
}

interface Beneficiary {
  id: string;
  name: string;
  email: string;
  percentage: number;
  status: 'pending' | 'accepted' | 'declined';
}

interface EventReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface EventFilters {
  status: string;
  organizerId: string;
  visibility: string;
  dateFrom: string;
  dateTo: string;
  hasReports: boolean;
  search: string;
  minRevenue: number;
  maxRevenue: number;
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

  events: AdminEvent[] = [];
  filteredEvents: AdminEvent[] = [];
  selectedEvents: Set<string> = new Set();
  selectedEvent: AdminEvent | null = null;
  isLoading = true;
  showBulkActions = false;
  showEventModal = false;

  filters: EventFilters = {
    status: '',
    organizerId: '',
    visibility: '',
    dateFrom: '',
    dateTo: '',
    hasReports: false,
    search: '',
    minRevenue: 0,
    maxRevenue: 0
  };

  eventStats = {
    total: 0,
    active: 0,
    completed: 0,
    suspended: 0,
    reported: 0
  };

  pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createNewEvent(): void {
    this.router.navigate(['/organizer/events/create']);
  }

  editEvent(event: AdminEvent): void {
    // Naviguer vers le formulaire de modification avec l'ID de l'événement
    this.router.navigate(['/admin/events/edit', event.id]);
  }

  private loadEvents(): void {
    // Simulate API call
    setTimeout(() => {
      this.events = [
        {
          id: '1',
          name: 'Mariage Sophie & Marc',
          organizerId: 'user1',
          organizerName: 'Marie Dupont',
          organizerEmail: 'marie.dupont@example.com',
          date: '2025-07-15',
          location: 'Château de Versailles',
          description: 'Cérémonie de mariage dans un cadre exceptionnel',
          status: 'active',
          visibility: 'private',
          photosCount: 247,
          photosApproved: 235,
          photosPending: 8,
          photosRejected: 4,
          salesCount: 89,
          totalRevenue: 1856.40,
          participantsCount: 150,
          beneficiaries: [
            {
              id: 'b1',
              name: 'Jean Photographe',
              email: 'jean@photo.com',
              percentage: 20,
              status: 'accepted'
            }
          ],
          createdAt: '2025-06-15T10:00:00Z',
          lastActivity: '2025-07-06T15:30:00Z',
          reports: [],
          tags: ['mariage', 'château', 'luxe'],
          qrCode: 'QR123456',
          eventCode: 'MAR-2025-001'
        },
        {
          id: '2',
          name: 'Festival Rock 2025',
          organizerId: 'user2',
          organizerName: 'Pierre Martin',
          organizerEmail: 'pierre.martin@example.com',
          date: '2025-08-20',
          location: 'Parc de la Villette, Paris',
          description: 'Festival de musique rock avec 15 groupes',
          status: 'active',
          visibility: 'public',
          photosCount: 1523,
          photosApproved: 1456,
          photosPending: 45,
          photosRejected: 22,
          salesCount: 234,
          totalRevenue: 4567.80,
          participantsCount: 5000,
          beneficiaries: [
            {
              id: 'b2',
              name: 'Studio Photo Pro',
              email: 'contact@studiopro.com',
              percentage: 15,
              status: 'accepted'
            },
            {
              id: 'b3',
              name: 'Média Events',
              email: 'media@events.com',
              percentage: 10,
              status: 'pending'
            }
          ],
          createdAt: '2025-05-01T09:00:00Z',
          lastActivity: '2025-07-07T11:20:00Z',
          reports: [
            {
              id: 'r1',
              reporterId: 'user5',
              reporterName: 'Client Mécontent',
              reason: 'Photos de mauvaise qualité',
              description: 'Plusieurs photos sont floues et mal cadrées',
              timestamp: '2025-07-05T14:30:00Z',
              status: 'pending'
            }
          ],
          tags: ['festival', 'musique', 'rock', 'concert'],
          qrCode: 'QR789012',
          eventCode: 'FEST-2025-002'
        },
        {
          id: '3',
          name: 'Corporate Event TechCorp',
          organizerId: 'user3',
          organizerName: 'Sophie Pro',
          organizerEmail: 'sophie@techcorp.com',
          date: '2025-06-30',
          location: 'Centre de Conférences, Lyon',
          description: 'Événement corporate avec présentations et networking',
          status: 'completed',
          visibility: 'private',
          photosCount: 89,
          photosApproved: 87,
          photosPending: 0,
          photosRejected: 2,
          salesCount: 12,
          totalRevenue: 234.50,
          participantsCount: 200,
          beneficiaries: [],
          createdAt: '2025-06-01T08:00:00Z',
          lastActivity: '2025-07-01T09:15:00Z',
          reports: [],
          tags: ['corporate', 'business', 'networking'],
          qrCode: 'QR345678',
          eventCode: 'CORP-2025-003'
        },
        {
          id: '4',
          name: 'Événement Suspect',
          organizerId: 'user4',
          organizerName: 'User Problématique',
          organizerEmail: 'suspect@example.com',
          date: '2025-09-15',
          location: 'Location inconnue',
          description: 'Description suspecte avec contenu inapproprié',
          status: 'suspended',
          visibility: 'public',
          photosCount: 15,
          photosApproved: 5,
          photosPending: 3,
          photosRejected: 7,
          salesCount: 0,
          totalRevenue: 0,
          participantsCount: 10,
          beneficiaries: [],
          createdAt: '2025-07-01T16:00:00Z',
          lastActivity: '2025-07-02T10:30:00Z',
          reports: [
            {
              id: 'r2',
              reporterId: 'user6',
              reporterName: 'Utilisateur Vigilant',
              reason: 'Contenu inapproprié',
              description: 'Cet événement semble contenir du contenu non autorisé',
              timestamp: '2025-07-02T09:00:00Z',
              status: 'reviewed'
            }
          ],
          tags: ['suspect'],
          qrCode: 'QR901234',
          eventCode: 'SUSP-2025-004'
        }
      ];

      this.updateStats();
      this.applyFilters();
      this.isLoading = false;
    }, 1000);
  }

  private updateStats(): void {
    this.eventStats = {
      total: this.events.length,
      active: this.events.filter(e => e.status === 'active').length,
      completed: this.events.filter(e => e.status === 'completed').length,
      suspended: this.events.filter(e => e.status === 'suspended').length,
      reported: this.events.filter(e => e.reports.length > 0).length
    };
  }

  applyFilters(): void {
    let filtered = [...this.events];

    // Search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm) ||
        event.organizerName.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.eventCode.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.filters.status) {
      filtered = filtered.filter(event => event.status === this.filters.status);
    }

    // Organizer filter
    if (this.filters.organizerId) {
      filtered = filtered.filter(event => event.organizerId === this.filters.organizerId);
    }

    // Visibility filter
    if (this.filters.visibility) {
      filtered = filtered.filter(event => event.visibility === this.filters.visibility);
    }

    // Reports filter
    if (this.filters.hasReports) {
      filtered = filtered.filter(event => event.reports.length > 0);
    }

    // Date range filter
    if (this.filters.dateFrom || this.filters.dateTo) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        const fromDate = this.filters.dateFrom ? new Date(this.filters.dateFrom) : null;
        const toDate = this.filters.dateTo ? new Date(this.filters.dateTo) : null;

        return (!fromDate || eventDate >= fromDate) && (!toDate || eventDate <= toDate);
      });
    }

    // Revenue filter
    if (this.filters.minRevenue > 0 || this.filters.maxRevenue > 0) {
      filtered = filtered.filter(event => {
        const revenue = event.totalRevenue;
        return (this.filters.minRevenue === 0 || revenue >= this.filters.minRevenue) &&
               (this.filters.maxRevenue === 0 || revenue <= this.filters.maxRevenue);
      });
    }

    this.filteredEvents = filtered.sort((a, b) => {
      // Priority: reported events first, then by last activity
      if (a.reports.length > 0 && b.reports.length === 0) return -1;
      if (a.reports.length === 0 && b.reports.length > 0) return 1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });

    this.updatePagination();
  }

  private updatePagination(): void {
    this.pagination.totalItems = this.filteredEvents.length;
    this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.itemsPerPage);
    this.pagination.currentPage = Math.min(this.pagination.currentPage, this.pagination.totalPages || 1);
  }

  getPaginatedEvents(): AdminEvent[] {
    const startIndex = (this.pagination.currentPage - 1) * this.pagination.itemsPerPage;
    const endIndex = startIndex + this.pagination.itemsPerPage;
    return this.filteredEvents.slice(startIndex, endIndex);
  }

  onFilterChange(): void {
    this.pagination.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      organizerId: '',
      visibility: '',
      dateFrom: '',
      dateTo: '',
      hasReports: false,
      search: '',
      minRevenue: 0,
      maxRevenue: 0
    };
    this.onFilterChange();
  }

  viewEventDetails(event: AdminEvent): void {
    this.selectedEvent = event;
    this.showEventModal = true;
  }

  closeEventModal(): void {
    this.showEventModal = false;
    this.selectedEvent = null;
  }

  suspendEvent(eventId: string, reason: string): void {
    if (!reason.trim()) {
      alert('Veuillez fournir une raison pour la suspension');
      return;
    }

    const event = this.events.find(e => e.id === eventId);
    if (event && confirm(`Suspendre l'événement "${event.name}" ?`)) {
      event.status = 'suspended';
      this.updateStats();
      this.applyFilters();
    }
  }

  activateEvent(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'active';
      this.updateStats();
      this.applyFilters();
    }
  }

  deleteEvent(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event && confirm(`Supprimer définitivement l'événement "${event.name}" ? Cette action est irréversible.`)) {
      this.events = this.events.filter(e => e.id !== eventId);
      this.updateStats();
      this.applyFilters();
    }
  }

  contactOrganizer(organizerEmail: string): void {
    // Simulate contacting organizer
    alert(`Email envoyé à ${organizerEmail}`);
  }

  resolveEventReport(reportId: string, eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      const report = event.reports.find(r => r.id === reportId);
      if (report) {
        report.status = 'resolved';
        this.applyFilters();
      }
    }
  }

  exportEvents(): void {
    const csvContent = this.generateCSV();
    this.downloadCSV(csvContent, 'events-export.csv');
  }

  private generateCSV(): string {
    const headers = ['Code', 'Nom', 'Organisateur', 'Date', 'Lieu', 'Statut', 'Photos', 'Revenus', 'Participants'];
    const rows = this.filteredEvents.map(event => [
      event.eventCode,
      event.name,
      event.organizerName,
      event.date,
      event.location,
      event.status,
      event.photosCount.toString(),
      event.totalRevenue.toString(),
      event.participantsCount.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pagination.currentPage = page;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
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
      case 'suspended':
        return 'Suspendu';
      case 'cancelled':
        return 'Annulé';
      case 'draft':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  }

  getVisibilityIcon(visibility: string): string {
    return visibility === 'public' ? '🌐' : '🔒';
  }

  getPriorityIcon(event: AdminEvent): string {
    if (event.reports.length > 0) {
      return '🚨';
    }
    if (event.status === 'suspended') {
      return '⚠️';
    }
    if (event.photosPending > 10) {
      return '📸';
    }
    return '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  promptForReason(message: string): string {
    return window.prompt(message) || '';
  }

  getMath(): typeof Math {
    return Math;
  }

  getMathMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}
