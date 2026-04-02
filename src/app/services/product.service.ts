import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/v1/public/products`;
  private adminApiUrl = `${environment.apiUrl}/api/v1/admin/products`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getProducts(page: number = 0, size: number = 12, sort?: string, keyword?: string, category?: string, minPrice?: number, maxPrice?: number, brand?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (sort) {
      if (sort === 'Giá: Thấp đến Cao') {
        params = params.set('sort', 'price,asc');
      } else if (sort === 'Giá: Cao đến Thấp') {
        params = params.set('sort', 'price,desc');
      }
    }

    if (keyword) params = params.set('keyword', keyword);
    if (category) params = params.set('category', category);
    if (minPrice !== undefined && minPrice > 0) params = params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined && maxPrice < 2000000000) params = params.set('maxPrice', maxPrice.toString());
    if (brand) params = params.set('brand', brand);

    return this.http.get<any>(this.apiUrl, { params });
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  createProduct(product: any): Observable<any> {
    return this.http.post<any>(this.adminApiUrl, product, this.getAuthHeaders());
  }

  updateProduct(id: number, product: any): Observable<any> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}`, product, this.getAuthHeaders());
  }

  createProductsBulk(products: any[]): Observable<any> {
    return this.http.post<any>(`${this.adminApiUrl}/bulk`, products, this.getAuthHeaders());
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete<any>(`${this.adminApiUrl}/${id}`, this.getAuthHeaders());
  }
}
