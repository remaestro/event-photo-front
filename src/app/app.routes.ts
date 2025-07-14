import { Routes } from '@angular/router';
import { authGuard, adminGuard, organizerGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  // Pages publiques
  { path: '', loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent) },
  { path: 'events/search', loadComponent: () => import('./pages/events-search/events-search.component').then(c => c.EventsSearchComponent) },
  { path: 'events/:id/public', loadComponent: () => import('./pages/event-public/event-public.component').then(c => c.EventPublicComponent) },
  { path: 'scan/:eventId', loadComponent: () => import('./pages/scan/scan.component').then(c => c.ScanComponent) },
  { path: 'how-it-works', loadComponent: () => import('./pages/how-it-works/how-it-works.component').then(c => c.HowItWorksComponent) },
  
  // Authentification
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(c => c.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(c => c.RegisterComponent) },
  { path: 'role-selection', loadComponent: () => import('./auth/role-selection/role-selection.component').then(c => c.RoleSelectionComponent) },
  
  // Profil utilisateur - accessible à tous les utilisateurs connectés
  { 
    path: 'profile', 
    loadComponent: () => import('./shared/components/profile/profile.component').then(c => c.ProfileComponent),
    canActivate: [authGuard]
  },
  
  // Client routes (pour l'achat de photos) - protégées par authentification
  { 
    path: 'scan-results/:sessionId', 
    loadComponent: () => import('./client/scan-results/scan-results.component').then(c => c.ScanResultsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./client/cart/cart.component').then(c => c.CartComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./client/checkout/checkout.component').then(c => c.CheckoutComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'order-confirmation/:orderId', 
    loadComponent: () => import('./client/order-confirmation/order-confirmation.component').then(c => c.OrderConfirmationComponent),
    canActivate: [authGuard]
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
  { 
    path: 'organizer/photos', 
    loadComponent: () => import('./organizer/photos/photos.component').then(c => c.PhotosComponent),
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
  { path: 'events', redirectTo: '/events/search' },
  { path: 'photographer', redirectTo: '/organizer' },
  
  // Wildcard route - doit être en dernier
  { path: '**', redirectTo: '/404' }
];