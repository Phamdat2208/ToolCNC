import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ConfirmModalService } from '../shared/services/confirm-modal.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface CartItem {
  id: number; // This is the CartItem ID from backend
  productId: number;
  name: string;
  price: number;
  quantity: number;
  img: string;
  variantId?: number;
  variantName?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal<CartItem[]>([]);

  private apiUrl = `${environment.apiUrl}/api/v1/cart`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private confirmModalService = inject(ConfirmModalService);

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
        const itemsList = Array.isArray(backendItems) ? backendItems : [];
        const items: CartItem[] = itemsList.map(bItem => ({
          id: bItem.id, // Now it's the actual CartItem ID
          productId: bItem.product.id,
          name: bItem.product.name,
          price: bItem.variant ? bItem.variant.price : bItem.product.price,
          quantity: bItem.quantity,
          img: bItem.product.imageUrl || 'https://placehold.co/80x80?text=No+Image',
          variantId: bItem.variant?.id,
          variantName: bItem.variant?.variantName,
          isActive: bItem.product.isActive
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
      variantId: product.variantId || null,
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

  removeItem(id: number): Observable<any> { // id is CartItem ID
    if (!this.authService.isLoggedIn()) return of(null);

    return new Observable<any>(observer => {
      this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders()).subscribe({
        next: (res) => {
          // Update local state IMMEDIATELY after success response
          this.cartItems.update(items => items.filter(item => item.id !== id));
          
          // Then sync with server if needed
          this.loadCart();
          
          observer.next(res);
          observer.complete();
        },
        error: err => {
          console.error('Lỗi xóa sản phẩm khỏi giỏ hàng', err);
          observer.error(err);
        }
      });
    });
  }

  updateQuantity(id: number, productId: number, variantId: number | undefined, quantity: number): Observable<any> { // id is CartItem ID
    if (!this.authService.isLoggedIn()) return of(null);

    const payload = {
      productId: productId,
      variantId: variantId || null,
      quantity: quantity
    };

    return new Observable<any>(observer => {
      this.http.put(`${this.apiUrl}/${id}`, payload, this.getAuthHeaders()).subscribe({
        next: (res) => {
          this.loadCart();
          observer.next(res);
          observer.complete();
        },
        error: err => {
          console.error('Lỗi cập nhật số lượng', err);
          observer.error(err);
        }
      });
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
      this.confirmModalService.confirm({
        title: 'Yêu cầu đăng nhập',
        content: `Bạn cần đăng nhập để ${actionContent}. Chuyển đến trang đăng nhập?`,
        okText: 'Đăng nhập',
        cancelText: 'Đóng',
        type: 'info'
      }, () => this.router.navigate(['/login']));
      return false;
    }
    return true;
  }
}