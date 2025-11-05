import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div class="text-center">
          <!-- Cancel Icon -->
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
          
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            Paiement annulé
          </h1>
          
          <p class="text-gray-600 mb-8">
            Votre paiement Wave a été annulé. Aucun montant n'a été débité de votre compte.
          </p>
          
          <!-- Info message -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
              <svg class="h-5 w-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium text-blue-900">Information</h3>
                <p class="text-sm text-blue-700 mt-1">
                  Vos articles sont toujours dans votre panier. Vous pouvez reprendre votre commande à tout moment.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="space-y-3">
            <button 
              (click)="goToCart()"
              class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Retour au panier
            </button>
            
            <button 
              (click)="goToEvents()"
              class="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors">
              Continuer mes achats
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentCancelComponent {
  constructor(private router: Router) {}

  goToCart() {
    this.router.navigate(['/cart']);
  }

  goToEvents() {
    this.router.navigate(['/events']);
  }
}