import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentProvider?: string;
  paymentIntentId?: string;
  waveTransactionId?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  billingAddress?: string;
  refundAmount?: number;
  refundReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  photoId: string;
  photo?: {
    id: string;
    filename: string;
    thumbnailUrl?: string;
  };
  productType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItemRequestDto[];
  customerInfo: CustomerInfoDto;
  shippingAddress?: ShippingAddressDto;
  billingAddress?: string; // JSON string
  paymentMethod: string;
}

export interface OrderItemRequestDto {
  photoId: string;
  quantity: number;
  format: string;
  price: number;
}

export interface CustomerInfoDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ShippingAddressDto {
  street: string;
  city: string;
  postalCode: string;
  country: string;
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

  getOrderById(orderId: string): Observable<Order> {
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

  updateOrderPaymentId(orderId: string, paymentIntentId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/${orderId}`, {
      paymentIntentId
    });
  }
}