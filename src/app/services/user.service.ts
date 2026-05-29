import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

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

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, this.getAuthHeaders());
  }

  lockUser(id: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/${id}/lock`, {}, this.getAuthHeaders());
  }

  unlockUser(id: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/${id}/unlock`, {}, this.getAuthHeaders());
  }

  deleteUser(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
