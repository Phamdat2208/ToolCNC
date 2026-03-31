import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from './auth.service';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  private apiUrl = 'http://localhost:8080/api/v1/cart';
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private modal = inject(NzModalService);

  private getAuthHeaders() {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  constructor() {
    // When user logs in or out, refetch the cart automatically
    this.authService.currentUser$.pipe(
      distinctUntilChanged((prev, curr) => prev?.username === curr?.username)
    ).subscribe(user => {
      this.loadCart();
    });
  }

  loadCart() {
    if (!this.authService.isLoggedIn()) {
      this.cartItems.set([]);
      return;
    }
    this.http.get<any[]>(this.apiUrl, this.getAuthHeaders()).pipe(
      catchError(err => {
        console.error('Lỗi khi lấy giỏ hàng:', err);
        return of([]);
      })
    ).subscribe(backendItems => {
      if (backendItems) {
        // Chuyển đổi CartItem backend sang frontend shape
        const items: CartItem[] = backendItems.map(bItem => ({
          id: bItem.product.id, // Frontend dùng product.id làm id cho dễ mapping
          name: bItem.product.name,
          price: bItem.product.price,
          quantity: bItem.quantity,
          img: bItem.product.imageUrl || 'https://placehold.co/80x80?text=No+Image'
        }));
        this.cartItems.set(items);
      }
    });
  }

  get totalAmount() {
    return this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get totalItems() {
    return this.cartItems().reduce((sum, item) => sum + item.quantity, 0);
  }

  addToCart(product: any, quantity: number, mainImage: string): Observable<boolean> {
    if (!this.requireLogin('thêm sản phẩm vào giỏ hàng')) return of(false);

    const payload = {
      productId: product.id,
      quantity: quantity
    };

    return new Observable<boolean>(observer => {
      this.http.post(this.apiUrl, payload, this.getAuthHeaders()).subscribe({
        next: () => {
          this.loadCart();
          observer.next(true);
          observer.complete();
        },
        error: err => {
          console.error('Lỗi thêm giỏ hàng', err);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  removeItem(id: number) { // id in frontend refers to product.id
    if (!this.authService.isLoggedIn()) return;

    this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
      next: () => this.loadCart(),
      error: err => console.error('Lỗi xóa sản phẩm khỏi giỏ hàng', err)
    });
  }

  updateQuantity(id: number, quantity: number) {
    if (!this.authService.isLoggedIn()) return;

    const payload = {
      productId: id,
      quantity: quantity
    };

    this.http.put(`${this.apiUrl}/${id}`, payload, this.getAuthHeaders()).subscribe({
      next: () => this.loadCart(), // Cập nhật lại UI sau khi lưu state thành công
      error: err => console.error('Lỗi cập nhật số lượng', err)
    });
  }

  clearCart() {
    if (!this.authService.isLoggedIn()) {
      this.cartItems.set([]);
      return;
    }

    this.http.delete(`${this.apiUrl}/clear`, this.getAuthHeaders()).subscribe({
      next: () => this.cartItems.set([]),
      error: err => console.error('Lỗi khi xóa toàn bộ giỏ hàng', err)
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
}
