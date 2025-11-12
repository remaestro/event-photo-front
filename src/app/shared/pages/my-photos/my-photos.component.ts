import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PhotoPurchaseService, PhotoPurchase } from '../../services/photo-purchase.service'; // 🆕
import { NotificationService } from '../../services/notification.service'; // 🆕
import { environment } from '../../../../environments/environment'; // 🆕

interface Photo {
  id: string;
  photoId: string; // 🆕 ID numérique pour l'API
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
  filename?: string; // 🆕
  photoNumber?: string; // 🆕
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
  userEmail: string | null = null; // 🆕
  photosByEvent: PhotosByEvent[] = [];
  totalPhotos = 0;
  totalEvents = 0;
  downloadingPhotos: Set<string> = new Set(); // 🆕

  // Filtres et tri
  selectedFilter = 'all'; // 'all', 'uploaded', 'purchased'
  selectedSort = 'date-desc'; // 'date-desc', 'date-asc', 'event-name'

  // Modal de visualisation
  showPhotoModal = false;
  selectedPhotoForView: Photo | null = null;

  constructor(
    private authService: AuthService,
    private photoPurchaseService: PhotoPurchaseService, // 🆕
    private notificationService: NotificationService, // 🆕
    public router: Router
  ) {}

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
    this.userEmail = currentUser?.email || null;
    
    // 🆕 Charger les photos achetées depuis les achats
    this.loadPurchasedPhotos();
  }

  // 🆕 Charger toutes les photos distinctes achetées par l'utilisateur
  private loadPurchasedPhotos() {
    if (!this.authService.isAuthenticated() || !this.userEmail) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    console.log('📸 Loading purchased photos for:', this.userEmail);

    // Charger les achats de l'utilisateur
    this.photoPurchaseService.getUserPurchases(this.userEmail).subscribe({
      next: (purchases: PhotoPurchase[]) => {
        console.log('✅ Purchases loaded:', purchases.length);
        
        if (purchases.length > 0) {
          // 🆕 Extraire toutes les photos uniques de tous les achats
          this.extractUniquePhotos(purchases);
        } else {
          // Pas d'achats trouvés
          this.photosByEvent = [];
          this.totalPhotos = 0;
          this.totalEvents = 0;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading purchases:', error);
        this.notificationService.error(
          'Erreur de chargement',
          'Impossible de charger vos photos achetées.'
        );
        this.isLoading = false;
      }
    });
  }

  // 🆕 Extraire toutes les photos uniques de tous les achats et les regrouper par événement
  private extractUniquePhotos(purchases: PhotoPurchase[]) {
    const photoMap = new Map<string, Photo>(); // Pour dédupliquer par photoId
    const eventMap = new Map<string, PhotosByEvent>(); // Pour regrouper par événement

    purchases.forEach(purchase => {
      purchase.photos.forEach(purchasedPhoto => {
        const photoId = this.extractPhotoId(purchasedPhoto);
        
        if (photoId && !photoMap.has(photoId)) {
          // Créer l'objet Photo
          const photo: Photo = {
            id: photoId,
            photoId: photoId,
            eventId: purchasedPhoto.eventId || purchase.eventId,
            eventName: purchasedPhoto.eventName || purchase.eventName,
            url: this.getPhotoOriginalUrl(photoId), // 🆕 URL ORIGINALE sans watermark
            thumbnailUrl: this.getPhotoThumbnailUrl(photoId),
            tags: [],
            description: purchasedPhoto.filename || `Photo ${photoId}`,
            price: purchasedPhoto.price,
            isPurchased: true,
            purchaseDate: new Date(purchase.purchaseDate).toISOString(),
            downloadUrl: this.getPhotoOriginalUrl(photoId),
            filename: purchasedPhoto.filename,
            photoNumber: purchasedPhoto.photoNumber
          };

          photoMap.set(photoId, photo);

          // Regrouper par événement
          const eventId = photo.eventId;
          if (!eventMap.has(eventId)) {
            eventMap.set(eventId, {
              eventId: eventId,
              eventName: photo.eventName,
              eventDate: purchase.purchaseDate.toString(),
              photos: []
            });
          }

          eventMap.get(eventId)!.photos.push(photo);
        }
      });
    });

    // Convertir les maps en tableaux
    this.photosByEvent = Array.from(eventMap.values());
    this.totalPhotos = photoMap.size;
    this.totalEvents = eventMap.size;

    // Appliquer le tri
    this.applySorting();

    console.log('📊 Unique photos extracted:', this.totalPhotos, 'from', this.totalEvents, 'events');
  }

  // 🆕 Extraire l'ID de la photo depuis différentes sources
  private extractPhotoId(photo: any): string | null {
    if (photo.photoId) return photo.photoId.toString();
    if (photo.id && !isNaN(Number(photo.id))) return photo.id.toString();
    
    // Extraire depuis l'URL si disponible
    if (photo.thumbnailUrl) {
      const idFromUrl = this.extractPhotoIdFromUrl(photo.thumbnailUrl);
      if (idFromUrl) return idFromUrl;
    }
    
    if (photo.photoUrl) {
      const idFromUrl = this.extractPhotoIdFromUrl(photo.photoUrl);
      if (idFromUrl) return idFromUrl;
    }
    
    return null;
  }

  // 🆕 Extraire l'ID depuis une URL Azure
  private extractPhotoIdFromUrl(url: string): string | null {
    if (!url) return null;
    
    try {
      const photoMatch = url.match(/\/photos\/(\d+)\//);
      if (photoMatch) return photoMatch[1];
      
      const eventMatch = url.match(/\/events\/(\d+)\//);
      if (eventMatch) return eventMatch[1];
      
      const filenameMatch = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif)$/i);
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const idMatch = filename.match(/(\d+)/);
        if (idMatch) return idMatch[1];
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // 🆕 Obtenir l'URL de la photo originale SANS WATERMARK via l'API backend
  private getPhotoOriginalUrl(photoId: string): string {
    return `${environment.apiUrl}/api/Photo/${photoId}/serve?quality=original`;
  }

  // 🆕 MODIFICATION : Utiliser la qualité originale pour l'affichage dans la grille (pas de thumbnail)
  private getPhotoThumbnailUrl(photoId: string): string {
    // 🎨 Retourner la photo ORIGINALE en haute qualité pour les photos achetées
    return `${environment.apiUrl}/api/Photo/${photoId}/serve?quality=original`;
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
    // Recharger avec les nouveaux filtres si nécessaire
    this.applySorting();
  }

  onSortChange() {
    this.applySorting();
  }

  // 🆕 Télécharger une photo originale sans watermark
  downloadPhoto(photo: Photo) {
    if (!photo.isPurchased || !photo.photoId) {
      this.notificationService.warning(
        'Téléchargement impossible',
        'Cette photo n\'est pas disponible au téléchargement.'
      );
      return;
    }

    this.downloadingPhotos.add(photo.id);

    try {
      // Créer un lien de téléchargement vers l'API backend
      const downloadUrl = `${environment.apiUrl}/api/Photo/${photo.photoId}/serve?quality=original`;
      const fileName = photo.filename || `photo-${photo.photoId}.jpg`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.notificationService.success(
        'Téléchargement réussi',
        'La photo a été téléchargée avec succès.'
      );
      
      console.log('✅ Photo download initiated:', fileName);
    } catch (error) {
      console.error('❌ Download failed:', error);
      this.notificationService.error(
        'Erreur de téléchargement',
        'Erreur lors du téléchargement. Veuillez réessayer.'
      );
    } finally {
      this.downloadingPhotos.delete(photo.id);
    }
  }

  // 🆕 Télécharger toutes les photos d'un événement
  downloadAllPhotosFromEvent(event: PhotosByEvent) {
    if (!event.photos || event.photos.length === 0) {
      this.notificationService.warning(
        'Aucune photo',
        'Cet événement ne contient aucune photo.'
      );
      return;
    }

    this.notificationService.info(
      'Téléchargement en cours',
      `Le téléchargement de ${event.photos.length} photos va commencer...`
    );

    // Télécharger toutes les photos avec un délai échelonné
    event.photos.forEach((photo, index) => {
      setTimeout(() => {
        this.downloadPhoto(photo);
      }, index * 300); // 300ms entre chaque téléchargement
    });
  }

  // 🆕 Méthodes pour les organisateurs (stub pour compatibilité avec le template)
  createEvent() {
    this.router.navigate(['/organizer/events/create']);
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
    return 'Mes Photos - Photos achetées';
  }

  get pageDescription(): string {
    return 'Accédez à toutes vos photos achetées en haute qualité';
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    console.warn('❌ Image failed to load:', event.target.src);
    event.target.style.display = 'none';
  }

  /**
   * Handle successful image load
   */
  onImageLoad = (event: any): void => {
    console.log('✅ Image loaded successfully:', event.target.src);
    event.target.style.display = 'block';
    event.target.style.opacity = '1';
  }

  /**
   * Ouvrir la modal pour voir la photo en grand
   */
  viewPhoto(photo: Photo) {
    this.selectedPhotoForView = photo;
    this.showPhotoModal = true;
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fermer la modal de visualisation
   */
  closePhotoModal() {
    this.showPhotoModal = false;
    this.selectedPhotoForView = null;
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

  // 🆕 Vérifier si une photo est en cours de téléchargement
  isDownloading(photoId: string): boolean {
    return this.downloadingPhotos.has(photoId);
  }
}