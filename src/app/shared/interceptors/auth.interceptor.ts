import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ConfirmModalService } from '../services/confirm-modal.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const confirmModalService = inject(ConfirmModalService);
  const injector = inject(Injector);

  const token = sessionStorage.getItem('tool_cnc_auth_token');
  
  // Clone the request to add the new header
  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Bỏ qua logic 401 cho endpoint /login
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        const authService = injector.get(AuthService);
        authService.clearLocalSession();
        confirmModalService.confirm({
          title: 'Phiên đăng nhập hết hạn',
          content: 'Tài khoản của bạn đã được đăng nhập ở một nơi khác. Vui lòng đăng nhập lại.',
          okText: 'Đồng ý'
        }, () => {
          router.navigate(['/login']);
        });
      }
      return throwError(() => error);
    })
  );
};
