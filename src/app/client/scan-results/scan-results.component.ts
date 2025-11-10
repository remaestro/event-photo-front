import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../shared/services/cart.service';
import { ImageUrlService } from '../../shared/services/image-url.service';
import { environment } from '../../../environments/environment';

interface Photo {
  id: string;
  imageUrl: string;
  thumbnail: string;
  timestamp: string;
  size: string;
  price: number;
  confidence: number;
  selected: boolean;
  eventId: string;
  metadata?: {
    location?: string;
    photographer?: string;
    tags?: string[];
  };
}

export interface CartItem {
  photoId: string;
  eventId: string;
  price: number;
  imageUrl: string;
  thumbnail: string;
}

@Component({
  selector: 'app-scan-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scan-results.component.html',
  styleUrl: './scan-results.component.css'
})
export class ScanResultsComponent implements OnInit {
  sessionId: string | null = null;
  eventId: string | null = null;
  eventCode: string | null = null;
  foundPhotos: Photo[] = [];
  allSelected = false;
  sortBy: 'confidence' | 'date' | 'price' = 'confidence';
  isLoading = false;
  previewPhoto: Photo | null = null;
  showPreviewModal = false;
  eventData: any = null;
  eventCurrency: string = 'EUR';
  eventPhotoPrice: number = 5.99;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private cartService: CartService,
    public imageUrlService: ImageUrlService,
    private http: HttpClient
  ) {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId');
    this.eventId = this.route.snapshot.queryParams['eventId'];
    this.eventCode = this.route.snapshot.queryParams['eventCode'] || this.route.snapshot.paramMap.get('eventCode');
  }

  ngOnInit() {
    // Si on a un code d'événement, charger les photos
    if (this.eventCode) {
      this.loadEventPhotos();
    } else if (this.eventId) {
      this.loadEventPhotosById();
    } else {
      // Fallback vers les données mockées si aucun code/ID n'est fourni
      this.loadScanResults();
    }
  }

  private async loadScanResults() {
    this.isLoading = true;
    try {
      // Simulate API call to get scan results
      await this.delay(1500);
      this.generateMockPhotos();
      this.sortPhotos();
    } catch (error) {
      console.error('Error loading scan results:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockPhotos() {
    // Enhanced mock photos with more realistic data
    const photographers = ['Alice Martin', 'Bob Durant', 'Claire Dubois', 'David Lopez'];
    const locations = ['Salle principale', 'Terrasse', 'Bar', 'Piste de danse', 'Jardin'];
    
    for (let i = 1; i <= 15; i++) {
      const confidence = Math.max(70, 95 - Math.floor(Math.random() * 25)); // 70-95%
      const hour = 14 + Math.floor(i / 4);
      const minute = (i * 13) % 60;
      const photoId = `photo_${i}`;
      
      this.foundPhotos.push({
        id: photoId,
        imageUrl: this.getPhotoUrl(photoId, 'watermarked'), // 🆕 Use backend API endpoint
        thumbnail: this.getPhotoUrl(photoId, 'thumbnail'),   // 🆕 Use backend API endpoint
        timestamp: `15 Juin 2024, ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        size: '4032x3024',
        price: confidence > 85 ? 8.99 : 5.99, // Higher confidence = higher price
        confidence,
        selected: false,
        eventId: this.eventId || 'event_123',
        metadata: {
          location: locations[Math.floor(Math.random() * locations.length)],
          photographer: photographers[Math.floor(Math.random() * photographers.length)],
          tags: ['portrait', 'groupe', 'candide'].slice(0, Math.floor(Math.random() * 2) + 1)
        }
      });
    }
  }

  /**
   * Get backend API URL for a photo with specific quality
   */
  getPhotoUrl(photoId: string, quality: 'thumbnail' | 'watermarked' | 'original' = 'watermarked'): string {
    return `${environment.apiUrl}/api/Photo/${photoId}/serve?quality=${quality}`;
  }

  /**
   * Handle image load errors
   */
  onImageError = (event: any): void => {
    console.log('❌ Image failed to load, using placeholder');
    // Set a placeholder image or hide the image
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
  }

  get selectedCount(): number {
    return this.foundPhotos.filter(p => p.selected).length;
  }

  get sortedPhotos(): Photo[] {
    return [...this.foundPhotos].sort((a, b) => {
      switch (this.sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'price':
          return a.price - b.price;
        default:
          return 0;
      }
    });
  }

  get highConfidencePhotos(): Photo[] {
    return this.foundPhotos.filter(p => p.confidence >= 85);
  }

  get mediumConfidencePhotos(): Photo[] {
    return this.foundPhotos.filter(p => p.confidence >= 70 && p.confidence < 85);
  }

  getTotalPrice(): number {
    return this.foundPhotos
      .filter(p => p.selected)
      .reduce((sum, p) => sum + p.price, 0);
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return 'bg-green-500';
    if (confidence >= 80) return 'bg-yellow-500';
    return 'bg-orange-500';
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 90) return 'Excellente correspondance';
    if (confidence >= 80) return 'Bonne correspondance';
    return 'Correspondance possible';
  }

  sortPhotos() {
    // Photos are sorted via the getter
  }

  setSortBy(sort: 'confidence' | 'date' | 'price') {
    this.sortBy = sort;
  }

  goBack() {
    this.location.back();
  }

  selectAll() {
    this.allSelected = !this.allSelected;
    this.foundPhotos.forEach(photo => photo.selected = this.allSelected);
  }

  selectHighConfidence() {
    this.highConfidencePhotos.forEach(photo => photo.selected = true);
    this.allSelected = this.foundPhotos.every(p => p.selected);
  }

  toggleSelection(photo: Photo) {
    photo.selected = !photo.selected;
    this.allSelected = this.foundPhotos.every(p => p.selected);
  }

  clearSelection() {
    this.foundPhotos.forEach(photo => photo.selected = false);
    this.allSelected = false;
  }

  openPreview(photo: Photo) {
    this.previewPhoto = photo;
    this.showPreviewModal = true;
  }

  closePreview() {
    this.showPreviewModal = false;
    this.previewPhoto = null;
  }

  async addToCart() {
    const selectedPhotos = this.foundPhotos.filter(p => p.selected);
    if (selectedPhotos.length === 0) {
      alert('Veuillez sélectionner au moins une photo');
      return;
    }

    console.log('🛒 Starting to add', selectedPhotos.length, 'photos to cart');
    this.isLoading = true;
    
    try {
      // 🆕 CORRECTION : Préparer les items avec plus d'informations de debug
      const cartItems = selectedPhotos.map((photo, index) => {
        console.log(`📸 Preparing photo ${index + 1}/${selectedPhotos.length}:`, {
          photoId: photo.id,
          eventId: photo.eventId,
          filename: photo.metadata?.photographer || `Photo ${photo.id}`
        });
        
        return {
          photoId: photo.id,
          eventId: photo.eventId,
          format: 'digital' as const
        };
      });

      console.log('📦 Cart items prepared:', cartItems);

      // 🆕 CORRECTION : Attendre la fin complète de l'ajout avant de naviguer
      this.cartService.addMultipleToCart(cartItems).subscribe({
        next: (success) => {
          console.log('🛒 Cart service response:', success);
          
          if (success) {
            console.log('✅ All photos added successfully, navigating to cart...');
            
            // 🆕 CORRECTION : Navigation immédiate sans délai artificiel
            this.router.navigate(['/cart']).then(navSuccess => {
              if (navSuccess) {
                console.log('✅ Navigation to cart successful');
                // Optionnel : déselectionner les photos après succès
                this.clearSelection();
              } else {
                console.error('❌ Navigation to cart failed');
              }
            }).catch(navError => {
              console.error('❌ Navigation error:', navError);
            });
          } else {
            console.error('❌ Failed to add some or all photos to cart');
            alert('Erreur lors de l\'ajout au panier. Veuillez réessayer.');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error during cart operation:', error);
          alert('Erreur lors de l\'ajout au panier. Veuillez réessayer.');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('❌ Unexpected error in addToCart:', error);
      alert('Erreur inattendue. Veuillez réessayer.');
      this.isLoading = false;
    }
  }

  async buyNow() {
    const selectedPhotos = this.foundPhotos.filter(p => p.selected);
    if (selectedPhotos.length === 0) return;

    // Ajouter au panier puis rediriger vers checkout
    await this.addToCart();
    this.router.navigate(['/checkout']);
  }

  viewCart() {
    this.router.navigate(['/cart']);
  }

  proceedToCheckout() {
    this.addToCart();
  }

  trackByPhotoId(index: number, photo: Photo): string {
    return photo.id;
  }

  private async loadEventPhotos() {
    this.isLoading = true;
    try {
      // D'abord récupérer les infos de l'événement par son code
      const eventResponse = await this.http.get<any>(`${environment.apiUrl}/api/events/public/${this.eventCode}`).toPromise();
      this.eventData = eventResponse;
      this.eventId = eventResponse.id;
      
      // Récupérer les informations de devise et prix de l'événement
      this.eventCurrency = eventResponse.currency || 'XOF';
      this.eventPhotoPrice = eventResponse.photoPrice || 5000;

      // Puis charger les photos de l'événement
      const photosResponse = await this.http.get<any>(`${environment.apiUrl}/api/photo?eventId=${this.eventId}&page=1&limit=100`).toPromise();
      
      this.foundPhotos = photosResponse.photos.map((photo: any) => ({
        id: photo.id,
        imageUrl: this.getPhotoUrl(photo.id, 'watermarked'), // 🆕 Use backend API endpoint
        thumbnail: this.getPhotoUrl(photo.id, 'thumbnail'),   // 🆕 Use backend API endpoint
        timestamp: this.formatDate(photo.uploadDate),
        size: `${photo.dimensions?.width || 0}x${photo.dimensions?.height || 0}`,
        price: this.calculatePhotoPrice(photo),
        confidence: 95, // Pas de scan facial, donc on met une confiance élevée
        selected: false,
        eventId: this.eventId,
        metadata: {
          location: photo.metadata?.location || 'Non spécifié',
          photographer: this.eventData.organizerName,
          tags: photo.tags || []
        }
      }));

      this.sortPhotos();
    } catch (error) {
      console.error('Error loading event photos:', error);
      // En cas d'erreur, fallback vers les données mockées
      await this.loadScanResults();
    } finally {
      this.isLoading = false;
    }
  }

  private async loadEventPhotosById() {
    this.isLoading = true;
    try {
      // Charger directement par ID d'événement
      const photosResponse = await this.http.get<any>(`${environment.apiUrl}/api/photo?eventId=${this.eventId}&page=1&limit=100`).toPromise();
      
      this.foundPhotos = photosResponse.photos.map((photo: any) => ({
        id: photo.id,
        imageUrl: this.getPhotoUrl(photo.id, 'watermarked'), // 🆕 Use backend API endpoint
        thumbnail: this.getPhotoUrl(photo.id, 'thumbnail'),   // 🆕 Use backend API endpoint
        timestamp: this.formatDate(photo.uploadDate),
        size: `${photo.dimensions?.width || 0}x${photo.dimensions?.height || 0}`,
        price: this.calculatePhotoPrice(photo),
        confidence: 95,
        selected: false,
        eventId: this.eventId,
        metadata: {
          location: photo.metadata?.location || 'Non spécifié',
          photographer: 'Photographe',
          tags: photo.tags || []
        }
      }));

      this.sortPhotos();
    } catch (error) {
      console.error('Error loading event photos by ID:', error);
      await this.loadScanResults();
    } finally {
      this.isLoading = false;
    }
  }

  private calculatePhotoPrice(photo: any): number {
    // Utiliser le prix défini pour l'événement au lieu d'une logique de calcul
    return this.eventPhotoPrice;
  }

  // Formater le prix avec la devise de l'événement
  formatPrice(price: number): string {
    const currencySymbols: { [key: string]: string } = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'CAD': 'C$',
      'XOF': 'CFA'
    };
    
    const symbol = currencySymbols[this.eventCurrency] || this.eventCurrency;
    return `${price.toFixed(2)}${symbol}`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
