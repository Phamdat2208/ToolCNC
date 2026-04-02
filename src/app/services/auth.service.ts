import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/api/v1/auth`;
  private readonly TOKEN_KEY = 'tool_cnc_auth_token';
  private readonly USER_KEY = 'tool_cnc_user_data';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

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
          
          // Sau khi login, fetch lại profile đầy đủ
          this.fetchMe().subscribe();
        }
      })
    );
  }

  fetchMe(): Observable<any> {
    const token = this.getToken();
    return this.http.get<any>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
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
    const token = this.getToken();
    return this.http.put<any>(`${this.apiUrl}/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
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
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
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
          this.fetchMe().subscribe();
        }
      } catch (e) {
        console.error("Invalid token format or user data storage", e);
        this.logout();
      }
    }
  }
}
