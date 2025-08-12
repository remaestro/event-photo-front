import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil, switchMap, map, catchError, of, forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface Photo {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  thumbnailUrl?: string;
  watermarkUrl?: string;
  tags: string[];
  metadata: {
    width: number;
    height: number;
    camera?: string;
    location?: string;
  };
}

interface EventData {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'draft' | 'active' | 'completed';
  photosCount: number;
}

interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  totalSize: number;
}

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photos.component.html',
  styleUrl: './photos.component.css'
})
export class PhotosComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  event: EventData | null = null;
  eventId: string | null = null;
  photos: Photo[] = [];
  isLoading = true;
  isDragOver = false;
  
  uploadStats: UploadStats = {
    total: 0,
    completed: 0,
    failed: 0,
    totalSize: 0
  };

  selectedPhotos: Set<string> = new Set();
  bulkTags: string = '';
  showBulkActions = false;
  
  // Modal pour afficher la photo
  selectedPhotoForView: Photo | null = null;
  showPhotoModal = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    public imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    // Récupérer l'eventId depuis les query parameters et charger les données
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.eventId = params['eventId'];
        if (this.eventId) {
          return this.loadEventAndPhotos();
        } else {
          console.error('No eventId provided in query parameters');
          this.router.navigate(['/organizer/events']);
          return of(null);
        }
      })
    ).subscribe({
      error: (error) => {
        console.error('Error in ngOnInit:', error);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEventAndPhotos() {
    if (!this.eventId) return of(null);

    this.isLoading = true;
    const headers = this.getAuthHeaders();

    // Utiliser forkJoin pour charger l'événement et les photos en parallèle
    return forkJoin({
      event: this.loadEvent(headers),
      photos: this.loadPhotos(headers)
    }).pipe(
      map(({ event, photos }) => {
        this.event = event;
        this.photos = photos;
        this.updateUploadStats();
        this.isLoading = false;
        return { event, photos };
      }),
      catchError(error => {
        console.error('Error loading event and photos:', error);
        this.isLoading = false;
        alert('Erreur lors du chargement de l\'événement');
        this.router.navigate(['/organizer/events']);
        return of(null);
      })
    );
  }

  private loadEvent(headers: HttpHeaders) {
    return this.http.get<any>(`${environment.apiUrl}/api/events/${this.eventId}`, { headers }).pipe(
      map(eventData => ({
        id: eventData.id,
        name: eventData.name || eventData.title,
        date: eventData.date,
        location: eventData.location,
        status: this.mapApiStatusToLocal(eventData.status),
        photosCount: eventData.stats?.totalPhotos || 0
      })),
      catchError(error => {
        console.error('Error loading event:', error);
        throw error;
      })
    );
  }

  private loadPhotos(headers: HttpHeaders) {
    return this.http.get<any>(`${environment.apiUrl}/api/photo?eventId=${this.eventId}&page=1&limit=100`, { headers }).pipe(
      map(response => response.photos.map((photo: any) => ({
        id: photo.id,
        filename: photo.filename,
        originalName: photo.filename,
        size: photo.fileSize || 0,
        uploadDate: photo.uploadDate,
        status: this.mapPhotoStatus(photo.status),
        progress: 100,
        thumbnailUrl: this.imageUrlService.getThumbnailUrl(photo.id),    // Use ImageUrlService
        watermarkUrl: this.imageUrlService.getWatermarkedUrl(photo.id),  // Use ImageUrlService
        tags: photo.tags || [],
        metadata: {
          width: photo.dimensions?.width || 0,
          height: photo.dimensions?.height || 0,
          camera: photo.metadata?.camera,
          location: photo.metadata?.location
        }
      }))),
      catchError(error => {
        console.error('Error loading photos:', error);
        // Return empty array instead of throwing to allow partial success
        return of([]);
      })
    );
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

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private mapApiStatusToLocal(apiStatus: string): 'draft' | 'active' | 'completed' {
    switch (apiStatus?.toLowerCase()) {
      case 'inactive':
        return 'draft';
      case 'completed':
        return 'completed';
      case 'active':
      default:
        return 'active';
    }
  }

  private mapPhotoStatus(photoStatus: string): 'uploading' | 'processing' | 'completed' | 'failed' {
    switch (photoStatus?.toLowerCase()) {
      case 'approved':
        return 'completed'; // Photos approuvées sont terminées
      case 'failed':
      case 'rejected':
        return 'failed';
      case 'processing':
        return 'processing';
      default:
        return 'completed'; // Par défaut, considérer comme terminé
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    // Fonctionnalité d'upload supprimée
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    // Fonctionnalité d'upload supprimée
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    // Fonctionnalité d'upload supprimée - redirection supprimée
  }

  onFileSelect(event: Event) {
    // Fonctionnalité d'upload supprimée - redirection supprimée
  }

  private updateUploadStats() {
    this.uploadStats = {
      total: this.photos.length,
      completed: this.photos.filter(p => p.status === 'completed').length,
      failed: this.photos.filter(p => p.status === 'failed').length,
      totalSize: this.photos.reduce((sum, p) => sum + p.size, 0)
    };
  }

  togglePhotoSelection(photoId: string) {
    if (this.selectedPhotos.has(photoId)) {
      this.selectedPhotos.delete(photoId);
    } else {
      this.selectedPhotos.add(photoId);
    }
    this.showBulkActions = this.selectedPhotos.size > 0;
  }

  selectAllPhotos() {
    this.photos.forEach(photo => {
      if (photo.status === 'completed') {
        this.selectedPhotos.add(photo.id);
      }
    });
    this.showBulkActions = this.selectedPhotos.size > 0;
  }

  deselectAllPhotos() {
    this.selectedPhotos.clear();
    this.showBulkActions = false;
  }

  deleteSelected() {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedPhotos.size} photo(s) ?`)) {
      const headers = this.getAuthHeaders();
      const selectedIds = Array.from(this.selectedPhotos);
      
      // Utiliser forkJoin pour exécuter toutes les suppressions en parallèle
      const deleteRequests = selectedIds.map(photoId => 
        this.http.delete(`${environment.apiUrl}/api/photo/${photoId}`, { headers }).pipe(
          map(() => ({ photoId, success: true })),
          catchError(error => {
            console.error(`Error deleting photo ${photoId}:`, error);
            return of({ photoId, success: false, error });
          })
        )
      );

      forkJoin(deleteRequests).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (results) => {
          const successfulDeletes = results.filter(result => result.success);
          const failedDeletes = results.filter(result => !result.success);

          // Supprimer les photos réussies de l'interface
          successfulDeletes.forEach(result => {
            this.photos = this.photos.filter(p => p.id !== result.photoId);
            this.selectedPhotos.delete(result.photoId);
          });

          // Nettoyer les sélections et mettre à jour les stats
          this.showBulkActions = false;
          this.updateUploadStats();

          // Afficher le résultat
          if (failedDeletes.length > 0) {
            alert(`${successfulDeletes.length} photo(s) supprimée(s) avec succès, ${failedDeletes.length} échec(s)`);
          }
        },
        error: (error) => {
          console.error('Error in bulk delete:', error);
          alert('Erreur lors de la suppression groupée des photos');
        }
      });
    }
  }

  deletePhoto(photoId: string) {
    const photo = this.photos.find(p => p.id === photoId);
    if (photo && confirm(`Êtes-vous sûr de vouloir supprimer "${photo.originalName}" ?`)) {
      const headers = this.getAuthHeaders();

      this.http.delete(`${environment.apiUrl}/api/photo/${photoId}`, { headers })
        .pipe(
          takeUntil(this.destroy$),
          catchError(error => {
            console.error('Error deleting photo:', error);
            alert(`Erreur lors de la suppression de la photo: ${error.error?.message || error.message || 'Erreur inconnue'}`);
            return of(null);
          })
        )
        .subscribe({
          next: (response) => {
            if (response !== null) {
              // Supprimer de l'interface seulement après succès de l'API
              this.photos = this.photos.filter(p => p.id !== photoId);
              this.selectedPhotos.delete(photoId);
              this.updateUploadStats();
            }
          }
        });
    }
  }

  applyBulkTags() {
    if (this.bulkTags.trim()) {
      const tags = this.bulkTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      this.photos.forEach(photo => {
        if (this.selectedPhotos.has(photo.id)) {
          photo.tags = [...new Set([...photo.tags, ...tags])];
        }
      });
      
      this.bulkTags = '';
      this.deselectAllPhotos();
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'uploading':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'processing':
        return 'Traitement';
      case 'uploading':
        return 'Upload';
      case 'failed':
        return 'Échec';
      default:
        return 'Inconnu';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/organizer/events']);
  }

  navigateToUpload() {
    if (this.eventId) {
      this.router.navigate(['/organizer/events', this.eventId, 'upload']);
    }
  }

  /**
   * Ouvrir la modal pour voir la photo avec watermark
   */
  viewPhoto(photo: Photo) {
    this.selectedPhotoForView = photo;
    this.showPhotoModal = true;
  }

  /**
   * Fermer la modal de visualisation
   */
  closePhotoModal() {
    this.showPhotoModal = false;
    this.selectedPhotoForView = null;
  }
}
