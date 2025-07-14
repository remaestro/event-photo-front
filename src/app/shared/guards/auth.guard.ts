import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    notificationService.warning(
      'Accès restreint',
      'Vous devez être connecté pour accéder à cette page'
    );
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Vérifier si la session est encore valide (24h)
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.lastLoginAt) {
    const now = new Date();
    const lastLogin = new Date(currentUser.lastLoginAt);
    const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin > 24) {
      notificationService.warning(
        'Session expirée',
        'Votre session a expiré. Veuillez vous reconnecter.'
      );
      authService.logout();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }

  return true;
};

/**
 * Guard pour vérifier le rôle administrateur
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // D'abord vérifier l'authentification
  if (!authGuard(route, state)) {
    return false;
  }

  // Vérifier le rôle admin
  const userRole = authService.getUserRole();
  if (userRole !== 'Admin') {
    notificationService.error(
      'Accès interdit',
      'Vous n\'avez pas les permissions pour accéder à cette zone administrateur'
    );
    router.navigate(['/403']);
    return false;
  }

  return true;
};

/**
 * Guard pour vérifier le rôle organisateur (ou admin)
 */
export const organizerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  // D'abord vérifier l'authentification
  if (!authGuard(route, state)) {
    return false;
  }

  // Vérifier le rôle organisateur ou admin
  const userRole = authService.getUserRole();
  if (userRole !== 'Organizer' && userRole !== 'Admin') {
    notificationService.error(
      'Accès interdit',
      'Vous n\'avez pas les permissions pour accéder à cette zone'
    );
    router.navigate(['/403']);
    return false;
  }

  return true;
};
