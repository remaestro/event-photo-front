import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { CartDataService, Cart as ApiCart, AddCartItemRequest } from './cart-data.service';

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
  currency?: string; // Devise de l'événement
  photographer?: string; // Add for backward compatibility
  timestamp?: string; // Add for backward compatibility
  thumbnail?: string; // Add for backward compatibility (alias for photoThumbnail)
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
  items: CartItem[]; // Make non-optional for backward compatibility
  totalItems: number; // Make non-optional for backward compatibility (alias for itemCount)
  totalPrice: number; // Make non-optional for backward compatibility (alias for total)
  uniqueEvents: number; // Make non-optional for backward compatibility
}

export interface CartStats {
  totalItems: number;
  totalValue: number;
  averageItemPrice: number;
  lastAddedItem?: CartItem;
  oldestItem?: Date; // Keep optional for backward compatibility
  totalPhotos: number; // Make non-optional for backward compatibility (alias for totalItems)
  averagePrice: number; // Make non-optional for backward compatibility (alias for averageItemPrice)
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
    items: [], // Initialize as empty array
    totalItems: 0, // Initialize as 0
    totalPrice: 0, // Initialize as 0
    uniqueEvents: 0 // Initialize as 0
  });
  public cartSummary$ = this.cartSummarySubject.asObservable();

  constructor(private cartDataService: CartDataService) {
    this.loadCart();
  }

  /**
   * Charger le panier - now uses real API with better error handling
   */
  loadCart(): void {
    // Remove auth token check - allow anonymous carts
    // const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    // if (!token) {
    //   console.log('No auth token found, using empty cart');
    //   // User not logged in, use empty cart
    //   this.cartItemsSubject.next([]);
    //   this.updateCartSummary();
    //   return;
    // }

    this.cartDataService.getCart().pipe(
      catchError((error) => {
        console.warn('Cart API call failed:', error);
        // Fallback to mock implementation for any errors
        return this.loadCartMock();
      })
    ).subscribe(apiCart => {
      const items = this.mapApiCartToLocal(apiCart);
      this.cartItemsSubject.next(items);
      this.updateCartSummary();
    });
  }

  /**
   * Ajouter un item au panier - now uses real API
   */
  addItem(photoId: string, eventId: string, eventName: string, photoUrl: string, photoThumbnail: string, price: number, quantity: number = 1, currency: string = 'EUR', format: 'digital' | 'print_4x6' | 'print_8x10' | 'print_16x20' = 'digital'): Observable<boolean> {
    const request: AddCartItemRequest = {
      photoId: photoId.toString(), // S'assurer que c'est une string
      quantity,
      format,
      productType: format, // Ajouter productType qui correspond au format
      customizations: undefined
    };

    return this.cartDataService.addItem(request).pipe(
      map(apiCart => {
        const items = this.mapApiCartToLocal(apiCart);
        this.cartItemsSubject.next(items);
        this.updateCartSummary();
        return true;
      }),
      catchError(() => {
        // Fallback to mock implementation
        return this.addItemMock(photoId, eventId, eventName, photoUrl, photoThumbnail, price, quantity, currency);
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
   * Ajouter plusieurs items au panier
   */
  addMultipleToCart(items: Array<{photoId: string, eventId: string, eventName: string, photoUrl: string, photoThumbnail: string, price: number, quantity?: number, currency?: string}>): Observable<boolean> {
    const addPromises = items.map(item => 
      this.addItem(
        item.photoId,
        item.eventId,
        item.eventName,
        item.photoUrl,
        item.photoThumbnail,
        item.price,
        item.quantity || 1,
        item.currency || 'EUR'
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
      photoUrl: apiItem.photoThumbnail, // API might need to include full URL
      photoThumbnail: apiItem.photoThumbnail,
      price: apiItem.price,
      quantity: apiItem.quantity,
      addedAt: apiItem.addedAt,
      thumbnail: apiItem.photoThumbnail, // Alias for backward compatibility
      photographer: undefined, // Would need to come from API
      timestamp: apiItem.addedAt // Alias for backward compatibility
    }));
  }

  private updateCartSummary(): void {
    const items = this.cartItemsSubject.value;
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.20; // 20% TVA
    const total = subtotal + tax;
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