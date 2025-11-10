import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { CartService, CartSummary } from '../../services/cart.service';
import { ResponsiveService } from '../../services/responsive.service';
import { AccessibilityService } from '../../services/accessibility.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isUserLoggedIn = false;
  currentUser: User | null = null;
  userRole: 'Organizer' | 'Admin' | 'Client' | null = null;  // 🆕 Ajout du rôle Client
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
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private cartService: CartService,
    private router: Router,
    private responsiveService: ResponsiveService,
    private accessibilityService: AccessibilityService
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'état d'authentification
    this.authService.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
      this.isUserLoggedIn = isAuthenticated;
      
      if (isAuthenticated) {
        this.currentUser = this.authService.getCurrentUser();
        this.userRole = this.authService.getUserRole();
      } else {
        this.currentUser = null;
        this.userRole = null;
      }
    });

    // S'abonner aux changements d'utilisateur actuel
    this.authService.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.currentUser = user;
      this.userRole = user ? user.role : null;
    });

    // S'abonner aux changements du panier
    this.cartService.getCart().pipe(
      takeUntil(this.destroy$)
    ).subscribe(summary => {
      this.cartSummary = summary;
    });

    // Subscribe to viewport changes for responsive behavior
    this.responsiveService.viewport$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewport => {
        // Auto-close mobile menu on viewport change
        if (!viewport.isMobile && this.isMenuOpen) {
          this.closeMenu();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Enhanced menu toggle with accessibility announcements
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    
    // Announce menu state for screen readers
    this.accessibilityService.announce(
      this.isMenuOpen ? 'Menu principal ouvert' : 'Menu principal fermé'
    );
    
    // Manage focus for accessibility
    if (this.isMenuOpen) {
      // Focus management will be handled by the accessibility service
      setTimeout(() => {
        const firstMenuItem = document.querySelector('#mobile-menu a') as HTMLElement;
        if (firstMenuItem) {
          this.accessibilityService.setFocus(firstMenuItem);
        }
      }, 100);
    }
  }

  /**
   * Enhanced close menu with proper focus restoration
   */
  closeMenu(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.accessibilityService.announce('Menu principal fermé');
    }
  }

  /**
   * Déconnexion de l'utilisateur - critère US-002
   */
  logout(): void {
    const userName = this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : 'utilisateur';
    
    // Fermer le menu d'abord
    this.closeMenu();
    
    // Effectuer la déconnexion
    this.authService.logout();
    
    // Afficher notification de déconnexion
    this.notificationService.info(
      'Déconnexion réussie',
      `Au revoir ${userName} ! À bientôt sur EventPhoto.`
    );
    
    // Rediriger vers la page d'accueil
    this.router.navigate(['/']);
  }

  /**
   * Obtenir le nom d'affichage de l'utilisateur
   */
  getUserDisplayName(): string {
    return this.currentUser ? `${this.currentUser.firstName} ${this.currentUser.lastName}` : '';
  }

  /**
   * Obtenir le nom du rôle pour affichage
   */
  getRoleDisplayName(): string {
    switch (this.userRole) {
      case 'Admin':
        return 'Administrateur';
      case 'Organizer':
        return 'Organisateur';
      default:
        return '';
    }
  }

  /**
   * Vérifier si l'utilisateur a accès aux fonctionnalités client (panier, achats)
   */
  hasClientAccess(): boolean {
    return this.isUserLoggedIn; // Tous les utilisateurs connectés peuvent acheter
  }

  /**
   * Naviguer vers le dashboard approprié selon le rôle
   */
  goToDashboard(): void {
    this.closeMenu();
    
    if (this.userRole === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.userRole === 'Organizer') {
      this.router.navigate(['/organizer/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  /**
   * Naviguer vers le panier
   */
  goToCart(): void {
    this.closeMenu();
    this.router.navigate(['/cart']);
  }

  /**
   * Formater le prix pour affichage
   */
  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  /**
   * Vérifier si le panier a des articles
   */
  hasCartItems(): boolean {
    return this.cartSummary.totalItems > 0;
  }

  /**
   * Check if device has touch capabilities
   */
  isTouchDevice(): boolean {
    return this.responsiveService.isTouchDevice();
  }

  /**
   * Check if current device is mobile
   */
  isMobile(): boolean {
    return this.responsiveService.isMobile();
  }

  /**
   * Get optimal cart display for current viewport
   */
  getCartDisplayMode(): 'icon' | 'text' | 'both' {
    if (this.responsiveService.isMobile()) {
      return 'icon';
    } else if (this.responsiveService.isTablet()) {
      return 'both';
    } else {
      return 'text';
    }
  }
}