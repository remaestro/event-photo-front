import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { OrdersDataService } from '../../shared/services/orders-data.service';

@Component({
  selector: 'app-wave-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl">📱</span>
        </div>
        
        <h1 class="text-xl font-semibold text-gray-900 mb-2">Paiement Wave en cours</h1>
        <p class="text-gray-600 mb-6">Veuillez compléter le paiement sur votre téléphone</p>
        
        <div class="text-sm text-gray-600 mb-4">
          <p>Commande: {{ orderId }}</p>
          <p>Montant: {{ amount }}€</p>
        </div>
        
        <div class="space-y-3">
          <div class="animate-pulse bg-blue-100 p-3 rounded" *ngIf="paymentStatus === 'pending'">
            <p class="text-blue-700">En attente du paiement...</p>
          </div>
          
          <div class="bg-green-100 p-3 rounded" *ngIf="paymentStatus === 'completed'">
            <p class="text-green-700">Paiement réussi ! Redirection...</p>
          </div>
          
          <div class="bg-red-100 p-3 rounded" *ngIf="paymentStatus === 'failed'">
            <p class="text-red-700">Paiement échoué. Veuillez réessayer.</p>
          </div>
          
          <button (click)="goToConfirmation()" 
                  class="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  *ngIf="paymentStatus === 'completed'">
            Continuer
          </button>
          
          <button (click)="goToConfirmation()" 
                  class="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                  *ngIf="paymentStatus === 'pending'">
            J'ai payé, continuer
          </button>
          
          <button (click)="cancelPayment()" 
                  class="w-full text-gray-500 hover:text-gray-700">
            Retour au panier
          </button>
        </div>
      </div>
    </div>
  `
})
export class WaveStatusComponent implements OnInit, OnDestroy {
  orderId: string | null = null;
  amount: number = 0;
  paymentStatus: string = 'pending';
  private statusSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersDataService
  ) {}

  ngOnInit() {
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');
    this.amount = parseFloat(this.route.snapshot.queryParamMap.get('amount') || '0');
    
    // Démarrer la vérification du statut
    this.startStatusChecking();
    
    // Auto-redirect après 30 secondes si en attente
    setTimeout(() => {
      if (this.paymentStatus === 'pending') {
        this.goToConfirmation();
      }
    }, 30000);
  }
  
  ngOnDestroy() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }
  
  private startStatusChecking() {
    if (!this.orderId) return;
    
    // Vérifier le statut toutes les 3 secondes
    this.statusSubscription = interval(3000).subscribe(() => {
      this.ordersService.getOrderById(this.orderId!).subscribe({
        next: (order) => {
          // Utiliser le status général de la commande au lieu de paymentStatus
          if (order.status === 'completed') {
            this.paymentStatus = 'completed';
            setTimeout(() => {
              this.goToConfirmation();
            }, 2000);
          } else if (order.status === 'cancelled') {
            this.paymentStatus = 'failed';
          }
        },
        error: (error) => {
          console.error('Error checking order status:', error);
        }
      });
    });
  }
  
  goToConfirmation() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    
    // Corriger la navigation pour utiliser le path parameter
    this.router.navigate(['/order-confirmation', this.orderId]);
  }
  
  cancelPayment() {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    
    this.router.navigate(['/client/cart']);
  }
}