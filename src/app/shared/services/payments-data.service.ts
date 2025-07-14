import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentConfirmation {
  orderId: string;
  paymentIntentId: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending';
  failureReason?: string;
  processedAt: string;
}

export interface PaymentStatus {
  orderId: string;
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  transactionId?: string;
  failureReason?: string;
  lastUpdated: string;
}

export interface ConfirmPaymentRequest {
  orderId: string;
  paymentIntentId: string;
  paymentMethodId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) { }

  confirmPayment(paymentData: ConfirmPaymentRequest): Observable<PaymentConfirmation> {
    return this.http.post<PaymentConfirmation>(`${this.baseUrl}/confirm`, paymentData);
  }

  getPaymentStatus(orderId: string): Observable<PaymentStatus> {
    return this.http.get<PaymentStatus>(`${this.baseUrl}/${orderId}/status`);
  }
}