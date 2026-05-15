import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { QuotationRequest, QuotationResponse } from '../models/quotation.model';

@Injectable({ providedIn: 'root' })
export class QuotationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/v1/public/quotations`;
  private adminApiUrl = `${environment.apiUrl}/api/v1/admin/quotations`;

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  submitQuotation(request: QuotationRequest): Observable<QuotationResponse> {
    return this.http.post<QuotationResponse>(this.apiUrl, request);
  }

  getAdminQuotations(page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(this.adminApiUrl, { params, ...this.getAuthHeaders() });
  }

  getMyQuotations(): Observable<QuotationResponse[]> {
    return this.http.get<QuotationResponse[]>(`${environment.apiUrl}/api/v1/quotations/my`, this.getAuthHeaders());
  }

  updateQuotationStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.adminApiUrl}/${id}/status`, { status }, this.getAuthHeaders());
  }
}
