import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:8080/api/v1/wishlist';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private _items = signal<any[]>([]);

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  constructor() {
    // Listen to user changes to reload the correct wishlist from backend
    this.authService.currentUser$.pipe(
      distinctUntilChanged((prev, curr) => prev?.username === curr?.username)
    ).subscribe(() => {
      this.loadWishlist();
    });
  }

  private modal = inject(NzModalService);
  private router = inject(Router);

  loadWishlist() {
    if (!this.authService.isLoggedIn()) {
      this._items.set([]);
      return;
    }
    this.http.get<any[]>(this.apiUrl, this.getAuthHeaders()).pipe(
      catchError(err => {
        console.error('Lỗi khi lấy danh sách yêu thích:', err);
        return of([]);
      })
    ).subscribe(backendItems => {
      if (backendItems) {
        // Map backend response (WishlistItem containing a Product) to frontend product array
        const products = backendItems.map(item => ({
          ...item.product,
          img: item.product.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(item.product.name)}`
        }));
        this._items.set(products);
      }
    });
  }

  isWishlisted(productId: number): boolean {
    return this._items().some(p => p.id === productId);
  }

  toggle(product: any): Observable<boolean | null> {
    if (!this.requireLogin('thêm sản phẩm vào danh sách yêu thích')) {
      return of(null);
    }

    return new Observable<boolean>(observer => {
      this.http.post<any>(`${this.apiUrl}/${product.id}`, {}, this.getAuthHeaders()).subscribe({
        next: (res) => {
          this.loadWishlist(); // Reload state from server
          observer.next(res.added); // API returns {added: boolean}
          observer.complete();
        },
        error: (err) => {
          console.error('Lỗi khi toggle wishlist:', err);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  private requireLogin(actionContent: string): boolean {
    if (!this.authService.isLoggedIn()) {
      this.modal.confirm({
        nzTitle: 'Yêu cầu đăng nhập',
        nzContent: `Bạn cần đăng nhập để ${actionContent}. Chuyển đến trang đăng nhập?`,
        nzOkText: 'Đăng nhập',
        nzCancelText: 'Đóng',
        nzOnOk: () => this.router.navigate(['/login'])
      });
      return false;
    }
    return true;
  }

  remove(productId: number) {
    if (!this.authService.isLoggedIn()) return;

    this.http.delete(`${this.apiUrl}/${productId}`, this.getAuthHeaders()).subscribe({
      next: () => this.loadWishlist(),
      error: err => console.error('Lỗi khi xóa khỏi wishlist', err)
    });
  }

  clear() {
    if (!this.authService.isLoggedIn()) {
      this._items.set([]);
      return;
    }

    this.http.delete(`${this.apiUrl}/clear`, this.getAuthHeaders()).subscribe({
      next: () => this._items.set([]),
      error: err => console.error('Lỗi khi xóa sạch wishlist', err)
    });
  }
}
