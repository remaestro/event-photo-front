import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoPurchaseService, PhotoPurchase } from '../../shared/services/photo-purchase.service';
import { AuthService } from '../../shared/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';
import { environment } from '../../../environments/environment'; // 🆕 Importer environment

@Component({
  selector: 'app-my-purchases',
  imports: [CommonModule],
  templateUrl: './my-purchases.component.html',
  styleUrl: './my-purchases.component.css'
})
export class MyPurchasesComponent implements OnInit {
  purchases: PhotoPurchase[] = [];
  isLoading = true;
  selectedPurchase: PhotoPurchase | null = null;
  downloadingItems: Set<string> = new Set();
  showInvoiceModal = false;
  selectedInvoice: any = null;
  filterStatus: 'all' | 'active' | 'expired' = 'all';
  sortBy: 'date' | 'amount' | 'items' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  userEmail: string | null = null;
  noAccessMessage = '';

  constructor(
    private router: Router,
    private photoPurchaseService: PhotoPurchaseService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.checkUserAccess();
  }

  private checkUserAccess() {
    // Vérifier si l'utilisateur est connecté
    if (!this.authService.isAuthenticated()) {
      this.noAccessMessage = 'Vous devez être connecté pour voir vos achats.';
      this.isLoading = false;
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.email) {
      this.noAccessMessage = 'Impossible de récupérer vos informations utilisateur.';
      this.isLoading = false;
      return;
    }

    this.userEmail = currentUser.email;
    this.loadPurchases();

    // S'abonner aux changements d'achats
    this.photoPurchaseService.purchases$.subscribe(purchases => {
      this.purchases = purchases;
      this.isLoading = false;
    });
  }

  private loadPurchases() {
    if (!this.userEmail) return;

    this.photoPurchaseService.loadUserPurchases(this.userEmail);
    
    // 🆕 En mode développement, charger des données de démonstration si aucune donnée réelle n'est disponible
    setTimeout(() => {
      if (this.purchases.length === 0) {
        console.log('🎭 Loading demo purchases for development...');
        const demoPurchases = this.photoPurchaseService.createDemoPurchases(this.userEmail!);
        this.photoPurchaseService.updatePurchases(demoPurchases);
      }
    }, 2000);
  }

  get filteredPurchases(): PhotoPurchase[] {
    let filtered = [...this.purchases];

    // Apply status filter
    if (this.filterStatus === 'active') {
      filtered = filtered.filter(p => this.isDownloadActive(p));
    } else if (this.filterStatus === 'expired') {
      filtered = filtered.filter(p => !this.isDownloadActive(p));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
        case 'items':
          comparison = a.photos.length - b.photos.length;
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  isDownloadActive(purchase: PhotoPurchase): boolean {
    return new Date() < new Date(purchase.downloadExpiresAt);
  }

  getDaysUntilExpiry(purchase: PhotoPurchase): number {
    const now = new Date();
    const expiryDate = new Date(purchase.downloadExpiresAt);
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async downloadPhoto(photo: any, purchase: PhotoPurchase) {
    if (!this.isDownloadActive(purchase)) {
      this.notificationService.warning(
        'Téléchargement expiré',
        'La période de téléchargement pour cette commande a expiré.'
      );
      return;
    }

    const downloadKey = `${purchase.id}_${photo.id}`;
    this.downloadingItems.add(downloadKey);

    try {
      // 🆕 CORRECTION : Utiliser l'API backend pour télécharger la photo originale sans watermark
      const photoId = this.extractPhotoId(photo);
      if (photoId) {
        const downloadUrl = `${this.getApiUrl()}/api/Photo/${photoId}/serve?quality=original`;
        const fileName = photo.filename || `photo-${photoId}.jpg`;
        
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
      } else {
        throw new Error('Photo ID not found');
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.notificationService.error(
        'Erreur de téléchargement',
        'Erreur lors du téléchargement. Veuillez réessayer.'
      );
    } finally {
      this.downloadingItems.delete(downloadKey);
    }
  }

  async downloadAllPhotos(purchase: PhotoPurchase) {
    if (!this.isDownloadActive(purchase)) {
      this.notificationService.warning(
        'Téléchargement expiré',
        'La période de téléchargement pour cette commande a expiré.'
      );
      return;
    }

    const downloadKey = `all_${purchase.id}`;
    this.downloadingItems.add(downloadKey);

    try {
      // 🆕 CORRECTION : Télécharger toutes les photos une par une avec délai échelonné
      console.log('📦 Starting bulk download of', purchase.photos.length, 'photos');
      
      purchase.photos.forEach((photo, index) => {
        setTimeout(() => {
          const photoId = this.extractPhotoId(photo);
          if (photoId) {
            const downloadUrl = `${this.getApiUrl()}/api/Photo/${photoId}/serve?quality=original`;
            const fileName = photo.filename || `photo-${photoId}.jpg`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`📥 Download ${index + 1}/${purchase.photos.length} initiated:`, fileName);
          }
        }, index * 300); // Échelonner avec 300ms entre chaque
      });
      
      const totalTime = purchase.photos.length * 0.3;
      this.notificationService.success(
        'Téléchargement groupé réussi',
        `Le téléchargement de ${purchase.photos.length} photos va commencer dans les ${totalTime.toFixed(1)} prochaines secondes.`
      );
    } catch (error) {
      console.error('Batch download failed:', error);
      this.notificationService.error(
        'Erreur de téléchargement groupé',
        'Erreur lors du téléchargement groupé. Veuillez réessayer.'
      );
    } finally {
      this.downloadingItems.delete(downloadKey);
    }
  }

  viewPurchaseDetails(purchase: PhotoPurchase) {
    this.selectedPurchase = purchase;
  }

  closePurchaseDetails() {
    this.selectedPurchase = null;
  }

  showInvoice(purchase: PhotoPurchase) {
    // Créer une facture simulée pour l'affichage
    this.selectedInvoice = {
      id: purchase.id,
      purchaseDate: purchase.purchaseDate,
      customerEmail: purchase.customerEmail,
      eventName: purchase.eventName,
      totalAmount: purchase.totalAmount,
      currency: purchase.currency,
      items: purchase.photos.map(photo => ({
        name: `Photo ${photo.id}`,
        price: photo.price,
        quantity: 1
      }))
    };
    this.showInvoiceModal = true;
  }

  downloadInvoice(purchase: PhotoPurchase) {
    try {
      const invoice = {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        customerEmail: purchase.customerEmail,
        eventName: purchase.eventName,
        totalAmount: purchase.totalAmount,
        currency: purchase.currency,
        items: purchase.photos
      };
      
      const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${purchase.id}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      this.notificationService.success(
        'Facture téléchargée',
        'La facture a été téléchargée avec succès.'
      );
    } catch (error) {
      console.error('Error downloading invoice:', error);
      this.notificationService.error(
        'Erreur de téléchargement',
        'Erreur lors du téléchargement de la facture.'
      );
    }
  }

  closeInvoiceModal() {
    this.showInvoiceModal = false;
    this.selectedInvoice = null;
  }

  setSortBy(field: 'date' | 'amount' | 'items') {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
  }

  setFilter(status: 'all' | 'active' | 'expired') {
    this.filterStatus = status;
  }

  goToEvents() {
    this.router.navigate(['/event-access']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { redirectTo: 'client/my-purchases' }
    });
  }

  isDownloading(itemId: string, purchaseId: string): boolean {
    return this.downloadingItems.has(`${purchaseId}_${itemId}`) || 
           this.downloadingItems.has(`all_${purchaseId}`);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getPaymentMethodName(method: string): string {
    switch (method) {
      case 'wave':
        return 'Wave';
      case 'stripe':
        return 'Carte bancaire';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  }

  getStatusColor(purchase: PhotoPurchase): string {
    if (this.isDownloadActive(purchase)) {
      const daysLeft = this.getDaysUntilExpiry(purchase);
      if (daysLeft <= 7) return 'text-orange-600';
      return 'text-green-600';
    }
    return 'text-red-600';
  }

  getStatusText(purchase: PhotoPurchase): string {
    if (this.isDownloadActive(purchase)) {
      const daysLeft = this.getDaysUntilExpiry(purchase);
      if (daysLeft <= 0) return 'Expiré';
      if (daysLeft === 1) return 'Expire demain';
      if (daysLeft <= 7) return `Expire dans ${daysLeft} jours`;
      return 'Actif';
    }
    return 'Expiré';
  }

  getActivePurchasesCount(): number {
    return this.purchases.filter(p => this.isDownloadActive(p)).length;
  }

  getExpiredPurchasesCount(): number {
    return this.purchases.filter(p => !this.isDownloadActive(p)).length;
  }

  // 🆕 Vérifier l'accès en attente après connexion
  checkPendingAccess() {
    const sessionId = this.photoPurchaseService.checkPendingAccess();
    if (sessionId && this.userEmail) {
      this.photoPurchaseService.associatePurchaseToUser(sessionId, this.userEmail).subscribe({
        next: () => {
          this.photoPurchaseService.clearPendingAccess();
          this.loadPurchases();
          this.notificationService.success(
            'Photos associées !',
            'Vos photos achetées ont été associées à votre compte.'
          );
        },
        error: (error) => {
          console.error('Error associating pending purchase:', error);
        }
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 🆕 Méthodes helper pour les URLs d'images via l'API backend
  getPhotoThumbnailUrl(photo: any): string {
    const photoId = this.extractPhotoId(photo);
    if (photoId) {
      return `${this.getApiUrl()}/api/Photo/${photoId}/serve?quality=thumbnail`;
    }
    // Fallback vers l'URL originale (mais ne marchera probablement pas avec Azure privé)
    return photo.thumbnailUrl || photo.photoUrl || '';
  }

  getPhotoWatermarkedUrl(photo: any): string {
    const photoId = this.extractPhotoId(photo);
    if (photoId) {
      return `${this.getApiUrl()}/api/Photo/${photoId}/serve?quality=watermarked`;
    }
    return photo.photoUrl || photo.watermarkedUrl || '';
  }

  // 🆕 Extraire l'ID de la photo depuis différentes sources
  private extractPhotoId(photo: any): string | null {
    // Priorité 1: photoId direct
    if (photo.photoId) {
      return photo.photoId.toString();
    }
    
    // Priorité 2: id
    if (photo.id && !isNaN(Number(photo.id))) {
      return photo.id.toString();
    }
    
    // Priorité 3: Extraire depuis une URL Azure
    if (photo.thumbnailUrl) {
      const idFromUrl = this.extractPhotoIdFromUrl(photo.thumbnailUrl);
      if (idFromUrl) return idFromUrl;
    }
    
    if (photo.photoUrl) {
      const idFromUrl = this.extractPhotoIdFromUrl(photo.photoUrl);
      if (idFromUrl) return idFromUrl;
    }
    
    console.warn('❌ Could not extract photo ID from:', photo);
    return null;
  }

  // 🆕 Extraire l'ID de la photo depuis une URL Azure Blob Storage
  private extractPhotoIdFromUrl(url: string): string | null {
    if (!url) return null;
    
    try {
      // Pattern 1: Extraire l'ID depuis le path /events/{eventId}/photos/{photoId}/
      const photoMatch = url.match(/\/photos\/(\d+)\//);
      if (photoMatch) {
        return photoMatch[1];
      }
      
      // Pattern 2: Extraire l'ID de l'événement depuis /events/{eventId}/
      const eventMatch = url.match(/\/events\/(\d+)\//);
      if (eventMatch) {
        return eventMatch[1];
      }
      
      // Pattern 3: Extraire un ID depuis le nom du fichier
      const filenameMatch = url.match(/\/([^\/]+)\.(jpg|jpeg|png|gif)$/i);
      if (filenameMatch) {
        const filename = filenameMatch[1];
        const idMatch = filename.match(/(\d+)/);
        if (idMatch) {
          return idMatch[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error extracting photo ID from URL:', url, error);
      return null;
    }
  }

  // 🆕 Obtenir l'URL de l'API
  private getApiUrl(): string {
    // Utiliser l'environnement pour obtenir l'URL de l'API
    return environment.apiUrl; // À remplacer par environment.apiUrl
  }
}
