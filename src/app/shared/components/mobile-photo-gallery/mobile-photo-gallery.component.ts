import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ResponsiveService, ViewportSize } from '../../services/responsive.service';
import { AccessibilityService } from '../../services/accessibility.service';
import { ImageUrlService } from '../../services/image-url.service';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  price: number;
  isSelected?: boolean;
  confidenceScore?: number;
}

@Component({
  selector: 'app-mobile-photo-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Gallery Header -->
    <div class="mb-4" [attr.aria-label]="'Galerie de ' + photos.length + ' photos'">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ galleryTitle }}
        </h3>
        <div class="flex items-center space-x-2">
          <!-- View Toggle -->
          <button
            (click)="toggleViewMode()"
            [attr.aria-label]="'Changer vers ' + (viewMode === 'grid' ? 'liste' : 'grille')"
            class="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
            <svg *ngIf="viewMode === 'grid'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <svg *ngIf="viewMode === 'list'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
          
          <!-- Select All/None -->
          <button
            (click)="toggleSelectAll()"
            [attr.aria-label]="hasSelectedPhotos() ? 'Désélectionner toutes les photos' : 'Sélectionner toutes les photos'"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {{ hasSelectedPhotos() ? 'Désélectionner tout' : 'Tout sélectionner' }}
          </button>
        </div>
      </div>
      
      <!-- Selection Summary -->
      <div *ngIf="hasSelectedPhotos()" class="text-sm text-gray-600" role="status" [attr.aria-live]="'polite'">
        {{ getSelectedCount() }} photo(s) sélectionnée(s) - Total: {{ getSelectedTotal() }}€
      </div>
    </div>

    <!-- Loading State -->
    <div *ngIf="isLoading" class="text-center py-8" role="status" aria-label="Chargement des photos">
      <div class="loading-spinner mx-auto mb-4"></div>
      <p class="text-gray-600">Chargement des photos...</p>
    </div>

    <!-- Empty State -->
    <div *ngIf="!isLoading && photos.length === 0" class="text-center py-8">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucune photo trouvée</h3>
      <p class="text-gray-600">{{ emptyStateMessage }}</p>
    </div>

    <!-- Grid View -->
    <div 
      *ngIf="!isLoading && photos.length > 0 && viewMode === 'grid'"
      [class]="getGridClasses()"
      role="grid"
      [attr.aria-label]="'Grille de photos avec ' + photos.length + ' éléments'">
      
      <div 
        *ngFor="let photo of photos; let i = index; trackBy: trackByPhotoId"
        role="gridcell"
        class="relative group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        [class.ring-2]="photo.isSelected"
        [class.ring-blue-500]="photo.isSelected"
        (click)="togglePhotoSelection(photo)"
        (keydown.enter)="togglePhotoSelection(photo)"
        (keydown.space)="togglePhotoSelection(photo); $event.preventDefault()"
        tabindex="0"
        [attr.aria-label]="getPhotoAriaLabel(photo)"
        [attr.aria-selected]="photo.isSelected">
        
        <!-- Image -->
        <div class="aspect-square relative overflow-hidden">
          <img
            [src]="getOptimizedImageUrl(photo)"
            [alt]="photo.title"
            [attr.loading]="shouldLazyLoad() ? 'lazy' : 'eager'"
            (load)="onImageLoad(photo)"
            (error)="onImageError(photo)"
            class="w-full h-full object-cover transition-transform group-hover:scale-105">
          
          <!-- Loading placeholder -->
          <div 
            *ngIf="!(photo as any).isLoaded"
            class="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>

          <!-- Selection Checkbox -->
          <div class="absolute top-2 left-2">
            <div
              [class]="photo.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'"
              class="w-5 h-5 border-2 rounded flex items-center justify-center">
              <svg 
                *ngIf="photo.isSelected" 
                class="w-3 h-3 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>

          <!-- Confidence Score -->
          <div 
            *ngIf="photo.confidenceScore"
            class="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full"
            [attr.aria-label]="'Score de confiance: ' + (photo.confidenceScore * 100) + '%'">
            {{ (photo.confidenceScore * 100).toFixed(0) }}%
          </div>

          <!-- Price Badge -->
          <div class="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
            {{ photo.price }}€
          </div>
        </div>

        <!-- Photo Info (Mobile) -->
        <div *ngIf="viewport.isMobile" class="p-2">
          <h4 class="text-sm font-medium text-gray-900 truncate">{{ photo.title }}</h4>
          <p *ngIf="photo.description" class="text-xs text-gray-600 truncate">{{ photo.description }}</p>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div 
      *ngIf="!isLoading && photos.length > 0 && viewMode === 'list'"
      class="space-y-3"
      role="list"
      [attr.aria-label]="'Liste de photos avec ' + photos.length + ' éléments'">
      
      <div 
        *ngFor="let photo of photos; trackBy: trackByPhotoId"
        role="listitem"
        class="flex items-center space-x-4 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        [class.ring-2]="photo.isSelected"
        [class.ring-blue-500]="photo.isSelected"
        (click)="togglePhotoSelection(photo)"
        (keydown.enter)="togglePhotoSelection(photo)"
        (keydown.space)="togglePhotoSelection(photo); $event.preventDefault()"
        tabindex="0"
        [attr.aria-label]="getPhotoAriaLabel(photo)"
        [attr.aria-selected]="photo.isSelected">
        
        <!-- Thumbnail -->
        <div class="flex-shrink-0 w-16 h-16 relative">
          <img
            [src]="imageUrlService.getThumbnailUrl(photo.id)"
            [alt]="photo.title"
            (error)="imageUrlService.onImageError($event)"
            class="w-full h-full object-cover rounded-md">
          
          <!-- Selection Checkbox -->
          <div class="absolute -top-1 -left-1">
            <div
              [class]="photo.isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'"
              class="w-5 h-5 border-2 rounded flex items-center justify-center">
              <svg 
                *ngIf="photo.isSelected" 
                class="w-3 h-3 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Photo Details -->
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 truncate">{{ photo.title }}</h4>
          <p *ngIf="photo.description" class="text-sm text-gray-600 truncate">{{ photo.description }}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-lg font-semibold text-gray-900">{{ photo.price }}€</span>
            <span 
              *ngIf="photo.confidenceScore"
              class="text-xs text-green-600 font-medium"
              [attr.aria-label]="'Score de confiance: ' + (photo.confidenceScore * 100) + '%'">
              {{ (photo.confidenceScore * 100).toFixed(0) }}% confiance
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div *ngIf="hasMorePhotos && !isLoading" class="text-center mt-6">
      <button
        (click)="loadMore()"
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        [attr.aria-label]="'Charger ' + photosPerPage + ' photos supplémentaires'">
        Charger plus de photos
      </button>
    </div>
  `,
  styleUrls: ['./mobile-photo-gallery.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobilePhotoGalleryComponent implements OnInit, OnDestroy {
  @Input() photos: Photo[] = [];
  @Input() galleryTitle = 'Photos';
  @Input() emptyStateMessage = 'Aucune photo à afficher pour le moment.';
  @Input() isLoading = false;
  @Input() hasMorePhotos = false;
  @Input() photosPerPage = 20;

  viewMode: 'grid' | 'list' = 'grid';
  viewport: ViewportSize = {
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    orientation: 'landscape'
  };

  private destroy$ = new Subject<void>();

  constructor(
    private responsiveService: ResponsiveService,
    private accessibilityService: AccessibilityService,
    public imageUrlService: ImageUrlService
  ) {}

  ngOnInit() {
    // Subscribe to viewport changes
    this.responsiveService.viewport$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewport => {
        this.viewport = viewport;
        
        // Auto-switch to list view on very small screens
        if (viewport.width < 480) {
          this.viewMode = 'list';
        }
      });

    // Initialize photos with loading state
    this.photos.forEach(photo => {
      (photo as any).isLoaded = false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // View Management
  toggleViewMode() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
    this.accessibilityService.announce(
      `Vue changée en ${this.viewMode === 'grid' ? 'grille' : 'liste'}`
    );
  }

  getGridClasses(): string {
    const columns = this.responsiveService.getOptimalGridColumns();
    const baseClasses = 'grid gap-4';
    
    switch (columns) {
      case 2: return `${baseClasses} grid-cols-2`;
      case 3: return `${baseClasses} grid-cols-3`;
      case 4: return `${baseClasses} grid-cols-2 md:grid-cols-4`;
      default: return `${baseClasses} grid-cols-2 md:grid-cols-3 lg:grid-cols-4`;
    }
  }

  getGridColumns(): number {
    return this.responsiveService.getOptimalGridColumns();
  }

  // Selection Management
  togglePhotoSelection(photo: Photo) {
    photo.isSelected = !photo.isSelected;
    
    this.accessibilityService.announce(
      photo.isSelected 
        ? `Photo ${photo.title} sélectionnée` 
        : `Photo ${photo.title} désélectionnée`
    );
  }

  toggleSelectAll() {
    const hasSelected = this.hasSelectedPhotos();
    
    this.photos.forEach(photo => {
      photo.isSelected = !hasSelected;
    });

    this.accessibilityService.announce(
      hasSelected 
        ? 'Toutes les photos désélectionnées' 
        : 'Toutes les photos sélectionnées'
    );
  }

  hasSelectedPhotos(): boolean {
    return this.photos.some(photo => photo.isSelected);
  }

  getSelectedCount(): number {
    return this.photos.filter(photo => photo.isSelected).length;
  }

  getSelectedTotal(): number {
    return this.photos
      .filter(photo => photo.isSelected)
      .reduce((total, photo) => total + photo.price, 0);
  }

  // Image Management
  getOptimizedImageUrl(photo: Photo): string {
    // Use backend URL for thumbnails in grid view, watermarked for larger display
    const quality = this.viewMode === 'grid' ? 'thumbnail' : 'watermarked';
    return this.imageUrlService.getPhotoUrl(photo.id, quality);
  }

  onImageLoad(photo: Photo) {
    (photo as any).isLoaded = true;
  }

  onImageError(photo: Photo) {
    console.warn(`Failed to load image: ${photo.title}`);
    // The ImageUrlService will handle the error and show placeholder
  }

  // Accessibility
  getPhotoAriaLabel(photo: Photo): string {
    let label = `Photo ${photo.title}, prix ${photo.price} euros`;
    
    if (photo.confidenceScore) {
      label += `, confiance ${(photo.confidenceScore * 100).toFixed(0)} pourcent`;
    }
    
    label += photo.isSelected ? ', sélectionnée' : ', non sélectionnée';
    label += '. Appuyez sur Entrée ou Espace pour sélectionner.';
    
    return label;
  }

  // Performance
  trackByPhotoId(index: number, photo: Photo): string {
    return photo.id;
  }

  loadMore() {
    // Emit event to parent component
    // In a real implementation, you'd emit an event here
    console.log('Load more photos requested');
  }
}