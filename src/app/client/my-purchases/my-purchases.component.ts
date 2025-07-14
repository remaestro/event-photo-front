import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PurchaseItem {
  photoId: string;
  eventId: string;
  eventName: string;
  photoUrl: string;
  thumbnail: string;
  price: number;
  quantity: number;
  photographer?: string;
  timestamp?: string;
  downloadUrl?: string;
}

interface Purchase {
  id: string;
  transactionId: string;
  paymentMethod: string;
  items: PurchaseItem[];
  billing: any;
  summary: any;
  date: Date;
  status: string;
  downloadExpiresAt?: Date;
}

@Component({
  selector: 'app-my-purchases',
  imports: [CommonModule],
  templateUrl: './my-purchases.component.html',
  styleUrl: './my-purchases.component.css'
})
export class MyPurchasesComponent implements OnInit {
  purchases: Purchase[] = [];
  isLoading = true;
  selectedPurchase: Purchase | null = null;
  downloadingItems: Set<string> = new Set();
  showInvoiceModal = false;
  selectedInvoice: any = null;
  filterStatus: 'all' | 'active' | 'expired' = 'all';
  sortBy: 'date' | 'amount' | 'items' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadPurchases();
  }

  private loadPurchases() {
    try {
      // Load purchases from localStorage (in real app, fetch from backend)
      const storedPurchases = localStorage.getItem('userOrders');
      if (storedPurchases) {
        this.purchases = JSON.parse(storedPurchases).map((purchase: any) => ({
          ...purchase,
          date: new Date(purchase.date),
          downloadExpiresAt: this.calculateExpiryDate(new Date(purchase.date))
        }));
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private calculateExpiryDate(purchaseDate: Date): Date {
    // Downloads available for 6 months
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    return expiryDate;
  }

  get filteredPurchases(): Purchase[] {
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
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = a.summary.total - b.summary.total;
          break;
        case 'items':
          comparison = a.items.length - b.items.length;
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  isDownloadActive(purchase: Purchase): boolean {
    return purchase.downloadExpiresAt ? new Date() < purchase.downloadExpiresAt : false;
  }

  getDaysUntilExpiry(purchase: Purchase): number {
    if (!purchase.downloadExpiresAt) return 0;
    const now = new Date();
    const diffTime = purchase.downloadExpiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async downloadPhoto(item: PurchaseItem, purchase: Purchase) {
    if (!this.isDownloadActive(purchase)) {
      alert('La période de téléchargement pour cette commande a expiré.');
      return;
    }

    const downloadKey = `${purchase.id}_${item.photoId}`;
    this.downloadingItems.add(downloadKey);

    try {
      // Simulate download process
      await this.delay(1500);
      
      // In a real app, this would fetch the high-resolution image without watermark
      const response = await fetch(item.photoUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photo-${item.photoId}-${purchase.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    } finally {
      this.downloadingItems.delete(downloadKey);
    }
  }

  async downloadAllPhotos(purchase: Purchase) {
    if (!this.isDownloadActive(purchase)) {
      alert('La période de téléchargement pour cette commande a expiré.');
      return;
    }

    const downloadKey = `all_${purchase.id}`;
    this.downloadingItems.add(downloadKey);

    try {
      // Simulate batch download
      await this.delay(2000);
      
      // In a real app, this would create a ZIP file with all photos
      for (const item of purchase.items) {
        await this.downloadPhoto(item, purchase);
        await this.delay(500); // Small delay between downloads
      }
    } catch (error) {
      console.error('Batch download failed:', error);
      alert('Erreur lors du téléchargement groupé. Veuillez réessayer.');
    } finally {
      this.downloadingItems.delete(downloadKey);
    }
  }

  viewPurchaseDetails(purchase: Purchase) {
    this.selectedPurchase = purchase;
  }

  closePurchaseDetails() {
    this.selectedPurchase = null;
  }

  showInvoice(purchase: Purchase) {
    try {
      const invoice = localStorage.getItem(`invoice_${purchase.id}`);
      if (invoice) {
        this.selectedInvoice = JSON.parse(invoice);
        this.showInvoiceModal = true;
      } else {
        alert('Facture non disponible pour cette commande.');
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Erreur lors du chargement de la facture.');
    }
  }

  downloadInvoice(purchase: Purchase) {
    try {
      const invoice = localStorage.getItem(`invoice_${purchase.id}`);
      if (invoice) {
        const blob = new Blob([invoice], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${purchase.id}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Erreur lors du téléchargement de la facture.');
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
    this.router.navigate(['/events/search']);
  }

  isDownloading(itemId: string, purchaseId: string): boolean {
    return this.downloadingItems.has(`${purchaseId}_${itemId}`) || 
           this.downloadingItems.has(`all_${purchaseId}`);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getPaymentMethodName(method: string): string {
    switch (method) {
      case 'stripe':
        return 'Carte bancaire';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  }

  getStatusColor(purchase: Purchase): string {
    if (this.isDownloadActive(purchase)) {
      const daysLeft = this.getDaysUntilExpiry(purchase);
      if (daysLeft <= 7) return 'text-orange-600';
      return 'text-green-600';
    }
    return 'text-red-600';
  }

  getStatusText(purchase: Purchase): string {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
