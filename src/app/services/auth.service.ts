import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { ModalService } from './modal.service';
import { StorageSecurityService } from './storage-security.service';
import { TokenRefreshCoordinatorService } from './token-refresh-coordinator.service';

export interface User {
  username: string;
  roles: string[];
  fullName?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private modalService = inject(ModalService);
  private storageSecurityService = inject(StorageSecurityService);
  private coordinator = inject(TokenRefreshCoordinatorService);
  private apiUrl = `${environment.apiUrl}/api/v1/auth`;
  private readonly TOKEN_KEY = 'tool_cnc_auth_token';
  private readonly USER_KEY = 'tool_cnc_user_data';
  /** Gửi/nhận HTTP-only refresh_token cookie qua proxy same-origin */
  private readonly authCookieOptions = { withCredentials: true };

  // Gọi refresh sớm hơn 1 phút so với thời điểm access token thực sự hết hạn,
  // để có đủ thời gian xử lý round-trip trước khi token thật sự chết.
  private readonly REFRESH_BUFFER_MS = 60 * 1000;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private eventSource: EventSource | null = null;
  private tokenExpirationTimeout: number | null = null;

  constructor() {
    this.checkTokenAndSetUser();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials, this.authCookieOptions).pipe(
      tap((response) => {
        if (response && response.token) {
          const userObj: User = {
            username: response.username,
            roles: response.role
              ? [response.role]
              : response.roles || ['CUSTOMER'],
          };
          this.storageSecurityService.setItem(this.TOKEN_KEY, response.token);
          this.storageSecurityService.setItem(
            this.USER_KEY,
            JSON.stringify(userObj),
          );
          this.currentUserSubject.next(userObj);

          this.startSessionCheck();
          this.scheduleTokenRefresh();

          // Sau khi login, fetch lại profile đầy đủ
          this.fetchMe().subscribe();
        }
      }),
    );
  }

  fetchMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...user };
          this.storageSecurityService.setItem(
            this.USER_KEY,
            JSON.stringify(updatedUser),
          );
          this.currentUserSubject.next(updatedUser);
        }
      }),
    );
  }

  updateProfile(data: { fullName: string; phone: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data).pipe(
      tap((res) => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            fullName: res.fullName,
            phone: res.phone,
          };
          this.storageSecurityService.setItem(
            this.USER_KEY,
            JSON.stringify(updatedUser),
          );
          this.currentUserSubject.next(updatedUser);
        }
      }),
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}, this.authCookieOptions).subscribe({
        next: () => this.clearLocalSession(),
        error: () => this.clearLocalSession(),
      });
    } else {
      this.clearLocalSession();
    }
  }

  public clearLocalSession() {
    console.log('clearLocalSession');
    this.clearAutoLogoutTimer();
    this.stopSessionCheck();
    this.storageSecurityService.removeItem(this.TOKEN_KEY);
    this.storageSecurityService.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  private handleExpiredToken() {
    this.clearLocalSession();
    this.modalService.confirm(
      {
        title: 'Phiên đăng nhập hết hạn',
        content:
          'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
        okText: 'Đăng nhập lại',
        cancelText: 'Đóng',
        type: 'warning',
      },
      () => {
        this.router.navigate(['/login']);
      },
    );
  }

  private clearAutoLogoutTimer() {
    if (this.tokenExpirationTimeout !== null) {
      console.log('tokenExpirationTimeout', this.tokenExpirationTimeout);
      window.clearTimeout(this.tokenExpirationTimeout);
      this.tokenExpirationTimeout = null;
    }
  }

  private getTokenExpirationDate(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp) return null;
      return payload.exp * 1000;
    } catch {
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    const expirationDate = this.getTokenExpirationDate(token);
    return expirationDate === null || Date.now() >= expirationDate;
  }

  /**
   * Thay thế cho scheduleAutoLogout() cũ.
   * Thay vì đợi token hết hạn rồi logout ngay, service này sẽ chủ động
   * gọi /auth/refresh NGẦM một khoảng thời gian (REFRESH_BUFFER_MS) trước
   * khi access token thực sự hết hạn. Chỉ khi refresh thất bại thật sự
   * (refresh token cũng đã hết hạn/bị revoke) mới tiến hành logout.
   */
  private scheduleTokenRefresh() {
    this.clearAutoLogoutTimer();
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return;
    }

    const expirationDate = this.getTokenExpirationDate(token);
    if (!expirationDate) {
      return;
    }

    const refreshAt = expirationDate - this.REFRESH_BUFFER_MS;
    const timeout = refreshAt - Date.now();

    if (timeout <= 0) {
      // Đã tới hoặc quá gần thời điểm cần refresh -> thực hiện ngay
      this.performSilentRefresh();
      return;
    }

    this.tokenExpirationTimeout = window.setTimeout(() => {
      this.performSilentRefresh();
    }, timeout);
  }

  /**
   * Gọi refresh ngầm, không đợi có request nào bị 401.
   * Dùng chung TokenRefreshCoordinatorService với interceptor để đảm bảo
   * không có 2 request /auth/refresh chạy song song.
   */
  private performSilentRefresh() {
    if (!this.coordinator.tryAcquireLock()) {
      // Nơi khác (interceptor) đang refresh rồi -> chờ kết quả đó
      this.coordinator.waitForResult().subscribe({
        next: (newToken) => {
          this.storageSecurityService.setItem(this.TOKEN_KEY, newToken);
          this.scheduleTokenRefresh();
        },
        error: () => this.handleExpiredToken(),
      });
      return;
    }

    this.http
      .post<any>(`${this.apiUrl}/refresh`, {}, this.authCookieOptions)
      .subscribe({
        next: (response) => {
          if (response && response.token) {
            this.storageSecurityService.setItem(this.TOKEN_KEY, response.token);
            this.coordinator.resolveSuccess(response.token);
            // Đặt lại timer cho access token mới vừa nhận được
            this.scheduleTokenRefresh();
          } else {
            this.coordinator.resolveFailure();
            this.handleExpiredToken();
          }
        },
        error: () => {
          // Refresh token (cookie) cũng đã hết hạn hoặc bị revoke -> logout thật sự
          this.coordinator.resolveFailure();
          this.handleExpiredToken();
        },
      });
  }

  private startSessionCheck() {
    this.stopSessionCheck();

    const token = this.getToken();
    if (!token) return;

    // Sử dụng SSE để nhận thông báo Kick-out ngay lập tức từ server
    this.eventSource = new EventSource(`${this.apiUrl}/stream?token=${token}`);

    this.eventSource.addEventListener('logout', (event: any) => {
      console.log('SSE Logout event received:', event.data);
      this.clearLocalSession();

      this.modalService.confirm(
        {
          title: 'Thông báo đăng nhập',
          content:
            'Tài khoản của bạn đã được đăng nhập ở một nơi khác. Bạn có muốn đăng nhập lại không?',
          okText: 'Đăng nhập lại',
          cancelText: 'Đóng',
          type: 'warning',
        },
        () => {
          this.router.navigate(['/login']);
        },
      );
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.stopSessionCheck();
      // Thử kết nối lại sau 5 giây nếu vẫn còn logged in
      if (this.isLoggedIn()) {
        setTimeout(() => this.startSessionCheck(), 5000);
      }
    };
  }

  private stopSessionCheck() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public getToken(): string | null {
    return this.storageSecurityService.getItem(this.TOKEN_KEY);
  }

  public isLoggedIn(): boolean {
    return !!this.getToken();
  }

  public isAdmin(): boolean {
    const user = this.currentUserValue;
    if (!user || (!user.roles && !(user as any).role)) return false;

    const roles: any = user.roles || (user as any).role || [];
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    return rolesArray.some((role: any) => {
      const roleStr =
        typeof role === 'string'
          ? role.toUpperCase()
          : role.authority
            ? role.authority.toUpperCase()
            : '';
      return roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN';
    });
  }

  private checkTokenAndSetUser() {
    const token = this.getToken();
    if (token) {
      try {
        const userStr = this.storageSecurityService.getItem(this.USER_KEY);
        if (userStr) {
          this.currentUserSubject.next(JSON.parse(userStr));
          this.startSessionCheck();
          this.scheduleTokenRefresh();
          // Refresh data from server
          this.fetchMe().subscribe({
            error: () => {
              // Nếu /me thất bại (ví dụ access token đã chết và refresh
              // cookie cũng không còn hợp lệ), scheduleTokenRefresh() ở trên
              // sẽ tự xử lý logout khi tới lượt refresh; nhưng nếu request
              // này fail ngay lập tức (401) thì để interceptor xử lý retry/refresh.
            },
          });
        } else {
          // Fallback to decode if user object not in storage
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userObj = {
            username: payload.sub,
            roles: payload.role
              ? [payload.role]
              : payload.roles || ['CUSTOMER'],
          };
          this.currentUserSubject.next(userObj);
          this.startSessionCheck();
          this.scheduleTokenRefresh();
          this.fetchMe().subscribe({ error: () => {} });
        }
      } catch (e) {
        console.error('Invalid token format or user data storage', e);
        this.logout();
      }
    }
  }
}
