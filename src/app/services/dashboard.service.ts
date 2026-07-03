import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface RecentOrder {
  id: number;
  orderTrackingNumber: string;
  customerName: string;
  dateCreated: string;
  amount: number;
  status: string;
}

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  activeUsers: number;
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/v1/admin/dashboard`;

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`, this.getAuthHeaders());
  }
}
