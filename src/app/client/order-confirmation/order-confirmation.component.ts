import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersDataService, Order } from '../../shared/services/orders-data.service';

interface OrderData {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentProvider?: string;
  paymentIntentId?: string;
  waveTransactionId?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
  refundAmount?: number;
  refundReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  id: string;
  photoId: string;
  photo?: {
    id: string;
    filename: string;
    thumbnailUrl?: string;
  };
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
}

@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent implements OnInit {
  private ordersDataService = inject(OrdersDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderData: OrderData | null = null;
  isLoading = true;
  orderNotFound = false;

  ngOnInit() {
    // Récupérer l'orderId depuis les paramètres de route (pas query params)
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.loadOrderData(orderId);
    } else {
      this.orderNotFound = true;
      this.isLoading = false;
    }
  }

  private loadOrderData(orderId: string) {
    this.ordersDataService.getOrderById(orderId).subscribe({
      next: (order: Order) => {
        if (order) {
          this.orderData = order;
          console.log('📦 Order loaded successfully:', order);
        } else {
          this.orderNotFound = true;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error loading order data:', error);
        this.orderNotFound = true;
        this.isLoading = false;
      }
    });
  }

  downloadInvoice() {
    if (!this.orderData) return;
    
    try {
      // Générer une facture simple en JSON (en production, récupérer un PDF depuis l'API)
      const invoice = {
        invoiceNumber: `INV-${this.orderData.orderNumber || this.orderData.id}`,
        orderDate: this.orderData.createdAt,
        customerInfo: this.parseAddress(this.orderData.billingAddress),
        items: this.orderData.items,
        summary: {
          subtotal: this.orderData.subtotal,
          tax: this.orderData.tax,
          shipping: this.orderData.shippingCost,
          total: this.orderData.total
        },
        paymentMethod: this.orderData.paymentMethod,
        transactionId: this.orderData.paymentIntentId || this.orderData.waveTransactionId
      };

      console.log('📄 Downloading invoice for order:', this.orderData.id);
      
      const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${this.orderData.orderNumber || this.orderData.id}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  }

  public parseAddress(addressJson?: string): any {
    if (!addressJson) return {};
    try {
      return JSON.parse(addressJson);
    } catch {
      return {};
    }
  }

  goToMyPurchases() {
    this.router.navigate(['/my-purchases']);
  }

  goToEvents() {
    this.router.navigate(['/events/search']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaymentMethodName(method: string): string {
    switch (method) {
      case 'stripe':
        return 'Carte bancaire';
      case 'paypal':
        return 'PayPal';
      case 'wave':
        return 'Wave';
      default:
        return method;
    }
  }

  getPaymentIcon(method: string): string {
    switch (method) {
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      case 'wave':
        return '📱';
      default:
        return '💳';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Terminée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      case 'refunded':
        return 'Remboursée';
      default:
        return status;
    }
  }
}
