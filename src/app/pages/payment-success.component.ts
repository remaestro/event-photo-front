import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WavePaymentService } from '../shared/services/wave-payment.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
            Votre paiement Wave a été traité avec succès. 
            <span *ngIf="emailConfirmed; else emailPending">
              Un email de confirmation vous a été envoyé.
            </span>
            <ng-template #emailPending>
              Vous devriez recevoir un email de confirmation dans quelques instants.
            </ng-template>
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
          
          <!-- Payment verification failed warning -->
          <div *ngIf="verificationFailed" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex">
              <svg class="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
              <div class="text-left">
                <h3 class="text-sm font-medium text-yellow-800">Vérification en cours</h3>
                <p class="text-sm text-yellow-700 mt-1">
                  Nous vérifions votre paiement. Si vous ne recevez pas d'email dans les 10 prochaines minutes, 
                  cliquez sur le bouton ci-dessous.
                </p>
              </div>
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
          
          <!-- Manual email confirmation -->
          <div *ngIf="!emailConfirmed && !isVerifying" class="mb-6">
            <button 
              (click)="sendManualConfirmation()"
              [disabled]="sendingEmail"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              <svg *ngIf="!sendingEmail" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <svg *ngIf="sendingEmail" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ sendingEmail ? 'Envoi en cours...' : 'Renvoyer l\'email de confirmation' }}
            </button>
          </div>
          
          <!-- Action buttons -->
          <div class="space-y-3">
            <button 
              (click)="goToOrderConfirmation()"
              class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Voir mes photos
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
  verificationFailed = false;
  emailConfirmed = false;
  sendingEmail = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wavePaymentService: WavePaymentService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (this.sessionId) {
      this.verifyPayment();
      // Vérifier automatiquement les paiements en attente après 30 secondes
      setTimeout(() => {
        if (!this.emailConfirmed) {
          this.triggerPaymentVerification();
        }
      }, 30000);
    } else {
      console.warn('No session ID found in URL');
      this.isVerifying = false;
      this.verificationFailed = true;
    }
  }

  async verifyPayment() {
    if (!this.sessionId) return;
    
    try {
      const paymentStatus = await this.wavePaymentService.getCheckoutSession(this.sessionId).toPromise();
      
      if (paymentStatus && (paymentStatus.payment_status === 'successful' || paymentStatus.status === 'complete')) {
        this.paymentVerified = true;
        // Si le paiement est vérifié, on assume que l'email sera envoyé
        // On attend 5 secondes puis on marque comme confirmé
        setTimeout(() => {
          this.emailConfirmed = true;
        }, 5000);
      } else {
        this.verificationFailed = true;
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      this.verificationFailed = true;
    } finally {
      this.isVerifying = false;
    }
  }

  async triggerPaymentVerification() {
    try {
      await this.http.post(`${environment.apiUrl}/api/WavePayment/verify-pending-payments`, {}).toPromise();
      console.log('Payment verification triggered');
    } catch (error) {
      console.error('Error triggering payment verification:', error);
    }
  }

  async sendManualConfirmation() {
    if (!this.sessionId) {
      alert('Session ID manquant');
      return;
    }

    // Demander l'email du client
    const customerEmail = prompt('Veuillez entrer votre adresse email pour recevoir la confirmation:');
    if (!customerEmail || !customerEmail.includes('@')) {
      alert('Adresse email invalide');
      return;
    }

    this.sendingEmail = true;

    try {
      await this.http.post(`${environment.apiUrl}/api/WavePayment/send-manual-confirmation`, {
        sessionId: this.sessionId,
        customerEmail: customerEmail,
        customerName: 'Client'
      }).toPromise();

      this.emailConfirmed = true;
      alert('Email de confirmation envoyé avec succès!');
    } catch (error) {
      console.error('Error sending manual confirmation:', error);
      alert('Erreur lors de l\'envoi de l\'email. Veuillez réessayer.');
    } finally {
      this.sendingEmail = false;
    }
  }

  goToOrderConfirmation() {
    this.router.navigate(['/my-purchases']);
  }

  goToEvents() {
    this.router.navigate(['/event-access']);
  }
}