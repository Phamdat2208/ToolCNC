import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  username: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/auth';
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
          const userObj = {
            username: response.username,
            roles: response.role ? [response.role] : (response.roles || ['CUSTOMER'])
          };
          sessionStorage.setItem(this.TOKEN_KEY, response.token);
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(userObj));
          this.currentUserSubject.next(userObj);
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
        } else {
          // Fallback to decode if user object not in storage
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.currentUserSubject.next({
            username: payload.sub,
            roles: payload.role ? [payload.role] : (payload.roles || ['CUSTOMER'])
          });
        }
      } catch (e) {
        console.error("Invalid token format or user data storage", e);
        this.logout();
      }
    }
  }
}
