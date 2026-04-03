import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = `${environment.apiUrl}/api/v1/public/categories`;
  private adminUrl = `${environment.apiUrl}/api/v1/admin/categories`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post(this.adminUrl, category, this.getAuthHeaders());
  }

  updateCategory(id: number, category: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/${id}`, category, this.getAuthHeaders());
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.adminUrl}/${id}`, this.getAuthHeaders());
  }
}
