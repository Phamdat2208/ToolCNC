import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/v1/orders`;

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getMyOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-orders`, this.getAuthHeaders());
  }

  getAllOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`, this.getAuthHeaders());
  }

  updateOrderStatus(orderId: number, status: string, cancelReason?: string): Observable<any> {
    const payload: any = { status };
    if (cancelReason) {
      payload.cancelReason = cancelReason;
    }
    return this.http.put<any>(`${this.apiUrl}/${orderId}/status`, payload, this.getAuthHeaders());
  }

  cancelOrder(orderId: number, cancelReason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${orderId}/cancel`, { cancelReason }, this.getAuthHeaders());
  }

  createOrder(orderPayload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, orderPayload, this.getAuthHeaders());
  }

  trackOrder(trackingNumber: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/track/${trackingNumber}`, this.getAuthHeaders());
  }
}
