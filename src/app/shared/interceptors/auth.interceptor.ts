import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { StorageSecurityService } from '../../services/storage-security.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const modalService = inject(ModalService);
  const injector = inject(Injector);
  const storage = inject(StorageSecurityService);

  // Decrypt the token before attaching to the request header
  const token = storage.getItem('tool_cnc_auth_token');

  // Clone the request to add the new header
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip 401 cho /auth/login và /auth/refresh - tokenRefreshInterceptor sẽ xử lý refresh
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        const authService = injector.get(AuthService);
        authService.clearLocalSession();
        modalService.confirm({
          title: 'Phiên đăng nhập không hợp lệ',
          content: 'Phiên đăng nhập của bạn đã hết hạn hoặc không còn hợp lệ. Vui lòng đăng nhập lại.',
          okText: 'Đồng ý'
        }, () => {
          router.navigate(['/login']);
        });
      }
      return throwError(() => error);
    })
  );
};
