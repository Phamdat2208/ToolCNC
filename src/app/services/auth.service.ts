import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { ConfirmModalService } from '../shared/services/confirm-modal.service';

export interface User {
  username: string;
  roles: string[];
  fullName?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private confirmModal = inject(ConfirmModalService);
  private apiUrl = `${environment.apiUrl}/api/v1/auth`;
  private readonly TOKEN_KEY = 'tool_cnc_auth_token';
  private readonly USER_KEY = 'tool_cnc_user_data';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private eventSource: EventSource | null = null;

  constructor() {
    this.checkTokenAndSetUser();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          const userObj: User = {
            username: response.username,
            roles: response.role ? [response.role] : (response.roles || ['CUSTOMER'])
          };
          sessionStorage.setItem(this.TOKEN_KEY, response.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(userObj));
          this.currentUserSubject.next(userObj);
          
          this.startSessionCheck();

          // Sau khi login, fetch lại profile đầy đủ
          this.fetchMe().subscribe();
        }
      })
    );
  }

  fetchMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...user };
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  updateProfile(data: { fullName: string, phone: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, data).pipe(
      tap(res => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser = { ...currentUser, fullName: res.fullName, phone: res.phone };
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        next: () => this.clearLocalSession(),
        error: () => this.clearLocalSession()
      });
    } else {
      this.clearLocalSession();
    }
  }

  public clearLocalSession() {
    this.stopSessionCheck();
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
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
      
      this.confirmModal.confirm(
        {
          title: 'Thông báo đăng nhập',
          content: 'Tài khoản của bạn đã được đăng nhập ở một nơi khác. Bạn có muốn đăng nhập lại không?',
          okText: 'Đăng nhập lại',
          cancelText: 'Đóng',
          type: 'warning'
        },
        () => {
          this.router.navigate(['/login']);
        }
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
    return sessionStorage.getItem(this.TOKEN_KEY);
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
      const roleStr = typeof role === 'string' ? role.toUpperCase() : (role.authority ? role.authority.toUpperCase() : '');
      return roleStr === 'ADMIN' || roleStr === 'ROLE_ADMIN';
    });
  }

  private checkTokenAndSetUser() {
    const token = this.getToken();
    if (token) {
      try {
        const userStr = sessionStorage.getItem(this.USER_KEY);
        if (userStr) {
          this.currentUserSubject.next(JSON.parse(userStr));
          this.startSessionCheck();
          // Refresh data from server
          this.fetchMe().subscribe();
        } else {
          // Fallback to decode if user object not in storage
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userObj = {
            username: payload.sub,
            roles: payload.role ? [payload.role] : (payload.roles || ['CUSTOMER'])
          };
          this.currentUserSubject.next(userObj);
          this.startSessionCheck();
          this.fetchMe().subscribe();
        }
      } catch (e) {
        console.error("Invalid token format or user data storage", e);
        this.logout();
      }
    }
  }
}
