import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EventService, Event, SearchFilters } from '../../shared/services/event.service';

@Component({
  selector: 'app-events-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './events-search.component.html',
  styleUrl: './events-search.component.css'
})
export class EventsSearchComponent implements OnInit, OnDestroy {
  searchResults: Event[] = [];
  availableTags: string[] = [];
  
  // Filtres de recherche
  searchFilters: SearchFilters = {
    searchTerm: '',
    eventCode: '',
    startDate: '',
    endDate: '',
    location: '',
    tags: []
  };

  isLoading = false;
  hasSearched = false;
  isQRScannerOpen = false;
  searchError = '';
  qrScanProgress = 0;
  qrScanStatus = '';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit() {
    this.loadAvailableTags();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Recherche d'événements
  searchEvents() {
    if (!this.hasValidSearchCriteria()) {
      this.searchError = 'Veuillez saisir au moins un critère de recherche (nom, code, lieu, date ou catégorie).';
      return;
    }

    if (!this.validateDateRange()) {
      this.searchError = 'La date de fin doit être postérieure à la date de début.';
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.searchError = '';

    this.eventService.searchEvents(this.searchFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (events) => {
          this.searchResults = events;
          this.isLoading = false;
          
          // Message informatif si aucun résultat
          if (events.length === 0) {
            this.searchError = 'Aucun événement ne correspond à vos critères. Essayez d\'élargir votre recherche.';
          }
        },
        error: (error) => {
          console.error('Erreur lors de la recherche:', error);
          this.searchError = 'Une erreur est survenue lors de la recherche. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  // Vérifier si les critères de recherche sont valides
  hasValidSearchCriteria(): boolean {
    return !!(
      (this.searchFilters.searchTerm && this.searchFilters.searchTerm.trim().length >= 2) ||
      (this.searchFilters.eventCode && this.searchFilters.eventCode.trim().length >= 3) ||
      (this.searchFilters.location && this.searchFilters.location.trim().length >= 2) ||
      this.searchFilters.startDate ||
      this.searchFilters.endDate ||
      (this.searchFilters.tags && this.searchFilters.tags.length > 0)
    );
  }

  // Valider la plage de dates
  validateDateRange(): boolean {
    if (this.searchFilters.startDate && this.searchFilters.endDate) {
      return new Date(this.searchFilters.startDate) <= new Date(this.searchFilters.endDate);
    }
    return true;
  }

  // Charger les tags disponibles
  private loadAvailableTags() {
    this.eventService.getAvailableTags()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tags) => {
          this.availableTags = tags;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des tags:', error);
        }
      });
  }

  // Ouvrir le scanner QR
  openQRScanner() {
    this.isQRScannerOpen = true;
    this.qrScanProgress = 0;
    this.qrScanStatus = 'Initialisation de la caméra...';
    this.simulateQRScan();
  }

  // Simulation du scan QR (plus réaliste)
  private simulateQRScan() {
    const steps = [
      { progress: 20, status: 'Caméra activée', delay: 500 },
      { progress: 40, status: 'Recherche de QR code...', delay: 800 },
      { progress: 60, status: 'QR code détecté', delay: 600 },
      { progress: 80, status: 'Décodage en cours...', delay: 400 },
      { progress: 100, status: 'Scan terminé !', delay: 300 }
    ];

    let currentStep = 0;

    const updateProgress = () => {
      if (currentStep < steps.length && this.isQRScannerOpen) {
        const step = steps[currentStep];
        this.qrScanProgress = step.progress;
        this.qrScanStatus = step.status;
        currentStep++;

        setTimeout(() => {
          if (currentStep === steps.length && this.isQRScannerOpen) {
            // Simulation de différents codes QR possibles
            const mockQRCodes = [
              'QR_EVT_2024_001', // Mariage Sophie & Marc
              'QR_EVT_2024_002', // Anniversaire Emma
              'QR_EVT_2024_003', // Concert Jazz
              'QR_INVALID_CODE'   // Code invalide pour tester
            ];
            const randomCode = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
            this.searchByQRCode(randomCode);
          } else {
            updateProgress();
          }
        }, step.delay);
      }
    };

    updateProgress();
  }

  // Recherche par code QR
  searchByQRCode(qrCode: string) {
    this.qrScanStatus = 'Recherche de l\'événement...';

    this.eventService.searchByQRCode(qrCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          this.isQRScannerOpen = false;
          this.qrScanProgress = 0;
          
          if (event) {
            this.searchResults = [event];
            this.hasSearched = true;
            this.searchError = '';
            // Mettre à jour les filtres pour refléter la recherche QR
            this.clearFilters();
            this.searchFilters.eventCode = event.code;
          } else {
            this.searchError = `Aucun événement trouvé pour le QR code "${qrCode}". Vérifiez que le code est valide.`;
          }
        },
        error: (error) => {
          console.error('Erreur lors de la recherche par QR code:', error);
          this.searchError = 'Erreur lors du scan du QR code. Veuillez réessayer.';
          this.isQRScannerOpen = false;
          this.qrScanProgress = 0;
        }
      });
  }

  // Fermer le scanner QR
  closeQRScanner() {
    this.isQRScannerOpen = false;
    this.qrScanProgress = 0;
    this.qrScanStatus = '';
  }

  // Ajouter/retirer un tag des filtres
  toggleTag(tag: string) {
    if (!this.searchFilters.tags) {
      this.searchFilters.tags = [];
    }

    const index = this.searchFilters.tags.indexOf(tag);
    if (index > -1) {
      this.searchFilters.tags.splice(index, 1);
    } else {
      this.searchFilters.tags.push(tag);
    }

    // Déclencher automatiquement la recherche si d'autres critères sont présents
    if (this.hasValidSearchCriteria() && this.hasSearched) {
      this.searchEvents();
    }
  }

  // Vérifier si un tag est sélectionné
  isTagSelected(tag: string): boolean {
    return this.searchFilters.tags?.includes(tag) || false;
  }

  // Réinitialiser les filtres
  clearFilters() {
    this.searchFilters = {
      searchTerm: '',
      eventCode: '',
      startDate: '',
      endDate: '',
      location: '',
      tags: []
    };
    this.searchResults = [];
    this.hasSearched = false;
    this.searchError = '';
  }

  // Aller à un événement
  goToEvent(eventId: string) {
    this.router.navigate(['/events', eventId, 'public']);
  }

  // Formater la date pour l'affichage
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let formattedDate = date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Ajouter une indication temporelle
    if (diffDays > 0) {
      formattedDate += ` (dans ${diffDays} jour${diffDays > 1 ? 's' : ''})`;
    } else if (diffDays === 0) {
      formattedDate += ' (aujourd\'hui)';
    } else if (diffDays === -1) {
      formattedDate += ' (hier)';
    } else if (diffDays > -7) {
      formattedDate += ` (il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`;
    }

    return formattedDate;
  }

  // Obtenir le nombre de critères actifs
  getActiveCriteriaCount(): number {
    let count = 0;
    if (this.searchFilters.searchTerm?.trim()) count++;
    if (this.searchFilters.eventCode?.trim()) count++;
    if (this.searchFilters.location?.trim()) count++;
    if (this.searchFilters.startDate) count++;
    if (this.searchFilters.endDate) count++;
    if (this.searchFilters.tags?.length) count++;
    return count;
  }

  // Recherche en temps réel (debounced)
  onSearchInputChange() {
    this.searchError = '';
    // La recherche automatique pourrait être ajoutée ici avec un debounce
  }
}
