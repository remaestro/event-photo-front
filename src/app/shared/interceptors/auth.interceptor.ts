import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthDataService } from '../services/auth-data.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authDataService = inject(AuthDataService);
  const router = inject(Router);

  // Get the auth token from localStorage or sessionStorage
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  // Clone the request and add the authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid, try to refresh
        const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        
        if (refreshToken) {
          return authDataService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              if (response.success && response.token) {
                // Update tokens
                const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
                storage.setItem('auth_token', response.token);
                if (response.refreshToken) {
                  storage.setItem('refresh_token', response.refreshToken);
                }
                
                // Retry the original request with new token
                const newAuthReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.token}`
                  }
                });
                return next(newAuthReq);
              } else {
                // Refresh failed, logout user
                authService.logout();
                router.navigate(['/auth/login']);
                return throwError(() => error);
              }
            }),
            catchError(() => {
              // Refresh token also failed, logout user
              authService.logout();
              router.navigate(['/auth/login']);
              return throwError(() => error);
            })
          );
        } else {
          // No refresh token, logout user
          authService.logout();
          router.navigate(['/auth/login']);
        }
      } else if (error.status === 403) {
        // Forbidden - insufficient permissions
        router.navigate(['/unauthorized']);
      }
      
      return throwError(() => error);
    })
  );
};

// Keep the old class-based interceptor for backward compatibility but mark as deprecated
/** @deprecated Use authInterceptor function instead */
export class AuthInterceptor {
  // ...existing code...
}