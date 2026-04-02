import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Province {
  code: number;
  name: string;
}

export interface Ward {
  code: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/api/v1/locations`;

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getProvinces(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.apiUrl}/provinces`, this.getAuthHeaders());
  }

  getWards(provinceCode: number): Observable<Ward[]> {
    return this.http.get<Ward[]>(`${this.apiUrl}/wards?provinceCode=${provinceCode}`, this.getAuthHeaders());
  }
}
