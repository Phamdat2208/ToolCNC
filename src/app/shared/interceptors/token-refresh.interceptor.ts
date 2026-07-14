import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, catchError, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { StorageSecurityService } from '../../services/storage-security.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);
const TOKEN_KEY = 'tool_cnc_auth_token';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const storageSecurityService = inject(StorageSecurityService);

  // Skip refresh for auth endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return handle401Error(req, next, router, storageSecurityService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  router: Router,
  storageSecurityService: StorageSecurityService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return performRefresh().pipe(
      switchMap(data => {
        const newToken = data.token;
        storageSecurityService.setItem(TOKEN_KEY, newToken);
        refreshTokenSubject.next(newToken);
        isRefreshing = false;
        return next(cloneRequestWithToken(request, newToken));
      }),
      catchError(error => {
        refreshTokenSubject.next('FAILED');
        isRefreshing = false;
        storageSecurityService.removeItem(TOKEN_KEY);
        storageSecurityService.removeItem('tool_cnc_user_data');
        router.navigate(['/login']);
        return throwError(() => error);
      })
    );
  }

  // Already refreshing, wait for new token
  return refreshTokenSubject.pipe(
    filter(token => token !== null && token !== 'FAILED'),
    take(1),
    switchMap(token => next(cloneRequestWithToken(request, token!)))
  );
}

function performRefresh(): Observable<{ token: string }> {
  return new Observable<{ token: string }>(observer => {
    fetch(`${environment.apiUrl}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    }).then(response => {
      if (!response.ok) {
        throw new Error('Refresh failed');
      }
      return response.json();
    }).then(data => {
      observer.next(data);
      observer.complete();
    }).catch(error => {
      observer.error(error);
    });
  });
}

function cloneRequestWithToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
