import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: string;
  photoId: string;
  eventId: string;
  eventName: string;
  photoThumbnail: string;
  price: number;
  quantity: number;
  format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
  addedAt: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  itemCount: number;
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

export interface AddCartItemRequest {
  photoId: string;
  quantity: number;
  format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20';
}

export interface UpdateCartItemRequest {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartDataService {
  private readonly baseUrl = `${environment.apiUrl}/api/cart`;

  constructor(private http: HttpClient) { }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.baseUrl);
  }

  addItem(item: AddCartItemRequest): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/items`, item);
  }

  updateItem(itemId: string, updates: UpdateCartItemRequest): Observable<Cart> {
    return this.http.put<Cart>(`${this.baseUrl}/items/${itemId}`, updates);
  }

  removeItem(itemId: string): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/clear`);
  }
}