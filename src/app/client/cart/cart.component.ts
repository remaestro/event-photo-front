import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartItem, CartSummary, CartStats } from '../../shared/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cartSummary: CartSummary = { 
    itemCount: 0, 
    subtotal: 0, 
    tax: 0, 
    total: 0, 
    items: [], 
    totalItems: 0, 
    totalPrice: 0, 
    uniqueEvents: 0 
  };
  cartStats: CartStats = { 
    totalItems: 0, 
    totalValue: 0, 
    averageItemPrice: 0, 
    totalPhotos: 0, 
    averagePrice: 0 
  };
  isLoading = false;
  showClearConfirmation = false;
  isUpdatingQuantity = false;
  lastAction = '';
  private cartSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements du panier
    this.cartSubscription = this.cartService.getCart().subscribe(
      (summary: CartSummary) => {
        this.cartSummary = summary;
        this.cartService.getCartStats().subscribe((stats: CartStats) => {
          this.cartStats = stats;
        });
      }
    );
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  // Augmenter la quantité d'un article
  increaseQuantity(item: CartItem): void {
    this.isUpdatingQuantity = true;
    this.cartService.updateQuantity(item.photoId, item.quantity + 1);
    this.lastAction = `Quantité augmentée pour ${item.photoId}`;
    setTimeout(() => {
      this.isUpdatingQuantity = false;
      this.lastAction = '';
    }, 1000);
  }

  // Diminuer la quantité d'un article
  decreaseQuantity(item: CartItem): void {
    this.isUpdatingQuantity = true;
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.photoId, item.quantity - 1);
      this.lastAction = `Quantité diminuée pour ${item.photoId}`;
    } else {
      this.removeItem(item);
      return;
    }
    setTimeout(() => {
      this.isUpdatingQuantity = false;
      this.lastAction = '';
    }, 1000);
  }

  // Mettre à jour la quantité directement
  updateQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value);
    
    if (isNaN(quantity) || quantity < 0) {
      input.value = item.quantity.toString();
      return;
    }
    
    this.isUpdatingQuantity = true;
    if (quantity === 0) {
      this.removeItem(item);
    } else {
      this.cartService.updateQuantity(item.photoId, quantity);
      this.lastAction = `Quantité mise à jour pour ${item.photoId}`;
    }
    
    setTimeout(() => {
      this.isUpdatingQuantity = false;
      this.lastAction = '';
    }, 1000);
  }

  // Retirer un article du panier
  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.photoId);
    this.lastAction = `Photo ${item.photoId} supprimée du panier`;
    setTimeout(() => this.lastAction = '', 3000);
  }

  // Retirer tous les articles d'un événement
  removeEventItems(eventId: string, eventName: string): void {
    this.cartService.removeEventItems(eventId);
    this.lastAction = `Toutes les photos de ${eventName} supprimées`;
    setTimeout(() => this.lastAction = '', 3000);
  }

  // Afficher la confirmation pour vider le panier
  showClearCartConfirmation(): void {
    this.showClearConfirmation = true;
  }

  // Annuler la confirmation
  cancelClearCart(): void {
    this.showClearConfirmation = false;
  }

  // Confirmer et vider le panier
  confirmClearCart(): void {
    this.cartService.clearCart();
    this.showClearConfirmation = false;
    this.lastAction = 'Panier vidé avec succès';
    setTimeout(() => this.lastAction = '', 3000);
  }

  // Continuer les achats
  continueShopping(): void {
    this.router.navigate(['/events']);
  }

  // Obtenir le temps depuis l'ajout d'un article
  getTimeAgo(addedAt: string): string {
    if (!addedAt) return '';
    
    const now = new Date();
    const addedDate = new Date(addedAt);
    const diffMs = now.getTime() - addedDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)} jour(s)`;
  }

  // Obtenir le temps depuis l'ajout d'un article (overloaded for Date type)
  getTimeAgoFromDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${Math.floor(diffHours / 24)} jour(s)`;
  }

  // Obtenir le nom de l'événement groupé
  getEventGroups(): { eventId: string; eventName: string; items: CartItem[]; subtotal: number }[] {
    const groups = new Map<string, CartItem[]>();
    
    this.cartSummary.items.forEach((item: CartItem) => {
      if (!groups.has(item.eventId)) {
        groups.set(item.eventId, []);
      }
      groups.get(item.eventId)!.push(item);
    });

    return Array.from(groups.entries()).map(([eventId, items]) => ({
      eventId,
      eventName: items[0].eventName,
      items,
      subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }));
  }

  // Vérifier si le panier est proche de l'expiration
  isCartExpiringSoon(): boolean {
    if (!this.cartStats.oldestItem) return false;
    
    const now = new Date();
    const expiryTime = 24 * 60 * 60 * 1000; // 24 heures
    const timeLeft = expiryTime - (now.getTime() - this.cartStats.oldestItem.getTime());
    
    return timeLeft < (2 * 60 * 60 * 1000); // Moins de 2 heures restantes
  }

  // Obtenir le temps restant avant expiration
  getTimeUntilExpiry(): string {
    if (!this.cartStats.oldestItem) return '';
    
    const now = new Date();
    const expiryTime = 24 * 60 * 60 * 1000; // 24 heures
    const timeLeft = expiryTime - (now.getTime() - this.cartStats.oldestItem.getTime());
    
    if (timeLeft <= 0) return 'Expiré';
    
    const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
    const minsLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minsLeft}min`;
    }
    return `${minsLeft}min`;
  }

  // Procéder au checkout
  proceedToCheckout(): void {
    if (this.cartSummary.items.length > 0) {
      this.router.navigate(['/checkout']); // CORRIGÉ: était '/client/checkout'
    }
  }

  // Formater le prix
  formatPrice(price: number): string {
    return price.toFixed(2);
  }
}
