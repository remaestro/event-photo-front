import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PhotoApiService, EventPhotoGroup, ApiPhoto } from '../../services/photo-api.service';
import { ImageUrlService } from '../../services/image-url.service';

interface Photo {
  id: string;
  eventId: string;
  eventName: string;
  url: string;
  thumbnailUrl: string;
  tags: string[];
  description: string;
  price: number;
  isPurchased: boolean;
  purchaseDate?: string;
  downloadUrl?: string;
}

interface PhotosByEvent {
  eventId: string;
  eventName: string;
  eventDate: string;
  photos: Photo[];
}

@Component({
  selector: 'app-my-photos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-photos.component.html',
  styleUrls: ['./my-photos.component.css']
})
export class MyPhotosComponent implements OnInit {
  isLoading = true;
  userRole: string | null = null;
  photosByEvent: PhotosByEvent[] = [];
  totalPhotos = 0;
  totalEvents = 0;

  // Filtres et tri
  selectedFilter = 'all'; // 'all', 'uploaded', 'purchased'
  selectedSort = 'date-desc'; // 'date-desc', 'date-asc', 'event-name'

  // Modal de visualisation
  showPhotoModal = false;
  selectedPhotoForView: Photo | null = null;

  constructor(
    private authService: AuthService,
    private photoApiService: PhotoApiService,
    private imageUrlService: ImageUrlService,
    public router: Router
  ) {}

  ngOnInit() {
    // 🎯 LOG: Initialisation du composant
    console.log('🚀 [MY_PHOTOS_INIT] Initialisation du composant My Photos');
    
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
    
    // 🎯 LOG: Utilisateur connecté
    console.log('👤 [USER_INFO] Utilisateur connecté:', {
      userId: currentUser?.id,
      email: currentUser?.email,
      role: this.userRole,
      isAuthenticated: this.authService.isAuthenticated()
    });
    
    this.loadMyPhotos();
  }

  private loadMyPhotos() {
    // 🎯 LOG: Début du chargement
    console.log('📁 [LOAD_START] Début du chargement des photos');
    
    if (!this.authService.isAuthenticated()) {
      console.warn('⚠️ [AUTH_ERROR] Utilisateur non authentifié, redirection vers login');
      this.router.navigate(['/login']);
      return;
    }

    // 🎯 LOG: Paramètres de la requête API
    const sortBy = this.getSortBy();
    const sortOrder = this.getSortOrder();
    console.log('🔧 [API_PARAMS] Paramètres de requête:', {
      page: 1,
      limit: 50,
      sortBy,
      sortOrder,
      selectedFilter: this.selectedFilter,
      selectedSort: this.selectedSort
    });

    // Utiliser l'API pour récupérer les vraies photos
    console.log('🌐 [API_CALL] Appel à photoApiService.getMyPhotos...');
    
    this.photoApiService.getMyPhotos(1, 50, undefined, sortBy, sortOrder)
      .subscribe({
        next: (response) => {
          // 🎯 LOG: Réponse API reçue avec détails
          console.log('✅ [API_SUCCESS] Réponse API reçue:', {
            totalEvents: response.totalEvents,
            totalPhotos: response.totalPhotos,
            eventsCount: response.events?.length || 0,
            hasEvents: response.events && response.events.length > 0
          });
          
          console.log('📊 [API_RESPONSE_DETAIL] Détail de la réponse:', response);
          
          if (response.events && response.events.length > 0) {
            // 🎯 LOG: Traitement des vraies photos
            console.log('🔄 [MAPPING] Début du mapping des données API vers format local');
            
            this.photosByEvent = this.mapApiResponseToLocal(response.events);
            this.totalPhotos = response.totalPhotos;
            this.totalEvents = response.totalEvents;
            
            // 🎯 LOG: Résultats du mapping
            console.log('✅ [MAPPING_SUCCESS] Photos réelles chargées:', {
              eventCount: this.photosByEvent.length,
              totalPhotos: this.totalPhotos,
              totalEvents: this.totalEvents,
              firstEventPhotos: this.photosByEvent[0]?.photos?.length || 0
            });
            
            console.log('📋 [PHOTOS_DETAIL] Détail des photos chargées:', this.photosByEvent);
          } else {
            // 🎯 LOG: Aucune photo trouvée
            console.log('📭 [NO_PHOTOS] Aucune photo trouvée dans la réponse API, utilisation des données mockées');
            this.loadMockData();
          }
          
          this.isLoading = false;
          console.log('🏁 [LOAD_COMPLETE] Chargement terminé avec succès');
        },
        error: (error) => {
          // 🎯 LOG: Erreur API détaillée
          console.error('💥 [API_ERROR] Erreur lors du chargement des photos:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error
          });
          
          console.error('🔍 [ERROR_DETAIL] Détail complet de l\'erreur:', error);
          
          // En cas d'erreur, revenir aux données mockées pour le développement
          console.log('🔄 [FALLBACK] Fallback vers les données mockées');
          this.loadMockData();
          this.isLoading = false;
          
          console.log('🏁 [LOAD_COMPLETE_ERROR] Chargement terminé avec erreur (fallback appliqué)');
        }
      });
  }

  private loadMockData() {
    // Données mockées de fallback en cas d'erreur API
    console.log('Chargement des données mockées (fallback)');
    
    if (this.userRole === 'Organizer') {
      // Simuler les photos d'organisateur basées sur les événements réels
      this.photosByEvent = [
        {
          eventId: '1',
          eventName: 'Mon Premier Événement',
          eventDate: '2024-07-15',
          photos: this.generateMockPhotos('1', 'Mon Premier Événement', false)
        }
      ];
    } else {
      // Simuler les photos achetées
      this.photosByEvent = [
        {
          eventId: '1',
          eventName: 'Mariage de Sophie',
          eventDate: '2024-06-15',
          photos: this.generateMockPhotos('1', 'Mariage de Sophie', true)
        },
        {
          eventId: '2',
          eventName: 'Festival de musique',
          eventDate: '2024-06-08',
          photos: this.generateMockPhotos('2', 'Festival de musique', true)
        }
      ];
    }

    this.calculateTotals();
    this.applySorting();
  }

  private mapApiResponseToLocal(events: EventPhotoGroup[]): PhotosByEvent[] {
    return events.map(event => ({
      eventId: event.eventId,
      eventName: event.eventName,
      eventDate: event.eventDate,
      photos: event.photos.map(photo => this.mapApiPhotoToLocal(photo, event.eventName))
    }));
  }

  private mapApiPhotoToLocal(apiPhoto: ApiPhoto, eventName: string): Photo {
    return {
      id: apiPhoto.id,
      eventId: apiPhoto.id, // Utilisé comme fallback
      eventName: eventName,
      url: this.imageUrlService.getOriginalUrl(apiPhoto.id), // HAUTE QUALITÉ SANS WATERMARK
      thumbnailUrl: this.imageUrlService.getThumbnailUrl(apiPhoto.id), // Miniature pour la grille
      tags: apiPhoto.tags,
      description: `${apiPhoto.filename}`,
      price: apiPhoto.pricing.digital,
      isPurchased: this.userRole !== 'Organizer', // Pour les organisateurs, ce sont leurs photos uploadées
      purchaseDate: this.userRole !== 'Organizer' ? '2024-06-20' : undefined,
      downloadUrl: this.userRole !== 'Organizer' ? this.imageUrlService.getOriginalUrl(apiPhoto.id) : undefined
    };
  }

  private getSortBy(): string {
    switch (this.selectedSort) {
      case 'date-desc':
      case 'date-asc':
        return 'date';
      case 'event-name':
        return 'name';
      default:
        return 'date';
    }
  }

  private getSortOrder(): string {
    return this.selectedSort.includes('desc') ? 'desc' : 'asc';
  }

  // Conserver les méthodes existantes pour la compatibilité
  private generateMockPhotos(eventId: string, eventName: string, isPurchased: boolean): Photo[] {
    const photoCount = Math.floor(Math.random() * 10) + 5;
    const photos: Photo[] = [];

    for (let i = 1; i <= photoCount; i++) {
      photos.push({
        id: `${eventId}-${i}`,
        eventId,
        eventName,
        url: `https://picsum.photos/800/600?random=${eventId}-${i}`,
        thumbnailUrl: `https://picsum.photos/300/200?random=${eventId}-${i}`,
        tags: this.getRandomTags(),
        description: `Photo ${i} de ${eventName}`,
        price: 5.0,
        isPurchased,
        purchaseDate: isPurchased ? '2024-06-20' : undefined,
        downloadUrl: isPurchased ? `https://example.com/download/${eventId}-${i}` : undefined
      });
    }

    return photos;
  }

  private getRandomTags(): string[] {
    const allTags = ['portrait', 'groupe', 'famille', 'danse', 'sourire', 'extérieur', 'intérieur'];
    const count = Math.floor(Math.random() * 3) + 1;
    return allTags.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private calculateTotals() {
    this.totalEvents = this.photosByEvent.length;
    this.totalPhotos = this.photosByEvent.reduce((sum, event) => sum + event.photos.length, 0);
  }

  private applySorting() {
    switch (this.selectedSort) {
      case 'date-desc':
        this.photosByEvent.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      case 'date-asc':
        this.photosByEvent.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case 'event-name':
        this.photosByEvent.sort((a, b) => a.eventName.localeCompare(b.eventName));
        break;
    }
  }

  onFilterChange() {
    this.loadMyPhotos(); // Recharger avec les nouveaux filtres
  }

  onSortChange() {
    this.loadMyPhotos(); // Recharger avec le nouveau tri
  }

  downloadPhoto(photo: Photo) {
    if (photo.isPurchased && photo.downloadUrl) {
      if (photo.downloadUrl.startsWith('/api/')) {
        // Vraie photo : utiliser le service API
        this.photoApiService.downloadPhoto(photo.id).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = photo.description || `photo-${photo.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          },
          error: (error) => {
            console.error('Erreur lors du téléchargement:', error);
            alert('Erreur lors du téléchargement de la photo');
          }
        });
      } else {
        // Photo mockée : ouvrir dans un nouvel onglet
        window.open(photo.downloadUrl, '_blank');
      }
    }
  }

  manageEvent(eventId: string) {
    if (this.userRole === 'Organizer') {
      this.router.navigate(['/organizer/events', eventId, 'manage']);
    }
  }

  uploadPhotos(eventId: string) {
    if (this.userRole === 'Organizer') {
      this.router.navigate(['/organizer/events', eventId, 'upload']);
    }
  }

  createEvent() {
    this.router.navigate(['/organizer/events/create']);
  }

  exploreEvents() {
    this.router.navigate(['/event-access']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  get pageTitle(): string {
    if (this.userRole === 'Organizer') {
      return 'Mes Photos - Événements créés';
    } else {
      return 'Mes Photos - Photos achetées';
    }
  }

  get pageDescription(): string {
    if (this.userRole === 'Organizer') {
      return 'Gérez toutes les photos de vos événements';
    } else {
      return 'Accédez à toutes vos photos achetées';
    }
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    this.imageUrlService.onImageError(event);
  }

  /**
   * Handle successful image load
   */
  onImageLoad = (event: any): void => {
    console.log('Image chargée avec succès:', event.target.src);
    // S'assurer que l'image est visible
    event.target.style.display = 'block';
    event.target.style.opacity = '1';
  }

  /**
   * Ouvrir la modal pour voir la photo en grand
   */
  viewPhoto(photo: Photo) {
    this.selectedPhotoForView = photo;
    this.showPhotoModal = true;
    // Empêcher le scroll de la page quand la modal est ouverte
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fermer la modal de visualisation
   */
  closePhotoModal() {
    this.showPhotoModal = false;
    this.selectedPhotoForView = null;
    // Réactiver le scroll de la page
    document.body.style.overflow = 'auto';
  }

  /**
   * Fermer la modal si on clique à l'extérieur de l'image
   */
  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closePhotoModal();
    }
  }

  /**
   * Gérer les touches du clavier (Escape pour fermer)
   */
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.showPhotoModal) {
      this.closePhotoModal();
    }
  }
}