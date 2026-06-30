import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { User, PageResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/v1/admin/users`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getAllUsers(page: number, size: number, status?: string): Observable<PageResponse<User>> {
    let params = new HttpParams()
      .set('page', (page - 1).toString())
      .set('size', size.toString());
      
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<PageResponse<User>>(this.apiUrl, {
      ...this.getAuthHeaders(),
      params
    });
  }

  lockUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/lock`, {}, this.getAuthHeaders());
  }

  unlockUser(id: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/${id}/unlock`, {}, this.getAuthHeaders());
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
