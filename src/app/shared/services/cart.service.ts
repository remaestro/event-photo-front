import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError, tap, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { CartDataService, Cart as ApiCart, AddCartItemRequest } from './cart-data.service';
import { EventsDataService } from './events-data.service';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: string;
  photoId: string;
  eventId: string;
  eventName: string;
  photoUrl: string;
  photoThumbnail: string;
  price: number;
  quantity: number;
  addedAt: string;
  currency: string; // Toujours requis maintenant
  photographer?: string;
  timestamp?: string;
  thumbnail?: string; // Alias pour photoThumbnail
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  uniqueEvents: number;
}

export interface CartStats {
  totalItems: number;
  totalValue: number;
  averageItemPrice: number;
  lastAddedItem?: CartItem;
  oldestItem?: Date;
  totalPhotos: number;
  averagePrice: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItemsSubject.asObservable();

  private cartSummarySubject = new BehaviorSubject<CartSummary>({
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    uniqueEvents: 0
  });
  public cartSummary$ = this.cartSummarySubject.asObservable();

  constructor(
    private cartDataService: CartDataService,
    private eventsDataService: EventsDataService,
    private http: HttpClient
  ) {
    this.loadCart();
  }

  /**
   * Charger le panier depuis l'API
   */
  loadCart(): void {
    this.cartDataService.getCart().pipe(
      catchError((error) => {
        console.warn('Cart API call failed, using empty cart:', error);
        return of({
          id: 'empty-cart',
          items: [],
          totals: { subtotal: 0, tax: 0, total: 0 },
          itemCount: 0,
          totalItems: 0,
          totalPrice: 0,
          updatedAt: new Date().toISOString()
        });
      })
    ).subscribe(apiCart => {
      const items = this.mapApiCartToLocal(apiCart);
      this.cartItemsSubject.next(items);
      this.updateCartSummary();
    });
  }

  /**
   * Ajouter un item au panier - maintenant simplifié car le backend calcule les prix
   */
  addItem(photoId: string, eventId: string, format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20' = 'digital'): Observable<boolean> {
    const request: AddCartItemRequest = {
      photoId: photoId.toString(),
      quantity: 1,
      format,
      productType: format,
      customizations: undefined
    };

    return this.cartDataService.addItem(request).pipe(
      map(apiCart => {
        const items = this.mapApiCartToLocal(apiCart);
        this.cartItemsSubject.next(items);
        this.updateCartSummary();
        return true;
      }),
      catchError((error) => {
        console.error('Error adding item to cart:', error);
        // Fallback: essayer de récupérer les données d'événement pour le mock
        return this.getEventDetails(eventId).pipe(
          switchMap(eventData => {
            const price = this.calculatePrice(eventData, format);
            const currency = eventData.currency || 'EUR';
            return this.addItemDirect(photoId, eventId, eventData.name, price, currency);
          }),
          catchError(() => of(false))
        );
      })
    );
  }

  /**
   * Ajouter plusieurs items au panier
   */
  addMultipleToCart(items: Array<{photoId: string, eventId: string, format?: string}>): Observable<boolean> {
    // Regrouper par événement pour optimiser les appels API
    const eventGroups = new Map<string, any[]>();
    items.forEach(item => {
      if (!eventGroups.has(item.eventId)) {
        eventGroups.set(item.eventId, []);
      }
      eventGroups.get(item.eventId)!.push(item);
    });

    const addPromises = Array.from(eventGroups.entries()).map(([eventId, eventItems]) => 
      this.getEventDetails(eventId).pipe(
        switchMap(eventData => {
          const addItemPromises = eventItems.map(item => 
            this.addItem(item.photoId, item.eventId, item.format as any || 'digital').toPromise()
          );
          return Promise.all(addItemPromises);
        })
      ).toPromise()
    );

    return new Observable(observer => {
      Promise.all(addPromises).then(() => {
        observer.next(true);
        observer.complete();
      }).catch(() => {
        observer.next(false);
        observer.complete();
      });
    });
  }

  /**
   * Récupérer les détails d'un événement
   */
  private getEventDetails(eventId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/events/${eventId}`).pipe(
      catchError(() => {
        console.warn(`Failed to load event ${eventId}, using defaults`);
        return of({
          id: eventId,
          name: `Événement ${eventId}`,
          photoPrice: 5.99,
          currency: 'EUR'
        });
      })
    );
  }

  /**
   * Calculer le prix selon le format
   */
  private calculatePrice(eventData: any, format: string): number {
    const basePrice = eventData.photoPrice || 5.99;
    
    switch (format) {
      case 'digital':
        return basePrice;
      case 'print_4x6':
        return basePrice + 2.00;
      case 'print_8x10':
        return basePrice + 5.00;
      case 'print_16x20':
        return basePrice + 15.00;
      default:
        return basePrice;
    }
  }

  /**
   * Ajouter un item directement (fallback)
   */
  private addItemDirect(photoId: string, eventId: string, eventName: string, price: number, currency: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentItems = this.cartItemsSubject.value;
        const existingItemIndex = currentItems.findIndex(item => item.photoId === photoId);

        if (existingItemIndex >= 0) {
          currentItems[existingItemIndex].quantity += 1;
        } else {
          const newItem: CartItem = {
            id: 'item_' + Date.now(),
            photoId,
            eventId,
            eventName,
            photoUrl: `${environment.apiUrl}/api/photo/${photoId}/serve?quality=watermarked`,
            photoThumbnail: `${environment.apiUrl}/api/photo/${photoId}/serve?quality=thumbnail`,
            price,
            quantity: 1,
            currency,
            addedAt: new Date().toISOString()
          };
          currentItems.push(newItem);
        }

        this.cartItemsSubject.next([...currentItems]);
        this.updateCartSummary();
        return true;
      })
    );
  }

  /**
   * Mettre à jour la quantité d'un item - now uses real API
   */
  updateItemQuantity(itemId: string, quantity: number): Observable<boolean> {
    return this.cartDataService.updateItem(itemId, { quantity }).pipe(
      map(apiCart => {
        const items = this.mapApiCartToLocal(apiCart);
        this.cartItemsSubject.next(items);
        this.updateCartSummary();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.updateItemQuantityMock(itemId, quantity);
      })
    );
  }

  /**
   * Supprimer un item du panier - now uses real API
   */
  removeItem(itemId: string): Observable<boolean> {
    return this.cartDataService.removeItem(itemId).pipe(
      map(apiCart => {
        const items = this.mapApiCartToLocal(apiCart);
        this.cartItemsSubject.next(items);
        this.updateCartSummary();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.removeItemMock(itemId);
      })
    );
  }

  /**
   * Vider le panier - now uses real API
   */
  clearCart(): Observable<boolean> {
    return this.cartDataService.clearCart().pipe(
      map(() => {
        this.cartItemsSubject.next([]);
        this.updateCartSummary();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.clearCartMock();
      })
    );
  }

  /**
   * Obtenir le nombre total d'items
   */
  getItemCount(): Observable<number> {
    return this.cartItems$.pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  /**
   * Vérifier si un item est dans le panier
   */
  isItemInCart(photoId: string): Observable<boolean> {
    return this.cartItems$.pipe(
      map(items => items.some(item => item.photoId === photoId))
    );
  }

  /**
   * Obtenir le panier complet - backward compatibility method
   */
  getCart(): Observable<CartSummary> {
    return this.cartSummary$.pipe(
      map(summary => {
        const items = this.cartItemsSubject.value;
        const uniqueEvents = new Set(items.map(item => item.eventId)).size;
        
        return {
          ...summary,
          items: items || [],
          totalItems: summary.itemCount,
          totalPrice: summary.total,
          uniqueEvents: uniqueEvents
        };
      })
    );
  }

  /**
   * Mettre à jour la quantité (alias pour updateItemQuantity)
   */
  updateQuantity(photoId: string, quantity: number): Observable<boolean> {
    // Find the item by photoId first
    const items = this.cartItemsSubject.value;
    const item = items.find(i => i.photoId === photoId);
    if (item) {
      return this.updateItemQuantity(item.id, quantity);
    }
    return of(false);
  }

  /**
   * Supprimer du panier par photoId
   */
  removeFromCart(photoId: string): Observable<boolean> {
    const items = this.cartItemsSubject.value;
    const item = items.find(i => i.photoId === photoId);
    if (item) {
      return this.removeItem(item.id);
    }
    return of(false);
  }

  /**
   * Supprimer tous les items d'un événement
   */
  removeEventItems(eventId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentItems = this.cartItemsSubject.value;
        const filteredItems = currentItems.filter(item => item.eventId !== eventId);
        this.cartItemsSubject.next(filteredItems);
        this.updateCartSummary();
        return true;
      })
    );
  }

  /**
   * Obtenir les statistiques du panier
   */
  getCartStats(): Observable<CartStats> {
    return this.cartItems$.pipe(
      map(items => {
        const totalItems = items.reduce((total, item) => total + item.quantity, 0);
        const totalValue = items.reduce((total, item) => total + (item.price * item.quantity), 0);
        const averageItemPrice = totalItems > 0 ? totalValue / totalItems : 0;
        const lastAddedItem = items.length > 0 ? 
          items.reduce((latest, item) => 
            new Date(item.addedAt) > new Date(latest.addedAt) ? item : latest
          ) : undefined;
        
        const oldestItem = items.length > 0 ? 
          new Date(items.reduce((oldest, item) => 
            new Date(item.addedAt) < new Date(oldest.addedAt) ? item : oldest
          ).addedAt) : undefined;

        return {
          totalItems,
          totalValue,
          averageItemPrice,
          lastAddedItem,
          oldestItem,
          totalPhotos: totalItems, // Alias for backward compatibility
          averagePrice: averageItemPrice // Alias for backward compatibility
        };
      })
    );
  }

  // Helper methods to map API data to local interfaces
  private mapApiCartToLocal(apiCart: ApiCart): CartItem[] {
    return apiCart.items.map(apiItem => ({
      id: apiItem.id,
      photoId: apiItem.photoId,
      eventId: apiItem.eventId,
      eventName: apiItem.eventName,
      photoUrl: `${environment.apiUrl}/api/photo/${apiItem.photoId}/serve?quality=watermarked`,
      photoThumbnail: apiItem.photoThumbnail || `${environment.apiUrl}/api/photo/${apiItem.photoId}/serve?quality=thumbnail`,
      price: apiItem.price,
      quantity: apiItem.quantity,
      currency: apiItem.currency || 'EUR', // Utiliser la devise du backend
      addedAt: apiItem.addedAt,
      thumbnail: apiItem.photoThumbnail,
      timestamp: apiItem.addedAt
    }));
  }

  private updateCartSummary(): void {
    const items = this.cartItemsSubject.value;
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = 0; // Pas de TVA pour l'instant
    const total = subtotal; // Total = Sous-total (sans taxe)
    const itemCount = items.reduce((count, item) => count + item.quantity, 0);
    const uniqueEvents = new Set(items.map(item => item.eventId)).size;

    this.cartSummarySubject.next({
      itemCount,
      subtotal,
      tax,
      total,
      items: items || [],
      totalItems: itemCount,
      totalPrice: total,
      uniqueEvents: uniqueEvents
    });
  }

  // Mock implementations for fallback
  private loadCartMock(): Observable<ApiCart> {
    const mockItems = this.getMockCartItems();
    const subtotal = mockItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.20;
    const total = subtotal + tax;
    const itemCount = mockItems.reduce((count, item) => count + item.quantity, 0);
    
    return of({
      id: 'mock-cart',
      items: mockItems.map(item => ({
        id: item.id,
        photoId: item.photoId,
        eventId: item.eventId,
        eventName: item.eventName,
        photoThumbnail: item.photoThumbnail,
        price: item.price,
        quantity: item.quantity,
        format: 'digital' as const,
        addedAt: item.addedAt
      })),
      totals: {
        subtotal: subtotal,
        tax: tax,
        total: total
      },
      itemCount: itemCount,
      totalItems: itemCount,
      totalPrice: total,
      updatedAt: new Date().toISOString()
    }).pipe(delay(300));
  }

  private addItemMock(photoId: string, eventId: string, eventName: string, photoUrl: string, photoThumbnail: string, price: number, quantity: number, currency: string = 'EUR'): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentItems = this.cartItemsSubject.value;
        const existingItemIndex = currentItems.findIndex(item => item.photoId === photoId);

        if (existingItemIndex >= 0) {
          // Update quantity if item already exists
          currentItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: 'item_' + Date.now(),
            photoId,
            eventId,
            eventName,
            photoUrl,
            photoThumbnail,
            price,
            quantity,
            currency,
            addedAt: new Date().toISOString()
          };
          currentItems.push(newItem);
        }

        this.cartItemsSubject.next([...currentItems]);
        this.updateCartSummary();
        return true;
      })
    );
  }

  private updateItemQuantityMock(itemId: string, quantity: number): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentItems = this.cartItemsSubject.value;
        const itemIndex = currentItems.findIndex(item => item.id === itemId);

        if (itemIndex >= 0) {
          if (quantity <= 0) {
            currentItems.splice(itemIndex, 1);
          } else {
            currentItems[itemIndex].quantity = quantity;
          }
          this.cartItemsSubject.next([...currentItems]);
          this.updateCartSummary();
        }
        return true;
      })
    );
  }

  private removeItemMock(itemId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const currentItems = this.cartItemsSubject.value;
        const filteredItems = currentItems.filter(item => item.id !== itemId);
        this.cartItemsSubject.next(filteredItems);
        this.updateCartSummary();
        return true;
      })
    );
  }

  private clearCartMock(): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        this.cartItemsSubject.next([]);
        this.updateCartSummary();
        return true;
      })
    );
  }

  private getMockCartItems(): CartItem[] {
    // Return empty cart for mock - items would be added through addItem
    return [];
  }
}