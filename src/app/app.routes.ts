import { Routes } from '@angular/router';
import { authGuard, adminGuard, organizerGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  // Pages publiques
  { path: '', loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent) },
  { path: 'events/:id/public', loadComponent: () => import('./pages/event-public/event-public.component').then(c => c.EventPublicComponent) },
  { path: 'scan/:eventId', loadComponent: () => import('./pages/scan/scan.component').then(c => c.ScanComponent) },
  { path: 'how-it-works', loadComponent: () => import('./pages/how-it-works/how-it-works.component').then(c => c.HowItWorksComponent) },
  
  // Accès aux événements et photos - ACCESSIBLE SANS CONNEXION
  { 
    path: 'event-access', 
    loadComponent: () => import('./client/event-access/event-access.component').then(c => c.EventAccessComponent)
  },
  // 🆕 Route pour l'auto-inscription des invités via QR code
  { 
    path: 'guest/register/:eventId', 
    loadComponent: () => import('./guest/register/register.component').then(c => c.RegisterComponent)
  },
  { 
    path: 'scan-results/:sessionId', 
    loadComponent: () => import('./client/scan-results/scan-results.component').then(c => c.ScanResultsComponent)
  },
  { 
    path: 'event/:eventCode/photos', 
    loadComponent: () => import('./client/scan-results/scan-results.component').then(c => c.ScanResultsComponent)
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./client/cart/cart.component').then(c => c.CartComponent)
  },
  
  // Authentification
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(c => c.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(c => c.RegisterComponent) },
  { path: 'role-selection', loadComponent: () => import('./auth/role-selection/role-selection.component').then(c => c.RoleSelectionComponent) },
  
  // Pages de paiement Wave
  { 
    path: 'payment-success', 
    loadComponent: () => import('./pages/payment-success.component').then(c => c.PaymentSuccessComponent)
  },
  { 
    path: 'payment-cancel', 
    loadComponent: () => import('./pages/payment-cancel.component').then(c => c.PaymentCancelComponent)
  },
  
  // Profil utilisateur - accessible à tous les utilisateurs connectés
  { 
    path: 'profile', 
    loadComponent: () => import('./shared/components/profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [authGuard]
  },
  
  // Page unifiée "Mes Photos" - accessible à tous les utilisateurs connectés
  { 
    path: 'my-photos', 
    loadComponent: () => import('./shared/pages/my-photos/my-photos.component').then(c => c.MyPhotosComponent),
    canActivate: [authGuard]
  },

  // Client routes - checkout accessible sans authentification
  { 
    path: 'checkout', 
    loadComponent: () => import('./client/checkout/checkout.component').then(c => c.CheckoutComponent)
    // Retrait de canActivate: [authGuard] pour permettre l'accès anonyme
  },
  // NOUVEAU: Route Wave Status
  { 
    path: 'client/wave-status', 
    loadComponent: () => import('./client/wave-status/wave-status.component').then(c => c.WaveStatusComponent)
  },
  { 
    path: 'order-confirmation/:orderId', 
    loadComponent: () => import('./client/order-confirmation/order-confirmation.component').then(c => c.OrderConfirmationComponent)
    // Retrait de canActivate: [authGuard] pour permettre l'accès anonyme après achat
  },
  { 
    path: 'my-purchases', 
    loadComponent: () => import('./client/my-purchases/my-purchases.component').then(c => c.MyPurchasesComponent),
    canActivate: [authGuard]
  },
  
  // Organisateur routes - protégées par organizerGuard
  { 
    path: 'organizer/dashboard', 
    loadComponent: () => import('./organizer/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/events', 
    loadComponent: () => import('./organizer/events/events.component').then(c => c.EventsComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/events/create', 
    loadComponent: () => import('./organizer/events/create-event/create-event.component').then(c => c.CreateEventComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/events/:id/manage', 
    loadComponent: () => import('./organizer/events/manage-event/manage-event.component').then(c => c.ManageEventComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/events/:id/upload', 
    loadComponent: () => import('./organizer/events/upload-photos/upload-photos.component').then(c => c.UploadPhotosComponent),
    canActivate: [organizerGuard]
  },
  // 🆕 Route pour la gestion de la liste d'invités
  { 
    path: 'organizer/events/:eventId/guest-list', 
    loadComponent: () => import('./organizer/guest-list/guest-list.component').then(c => c.GuestListComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/photos', 
    loadComponent: () => import('./organizer/photos/photos.component').then(c => c.PhotosComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/events/:id/beneficiaries', 
    loadComponent: () => import('./organizer/beneficiaries/beneficiaries.component').then(c => c.BeneficiariesComponent),
    canActivate: [organizerGuard]
  },
  { 
    path: 'organizer/beneficiaries', 
    loadComponent: () => import('./organizer/beneficiaries/beneficiaries.component').then(c => c.BeneficiariesComponent),
    canActivate: [organizerGuard]
  },
  
  // Admin routes - protégées par adminGuard
  { 
    path: 'admin/dashboard', 
    loadComponent: () => import('./admin/dashboard/dashboard.component').then(c => c.DashboardComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/events', 
    loadComponent: () => import('./admin/events/events.component').then(c => c.EventsComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/events/:id/edit', 
    loadComponent: () => import('./admin/events/edit-event/edit-event.component').then(c => c.EditEventComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/users', 
    loadComponent: () => import('./admin/users/users.component').then(c => c.UsersComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/moderation', 
    loadComponent: () => import('./admin/moderation/moderation.component').then(c => c.ModerationComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/statistics', 
    loadComponent: () => import('./admin/statistics/statistics.component').then(c => c.StatisticsComponent),
    canActivate: [adminGuard]
  },
  { 
    path: 'admin/settings', 
    loadComponent: () => import('./admin/settings/settings.component').then(c => c.SettingsComponent),
    canActivate: [adminGuard]
  },
  
  // Support et légal
  { path: 'support', loadComponent: () => import('./pages/support/support.component').then(c => c.SupportComponent) },
  { path: 'terms', loadComponent: () => import('./pages/terms/terms.component').then(c => c.TermsComponent) },
  { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy.component').then(c => c.PrivacyComponent) },
  { path: 'cookies', loadComponent: () => import('./pages/cookies/cookies.component').then(c => c.CookiesComponent) },
  
  // Pages d'erreur
  { path: '403', loadComponent: () => import('./pages/forbidden/forbidden.component').then(c => c.ForbiddenComponent) },
  { path: '404', loadComponent: () => import('./pages/not-found/not-found.component').then(c => c.NotFoundComponent) },
  { path: 'error', loadComponent: () => import('./pages/error/error.component').then(c => c.ErrorComponent) },
  { path: 'maintenance', loadComponent: () => import('./pages/maintenance/maintenance.component').then(c => c.MaintenanceComponent) },
  
  // Redirections pour compatibilité
  { path: 'photographer', redirectTo: '/organizer' },
  
  // Wildcard route - doit être en dernier
  { path: '**', redirectTo: '/404' }
];