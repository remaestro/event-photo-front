import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EventService, Event } from '../../shared/services/event.service';
import { PhotoService, Photo } from '../../shared/services/photo.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

@Component({
  selector: 'app-event-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-public.component.html',
  styleUrl: './event-public.component.css'
})
export class EventPublicComponent implements OnInit, OnDestroy {
  event: Event | null = null;
  isLoading = true;
  error = '';
  eventId = '';
  
  // Photos d'aperçu
  previewPhotos: Photo[] = [];
  isLoadingPhotos = false;

  selectedPhotoIndex = 0;
  showInstructions = false;
  showContactForm = false;

  // Formulaire de contact
  contactForm = {
    name: '',
    email: '',
    message: '',
    subject: 'Question sur l\'événement'
  };
  isSubmittingContact = false;
  contactSubmitted = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private photoService: PhotoService,
    public imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    this.eventId = this.route.snapshot.params['id'];
    if (this.eventId) {
      this.loadEvent();
      this.loadPreviewPhotos();
    } else {
      this.error = 'ID d\'événement manquant';
      this.isLoading = false;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Charger les détails de l'événement
  private loadEvent() {
    this.eventService.getEventById(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (event) => {
          if (event) {
            this.event = event;
          } else {
            this.error = 'Événement introuvable';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'événement:', error);
          this.error = 'Erreur lors du chargement des données';
          this.isLoading = false;
        }
      });
  }

  // Charger les photos d'aperçu
  private loadPreviewPhotos() {
    this.isLoadingPhotos = true;
    this.photoService.getEventPreviewPhotos(this.eventId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (photos) => {
          this.previewPhotos = photos;
          this.isLoadingPhotos = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des photos:', error);
          this.isLoadingPhotos = false;
        }
      });
  }

  // Démarrer le scan facial
  startFacialScan() {
    this.router.navigate(['/scan', this.eventId]);
  }

  // Afficher/masquer les instructions
  toggleInstructions() {
    this.showInstructions = !this.showInstructions;
  }

  // Afficher/masquer le formulaire de contact
  toggleContactForm() {
    this.showContactForm = !this.showContactForm;
  }

  // Soumettre le formulaire de contact
  submitContactForm() {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
      return;
    }

    this.isSubmittingContact = true;

    // Simuler l'envoi du message
    setTimeout(() => {
      this.contactSubmitted = true;
      this.isSubmittingContact = false;
      
      // Réinitialiser le formulaire après 3 secondes
      setTimeout(() => {
        this.contactSubmitted = false;
        this.showContactForm = false;
        this.contactForm = {
          name: '',
          email: '',
          message: '',
          subject: 'Question sur l\'événement'
        };
      }, 3000);
    }, 1500);
  }

  // Navigation dans la galerie d'aperçu
  selectPhoto(index: number) {
    this.selectedPhotoIndex = index;
  }

  previousPhoto() {
    this.selectedPhotoIndex = this.selectedPhotoIndex > 0 
      ? this.selectedPhotoIndex - 1 
      : this.previewPhotos.length - 1;
  }

  nextPhoto() {
    this.selectedPhotoIndex = this.selectedPhotoIndex < this.previewPhotos.length - 1 
      ? this.selectedPhotoIndex + 1 
      : 0;
  }

  // Formater la date pour l'affichage
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let formattedDate = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
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
    } else if (diffDays > -30) {
      formattedDate += ` (il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''})`;
    } else {
      const diffMonths = Math.abs(Math.floor(diffDays / 30));
      formattedDate += ` (il y a ${diffMonths} mois)`;
    }

    return formattedDate;
  }

  // Copier le code de l'événement
  copyEventCode() {
    if (this.event?.code) {
      navigator.clipboard.writeText(this.event.code).then(() => {
        // Vous pourriez ajouter une notification toast ici
        console.log('Code copié !');
      });
    }
  }

  // Partager l'événement
  shareEvent() {
    if (navigator.share && this.event) {
      navigator.share({
        title: this.event.name,
        text: `Découvrez les photos de l'événement "${this.event.name}"`,
        url: window.location.href
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Share
      this.copyEventCode();
    }
  }

  // Obtenir les informations de statut de l'événement
  getEventStatus(): { status: string, color: string, icon: string } {
    if (!this.event) return { status: '', color: '', icon: '' };

    const eventDate = new Date(this.event.date);
    const today = new Date();
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { 
        status: `Événement à venir (dans ${diffDays} jour${diffDays > 1 ? 's' : ''})`, 
        color: 'text-blue-600 bg-blue-50', 
        icon: '📅' 
      };
    } else if (diffDays === 0) {
      return { 
        status: 'Événement aujourd\'hui', 
        color: 'text-green-600 bg-green-50', 
        icon: '🎉' 
      };
    } else if (diffDays >= -7) {
      return { 
        status: 'Événement récent', 
        color: 'text-orange-600 bg-orange-50', 
        icon: '📸' 
      };
    } else {
      return { 
        status: 'Événement passé', 
        color: 'text-gray-600 bg-gray-50', 
        icon: '📷' 
      };
    }
  }

  // Retourner à la recherche
  goBackToSearch() {
    this.router.navigate(['/events-search']);
  }

  // Obtenir l'email de contact de l'organisateur
  getOrganizerEmail(): string {
    // En production, cela viendrait des données de l'événement
    return `contact.${this.event?.organizer?.toLowerCase().replace(/\s+/g, '.')}@example.com`;
  }

  // Obtenir le numéro de téléphone de l'organisateur
  getOrganizerPhone(): string {
    // En production, cela viendrait des données de l'événement
    return '+33 1 23 45 67 89';
  }

  /**
   * Get image URL for a photo with specific quality
   */
  getPhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return this.imageUrlService.getPhotoUrl(photoId, quality);
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    this.imageUrlService.onImageError(event);
  }
}
