import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WavePaymentRequest {
  items: any[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  metadata: any;
}

export interface WavePaymentResponse {
  success: boolean;
  paymentId: string;
  paymentUrl?: string;
  qrCode?: string;
  amount: number;
  currency: string;
  expiresAt?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WavePaymentService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  initiatePayment(items: any[], customerInfo: any, metadata: any): Observable<WavePaymentResponse> {
    // Pour le moment, on simule une réponse Wave
    // En production, ceci ferait un appel à l'API Wave
    
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const mockResponse: WavePaymentResponse = {
      success: true,
      paymentId: `WAVE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      paymentUrl: `https://checkout.wave.com/pay/${Date.now()}`,
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      amount: totalAmount,
      currency: 'XOF',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      message: 'Paiement Wave initié avec succès'
    };

    console.log('🌊 Wave Payment Service - Initiating payment:', {
      items: items.length,
      amount: totalAmount,
      customer: customerInfo.name,
      paymentId: mockResponse.paymentId
    });

    // Simuler un délai réseau
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(mockResponse);
        observer.complete();
      }, 1000);
    });
  }

  checkPaymentStatus(paymentId: string): Observable<{ status: string; transactionId?: string }> {
    // Simulation du statut de paiement
    const mockStatus = {
      status: Math.random() > 0.3 ? 'completed' : 'pending',
      transactionId: `TXN_${Date.now()}`
    };

    console.log('🌊 Wave Payment Service - Checking status:', paymentId, mockStatus);

    return of(mockStatus);
  }

  // En production, cette méthode ferait des appels réels à l'API Wave
  private makeWaveAPICall(endpoint: string, data: any): Observable<any> {
    const waveApiUrl = 'https://api.wave.com/v1';
    
    // Utiliser les clés d'environment seulement si elles existent
    const waveApiKey = (environment as any).waveApiKey || 'test_key';
    
    const headers = {
      'Authorization': `Bearer ${waveApiKey}`,
      'Content-Type': 'application/json'
    };

    return this.http.post(`${waveApiUrl}/${endpoint}`, data, { headers });
  }
}