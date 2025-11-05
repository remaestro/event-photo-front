import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WavePaymentService } from '../shared/services/wave-payment.service';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <!-- Success Icon -->
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            Paiement réussi !
          </h1>
          
          <p class="text-gray-600 mb-8">
            Votre paiement Wave a été traité avec succès. Vous allez recevoir un email de confirmation dans quelques instants.
          </p>
          
          <!-- Loading status -->
          <div *ngIf="isVerifying" class="mb-6">
            <div class="flex items-center justify-center space-x-2">
              <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-sm text-gray-600">Vérification du paiement en cours...</span>
            </div>
          </div>
          
          <!-- Payment details -->
          <div *ngIf="paymentVerified" class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Détails du paiement</h3>
            <div class="space-y-2 text-sm text-gray-600">
              <div class="flex justify-between">
                <span>Numéro de transaction :</span>
                <span class="font-mono">{{ sessionId }}</span>
              </div>
              <div class="flex justify-between">
                <span>Statut :</span>
                <span class="text-green-600 font-medium">Confirmé</span>
              </div>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="space-y-3">
            <button 
              (click)="goToOrderConfirmation()"
              class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Voir ma commande
            </button>
            
            <button 
              (click)="goToEvents()"
              class="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              Retour aux événements
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentSuccessComponent implements OnInit {
  sessionId: string | null = null;
  isVerifying = true;
  paymentVerified = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wavePaymentService: WavePaymentService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (this.sessionId) {
      this.verifyPayment();
    } else {
      console.warn('No session ID found in URL');
      this.isVerifying = false;
    }
  }

  async verifyPayment() {
    if (!this.sessionId) return;
    
    try {
      const paymentStatus = await this.wavePaymentService.getCheckoutSession(this.sessionId).toPromise();
      
      if (paymentStatus && paymentStatus.status === 'completed') {
        this.paymentVerified = true;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      this.isVerifying = false;
    }
  }

  goToOrderConfirmation() {
    // Redirect to order confirmation page
    // You might need to get the order ID from the payment details
    this.router.navigate(['/orders']);
  }

  goToEvents() {
    this.router.navigate(['/events']);
  }
}