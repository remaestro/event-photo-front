import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface OrderItem {
  id: string;
  photoId: string;
  photoUrl: string;
  photoTitle: string;
  format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  eventId: string;
  eventTitle: string;
}

export interface CreateOrderRequest {
  items: Array<{
    photoId: string;
    format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
    quantity: number;
  }>;
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  eventId?: string;
}

export interface OrdersResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrdersDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) { }

  createOrder(orderData: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, orderData);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${orderId}`);
  }

  getOrders(filters: OrderFilters = {}): Observable<OrdersResponse> {
    let params = new HttpParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<OrdersResponse>(this.baseUrl, { params });
  }
}