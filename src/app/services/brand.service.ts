import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Brand {
  id?: number;
  name: string;
  logoUrl?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1`;
  private authService = inject(AuthService);

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  // Public APIs
  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/public/brands`);
  }

  getBrandById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/public/brands/${id}`);
  }

  // Admin APIs
  adminGetBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/admin/brands`, this.getAuthHeaders());
  }

  createBrand(brand: Brand): Observable<Brand> {
    return this.http.post<Brand>(`${this.apiUrl}/admin/brands`, brand, this.getAuthHeaders());
  }

  updateBrand(id: number, brand: Brand): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/admin/brands/${id}`, brand, this.getAuthHeaders());
  }

  deleteBrand(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/brands/${id}`, this.getAuthHeaders());
  }
}
