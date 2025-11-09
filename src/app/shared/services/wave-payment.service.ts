import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WaveCheckoutRequest {
  amount: number;
  orderId?: string;
  eventId?: number;
  customerEmail?: string;
  customerName?: string; // 🆕 Nom du client
  photoIds?: number[]; // 🆕 IDs des photos spécifiques achetées
  successUrl?: string;
  cancelUrl?: string;
}

export interface WaveCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WavePaymentService {
  private readonly baseUrl = `${environment.apiUrl}/api/wavepayment`;

  constructor(private http: HttpClient) {}

  /**
   * Créer une session de checkout Wave via notre backend
   */
  createCheckoutSession(request: WaveCheckoutRequest): Observable<WaveCheckoutResponse> {
    const apiRequest = {
      Amount: request.amount,  // Majuscule pour .NET
      OrderId: request.orderId || this.generateOrderId(),
      EventId: request.eventId,
      CustomerEmail: request.customerEmail,
      CustomerName: request.customerName, // 🆕 Nom du client
      PhotoIds: request.photoIds, // 🆕 IDs des photos spécifiques
      SuccessUrl: request.successUrl || `${window.location.origin}/payment-success`,
      CancelUrl: request.cancelUrl || `${window.location.origin}/payment-cancel`
    };

    return this.http.post<WaveCheckoutResponse>(`${this.baseUrl}/create-checkout`, apiRequest)
      .pipe(
        tap(response => {
          // 🆕 Stocker le session_id dans localStorage pour le récupérer après le paiement
          if (response.success && response.sessionId) {
            console.log('💾 Storing Wave session_id in localStorage:', response.sessionId);
            localStorage.setItem('wave_session_id', response.sessionId);
            localStorage.setItem('wave_session_timestamp', Date.now().toString());
          }
        })
      );
  }

  /**
   * Vérifier le statut d'une session de checkout
   */
  getCheckoutSession(sessionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/session/${sessionId}`);
  }

  /**
   * Obtenir le statut d'un paiement
   */
  getPaymentStatus(paymentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/payment/${paymentId}/status`);
  }

  /**
   * Générer un ID de commande unique
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `ORDER_${timestamp}_${random}`;
  }

  /**
   * Méthode legacy pour compatibilité - redirige vers la nouvelle méthode
   * @deprecated Utiliser createCheckoutSession() à la place
   */
  async initiatePayment(
    cartItems: any[], 
    customerInfo: { name: string; email: string; phone: string }, 
    orderInfo: { orderId: string }
  ): Promise<{ success: boolean; paymentId?: string; checkoutUrl?: string }> {
    try {
      console.warn('⚠️ initiatePayment() est dépréciée, utilisez createCheckoutSession()');
      
      // Calculer le montant total
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Récupérer l'ID de l'événement depuis le premier item
      const eventId = cartItems.length > 0 ? parseInt(cartItems[0].eventId) : undefined;

      const checkoutRequest: WaveCheckoutRequest = {
        amount: totalAmount,
        orderId: orderInfo.orderId,
        eventId: eventId,
        customerEmail: customerInfo.email
      };

      const response = await this.createCheckoutSession(checkoutRequest).toPromise();

      if (response?.success && response.checkoutUrl) {
        return {
          success: true,
          paymentId: response.sessionId,
          checkoutUrl: response.checkoutUrl
        };
      } else {
        console.error('Wave checkout failed:', response?.error);
        return {
          success: false
        };
      }
    } catch (error) {
      console.error('Wave payment initiation failed:', error);
      return {
        success: false
      };
    }
  }
}