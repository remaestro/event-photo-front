import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartSummary } from '../../shared/services/cart.service';
import { WavePaymentService } from '../../shared/services/wave-payment.service';
import { OrdersDataService } from '../../shared/services/orders-data.service';

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
  
  paymentMethods: PaymentMethod[] = [
    {
      id: 'stripe',
      name: 'Carte bancaire',
      icon: '💳',
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🅿️',
      description: 'Paiement sécurisé via PayPal'
    },
    {
      id: 'wave',
      name: 'Wave',
      icon: '📱',
      description: 'Paiement mobile sécurisé via Wave'
    }
  ];

  selectedPaymentMethod = 'stripe';
  isProcessing = false;
  showPaymentForm = false;
  orderSummary: OrderSummary = {
    subtotal: 0,
    tax: 0,
    processing: 0,
    total: 0,
    itemCount: 0
  };

  stripeElements: any;
  cardElement: any;

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
      country: ['France', Validators.required],
      
      // Payment
      paymentMethod: ['stripe', Validators.required],
      
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
    });
    
    this.loadStripe();
  }

  ngOnDestroy() {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  calculateOrderSummary() {
    const subtotal = this.cartSummary.totalPrice || this.cartSummary.total || 0;
    const tax = subtotal * 0.20; // 20% VAT
    const processing = 1.50; // Fixed processing fee
    const total = subtotal + tax + processing;

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

  loadStripe() {
    // In a real app, you would load Stripe.js here
    // const stripe = Stripe('pk_test_...');
    console.log('Loading Stripe...');
  }

  setupStripeElements() {
    // In a real app, you would setup Stripe Elements here
    console.log('Setting up Stripe Elements...');
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

      if (this.selectedPaymentMethod === 'stripe') {
        await this.processStripePayment(billingInfo);
      } else if (this.selectedPaymentMethod === 'paypal') {
        await this.processPayPalPayment(billingInfo);
      } else if (this.selectedPaymentMethod === 'wave') {
        await this.processWavePayment(billingInfo);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Le paiement a échoué. Veuillez réessayer.');
    } finally {
      this.isProcessing = false;
    }
  }

  async processStripePayment(billingInfo: BillingInfo) {
    // Simulate Stripe payment processing
    console.log('Processing Stripe payment...', billingInfo);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment
    const paymentResult = {
      success: true,
      paymentIntentId: 'pi_' + Math.random().toString(36).substr(2, 9),
      amount: this.orderSummary.total * 100, // cents
      currency: 'eur'
    };

    if (paymentResult.success) {
      this.completeOrder(paymentResult.paymentIntentId, 'stripe');
    }
  }

  async processPayPalPayment(billingInfo: BillingInfo) {
    // Simulate PayPal payment processing
    console.log('Processing PayPal payment...', billingInfo);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate successful payment
    const paymentResult = {
      success: true,
      transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
      amount: this.orderSummary.total,
      currency: 'EUR'
    };

    if (paymentResult.success) {
      this.completeOrder(paymentResult.transactionId, 'paypal');
    }
  }

  async processWavePayment(billingInfo: BillingInfo) {
    try {
      console.log('Processing Wave payment...', billingInfo);
      
      // Utiliser le service Wave existant avec gestion d'erreur
      const waveResponse = await this.wavePaymentService.initiatePayment(
        this.cartSummary.items,
        {
          name: `${billingInfo.firstName} ${billingInfo.lastName}`,
          email: billingInfo.email,
          phone: billingInfo.phone
        },
        { orderId: `ORDER_${Date.now()}` }
      ).toPromise();
      
      // Vérification stricte de la réponse
      if (waveResponse && waveResponse.success && waveResponse.paymentId) {
        // Créer la commande avec les données Wave
        this.completeOrder(waveResponse.paymentId, 'wave');
      } else {
        throw new Error('Wave payment initiation failed');
      }
      
    } catch (error) {
      console.error('Wave payment failed:', error);
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
        console.log('📦 Order created successfully:', createdOrder);
        
        // Clear cart
        this.cartService.clearCart();

        // Redirect to confirmation page with the real order ID
        this.router.navigate(['/order-confirmation', createdOrder.id]);
      },
      error: (error) => {
        console.error('❌ Failed to create order:', error);
        alert('Erreur lors de la création de la commande. Veuillez réessayer.');
        this.isProcessing = false;
      }
    });
  }

  private sendOrderConfirmationEmail(orderData: any) {
    // Simulate email sending
    console.log('📧 Sending order confirmation email to:', orderData.billing.email);
    console.log('Order details:', {
      orderId: orderData.id,
      total: orderData.summary.total,
      itemCount: orderData.summary.itemCount
    });
    
    // In a real app, this would call an email service
    // emailService.sendOrderConfirmation(orderData);
  }

  private generateInvoice(orderData: any) {
    // Simulate invoice generation
    console.log('📄 Generating invoice for order:', orderData.id);
    
    const invoice = {
      invoiceNumber: 'INV-' + orderData.id,
      orderDate: orderData.date,
      customerInfo: orderData.billing,
      items: orderData.items,
      summary: orderData.summary,
      paymentMethod: orderData.paymentMethod,
      transactionId: orderData.transactionId
    };
    
    // Store invoice (in real app, generate PDF and send via email)
    localStorage.setItem(`invoice_${orderData.id}`, JSON.stringify(invoice));
    console.log('Invoice generated and stored');
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
      currency: 'EUR'
    }).format(amount);
  }
}
