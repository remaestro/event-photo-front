import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Ignore certain requests that shouldn't show loading (like polling endpoints)
  const shouldShowLoading = !shouldIgnoreRequest(req);

  if (shouldShowLoading) {
    activeRequests++;
    if (activeRequests === 1) {
      loadingService.show();
    }
  }

  return next(req).pipe(
    finalize(() => {
      if (shouldShowLoading) {
        activeRequests--;
        if (activeRequests === 0) {
          loadingService.hide();
        }
      }
    })
  );
};

function shouldIgnoreRequest(req: any): boolean {
  // Don't show loading for these types of requests
  const ignoredEndpoints = [
    '/api/notifications',
    '/scan-status/',
    '/upload-status/',
    '/heartbeat',
    '/health'
  ];

  return ignoredEndpoints.some(endpoint => req.url.includes(endpoint)) ||
         req.headers.has('X-Skip-Loading');
}

// Keep the old class-based interceptor for backward compatibility but mark as deprecated
/** @deprecated Use loadingInterceptor function instead */
export class LoadingInterceptor {
  // ...existing code...
}