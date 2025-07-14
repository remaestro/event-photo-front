import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur inattendue s\'est produite';
      let errorTitle = 'Erreur';

      // Handle different error status codes
      switch (error.status) {
        case 0:
          errorTitle = 'Erreur de connexion';
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
          break;
        case 400:
          errorTitle = 'Demande invalide';
          errorMessage = error.error?.message || 'Les données envoyées sont invalides.';
          break;
        case 401:
          errorTitle = 'Non autorisé';
          errorMessage = 'Votre session a expiré. Veuillez vous reconnecter.';
          break;
        case 403:
          errorTitle = 'Accès refusé';
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.';
          break;
        case 404:
          errorTitle = 'Ressource introuvable';
          errorMessage = 'La ressource demandée n\'existe pas.';
          break;
        case 409:
          errorTitle = 'Conflit';
          errorMessage = error.error?.message || 'Cette action entre en conflit avec l\'état actuel.';
          break;
        case 422:
          errorTitle = 'Données invalides';
          errorMessage = error.error?.message || 'Les données fournies ne sont pas valides.';
          break;
        case 429:
          errorTitle = 'Trop de requêtes';
          errorMessage = 'Vous effectuez trop de requêtes. Veuillez patienter un moment.';
          break;
        case 500:
          errorTitle = 'Erreur serveur';
          errorMessage = 'Une erreur interne du serveur s\'est produite. Veuillez réessayer plus tard.';
          break;
        case 502:
        case 503:
        case 504:
          errorTitle = 'Service indisponible';
          errorMessage = 'Le service est temporairement indisponible. Veuillez réessayer plus tard.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }

      // Log error for debugging (in development)
      if (!environment.production) {
        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          message: errorMessage,
          url: error.url,
          error: error.error
        });
      }

      // Show notification to user (except for 401 errors which are handled by auth interceptor)
      if (error.status !== 401) {
        notificationService.error(errorTitle, errorMessage);
      }

      return throwError(() => error);
    })
  );
};

// Keep the old class-based interceptor for backward compatibility but mark as deprecated
/** @deprecated Use errorInterceptor function instead */
export class ErrorInterceptor {
  // ...existing code...
}