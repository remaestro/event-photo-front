import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartSummary } from '../../shared/services/cart.service';
import { WavePaymentService } from '../../shared/services/wave-payment.service';
import { OrdersDataService } from '../../shared/services/orders-data.service';
import { ImageUrlService } from '../../shared/services/image-url.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

interface OrderSummary {
  subtotal: number;
  tax: number;
  processing: number;
  total: number;
  itemCount: number;
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private cartService = inject(CartService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private wavePaymentService = inject(WavePaymentService);
  private ordersDataService = inject(OrdersDataService);
  private imageUrlService = inject(ImageUrlService);
  private cartSubscription?: Subscription;

  checkoutForm: FormGroup;
  cartSummary: CartSummary = { 
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    uniqueEvents: 0
  };
  
  // Devise de l'événement en cours
  eventCurrency: string = 'EUR';
  
  paymentMethods: PaymentMethod[] = [
    {
      id: 'wave',
      name: 'Wave',
      icon: '📱',
      description: 'Paiement mobile sécurisé via Wave'
    }
  ];

  selectedPaymentMethod = 'wave';
  isProcessing = false;
  showPaymentForm = false;
  orderSummary: OrderSummary = {
    subtotal: 0,
    tax: 0,
    processing: 0,
    total: 0,
    itemCount: 0
  };

  constructor() {
    this.checkoutForm = this.fb.group({
      // Billing Information
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      country: ['Senegal', Validators.required], // Changer le pays par défaut pour Wave
      
      // Payment - Wave par défaut
      paymentMethod: ['wave', Validators.required],
      
      // Terms
      acceptTerms: [false, Validators.requiredTrue],
      subscribeNewsletter: [false]
    });
  }

  ngOnInit() {
    // Subscribe to cart changes
    this.cartSubscription = this.cartService.getCart().subscribe(summary => {
      this.cartSummary = summary;
      this.calculateOrderSummary();
      
      // Get currency from the first item (since one event per checkout)
      if (summary.items && summary.items.length > 0) {
        this.eventCurrency = summary.items[0].currency || 'EUR';
      }
    });
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  calculateOrderSummary() {
    const subtotal = this.cartSummary.totalPrice || this.cartSummary.total || 0;
    const tax = 0; // Pas de TVA pour l'instant
    const processing = 0; // Pas de frais de traitement pour l'instant
    const total = subtotal; // Total = Sous-total (sans frais supplémentaires)

    this.orderSummary = {
      subtotal,
      tax,
      processing,
      total,
      itemCount: this.cartSummary.totalItems || this.cartSummary.itemCount || 0
    };
  }

  onPaymentMethodChange(method: string) {
    this.selectedPaymentMethod = method;
    this.checkoutForm.patchValue({ paymentMethod: method });
  }

  async processPayment() {
    if (this.checkoutForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isProcessing = true;

    try {
      const billingInfo: BillingInfo = {
        firstName: this.checkoutForm.value.firstName,
        lastName: this.checkoutForm.value.lastName,
        email: this.checkoutForm.value.email,
        phone: this.checkoutForm.value.phone,
        address: this.checkoutForm.value.address,
        city: this.checkoutForm.value.city,
        postalCode: this.checkoutForm.value.postalCode,
        country: this.checkoutForm.value.country
      };

      if (this.selectedPaymentMethod === 'wave') {
        await this.processWavePayment(billingInfo);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Le paiement a échoué. Veuillez réessayer.');
    } finally {
      this.isProcessing = false;
    }
  }

  async processWavePayment(billingInfo: BillingInfo) {
    try {
      if (!this.cartSummary.items || this.cartSummary.items.length === 0) {
        throw new Error('Panier vide - impossible de procéder au paiement');
      }

      if (this.orderSummary.total <= 0) {
        throw new Error('Montant invalide - impossible de procéder au paiement');
      }

      const checkoutRequest = {
        amount: this.orderSummary.total,
        orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: this.cartSummary.items[0]?.eventId ? parseInt(this.cartSummary.items[0].eventId) : undefined,
        customerEmail: billingInfo.email,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/payment-cancel`
      };

      const waveResponse = await this.wavePaymentService.createCheckoutSession(checkoutRequest).toPromise();
      
      if (waveResponse && waveResponse.success && waveResponse.checkoutUrl) {
        window.location.href = waveResponse.checkoutUrl;
      } else {
        let errorMessage = 'Erreur inconnue';
        if (waveResponse?.error) {
          errorMessage = waveResponse.error;
        } else if (!waveResponse?.success) {
          errorMessage = 'La session de paiement n\'a pas pu être créée';
        } else if (!waveResponse?.checkoutUrl) {
          errorMessage = 'URL de paiement manquante';
        }
        
        throw new Error('Échec de la création de la session Wave: ' + errorMessage);
      }
      
    } catch (error) {
      throw error;
    }
  }

  completeOrder(transactionId: string, paymentMethod: string) {
    // Préparer les items du panier pour la commande
    const orderItems = this.cartSummary.items.map(item => ({
      photoId: item.photoId.toString(),
      quantity: item.quantity,
      format: 'digital', // Valeur par défaut, pourrait être récupérée du panier si disponible
      price: item.price
    }));

    const orderData = {
      customerId: "1", // TODO: Get from auth service
      items: orderItems,
      customerInfo: {
        firstName: this.checkoutForm.value.firstName,
        lastName: this.checkoutForm.value.lastName,
        email: this.checkoutForm.value.email,
        phone: this.checkoutForm.value.phone
      },
      shippingAddress: {
        street: this.checkoutForm.value.address,
        city: this.checkoutForm.value.city,
        postalCode: this.checkoutForm.value.postalCode,
        country: this.checkoutForm.value.country
      },
      billingAddress: JSON.stringify({
        address: this.checkoutForm.value.address,
        city: this.checkoutForm.value.city,
        postalCode: this.checkoutForm.value.postalCode,
        country: this.checkoutForm.value.country
      }),
      paymentMethod
    };

    // Appeler l'API pour créer la commande en base de données
    this.ordersDataService.createOrder(orderData).subscribe({
      next: (createdOrder) => {
        // Clear cart
        this.cartService.clearCart();

        // Redirect to confirmation page with the real order ID
        this.router.navigate(['/order-confirmation', createdOrder.id]);
      },
      error: (error) => {
        alert('Erreur lors de la création de la commande. Veuillez réessayer.');
        this.isProcessing = false;
      }
    });
  }

  private markFormGroupTouched() {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      const control = this.checkoutForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pattern']) return 'Format invalide';
    }
    return '';
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  // Helper method to format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: this.eventCurrency
    }).format(amount);
  }

  // Obtenir l'URL du thumbnail de la photo
  getPhotoThumbnailUrl(photoId: string): string {
    return this.imageUrlService.getThumbnailUrl(photoId);
  }

  // Gérer les erreurs d'image
  onImageError(event: Event): void {
    this.imageUrlService.onImageError(event);
  }
}
