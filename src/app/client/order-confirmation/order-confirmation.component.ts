import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

interface OrderData {
  id: string;
  transactionId: string;
  paymentMethod: string;
  items: any[];
  billing: any;
  summary: any;
  date: Date;
  status: string;
}

@Component({
  selector: 'app-order-confirmation',
  imports: [CommonModule],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent implements OnInit {
  orderData: OrderData | null = null;
  isLoading = true;
  orderNotFound = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const orderId = this.route.snapshot.queryParams['orderId'];
    if (orderId) {
      this.loadOrderData(orderId);
    } else {
      this.orderNotFound = true;
      this.isLoading = false;
    }
  }

  private loadOrderData(orderId: string) {
    try {
      // Load order from localStorage (in real app, fetch from backend)
      const orders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      this.orderData = orders.find((order: OrderData) => order.id === orderId);
      
      if (!this.orderData) {
        this.orderNotFound = true;
      }
    } catch (error) {
      console.error('Error loading order data:', error);
      this.orderNotFound = true;
    } finally {
      this.isLoading = false;
    }
  }

  downloadInvoice() {
    if (!this.orderData) return;
    
    try {
      const invoice = localStorage.getItem(`invoice_${this.orderData.id}`);
      if (invoice) {
        // Simulate invoice download
        console.log('📄 Downloading invoice for order:', this.orderData.id);
        
        // In a real app, this would download a PDF file
        const blob = new Blob([invoice], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${this.orderData.id}.json`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
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

  formatDate(date: Date): string {
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
      default:
        return method;
    }
  }
}
