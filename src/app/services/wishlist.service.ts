import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { catchError, distinctUntilChanged } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = `${environment.apiUrl}/api/v1/wishlist`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private _items = signal<any[]>([]);
  private _optimisticIds = signal<Set<number>>(new Set());

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
        this._optimisticIds.set(new Set(products.map(p => p.id)));
      }
    });
  }

  isWishlisted(productId: number): boolean {
    return this._optimisticIds().has(productId);
  }

  toggle(product: any, optimistic = true): Observable<boolean | null> {
    if (!this.requireLogin('thêm sản phẩm vào danh sách yêu thích')) {
      return of(null);
    }

    const currentItems = this._items();
    const isCurrentlyWishlisted = currentItems.some(p => p.id === product.id);

    // 1. CẬP NHẬT LẠC QUAN CHO ICON (Luôn chạy để đảm bảo cảm giác mượt mà)
    const nextOptimistic = new Set(this._optimisticIds());
    if (isCurrentlyWishlisted) {
      nextOptimistic.delete(product.id);
    } else {
      nextOptimistic.add(product.id);
    }
    this._optimisticIds.set(nextOptimistic);

    // CHÚ Ý: Chúng ta KHÔNG cập nhật lạc quan cho this._items nữa để con số trên Header không nhảy sớm.
    // Việc cập nhật this._items sẽ được thực hiện trong khối 'next' sau khi API call xong.

    return new Observable<boolean>(observer => {
      this.http.post<any>(`${this.apiUrl}/${product.id}`, {}, this.getAuthHeaders()).subscribe({
        next: (res) => {
          // 2. Cập nhật LIST thực tế sau khi API thành công (Số lượng trên header sẽ nhảy tại đây)
          const latestItems = this._items();
          const isActuallyInList = latestItems.some(p => p.id === product.id);
          
          if (res.added && !isActuallyInList) {
            this._items.set([...latestItems, product]);
          } else if (!res.added && isActuallyInList) {
            this._items.set(latestItems.filter(p => p.id !== product.id));
          }
          
          // Đồng bộ lại optimistic IDs với thực tế từ server
          const finalOptimistic = new Set(this._optimisticIds());
          if (res.added) finalOptimistic.add(product.id);
          else finalOptimistic.delete(product.id);
          this._optimisticIds.set(finalOptimistic);

          observer.next(res.added);
          observer.complete();
        },
        error: (err) => {
          console.error('Lỗi khi toggle wishlist:', err);
          this.loadWishlist(); // Rollback toàn bộ khi lỗi
          observer.next(!isCurrentlyWishlisted);
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
    this.removeViaObservable(productId).subscribe();
  }

  removeViaObservable(productId: number, optimistic = true): Observable<any> {
    if (!this.authService.isLoggedIn()) return of(null);

    // 1. CẬP NHẬT LẠC QUAN CHO ICON
    const nextOptimistic = new Set(this._optimisticIds());
    nextOptimistic.delete(productId);
    this._optimisticIds.set(nextOptimistic);

    // CHÚ Ý: Chúng ta KHÔNG xóa lạc quan khỏi this._items nữa để con số ở Header ổn định.
    // Dữ liệu sẽ biến mất khỏi UI sau khi khối 'next' của API call thực thi.

    return new Observable<any>(observer => {
      this.http.delete(`${this.apiUrl}/${productId}`, this.getAuthHeaders()).subscribe({
        next: (res) => {
          // 2. Cập nhật LIST thực tế sau khi xóa thành công
          this._items.set(this._items().filter(p => p.id !== productId));
          
          // Đảm bảo optimistic cũng đã xóa
          const finalOptimistic = new Set(this._optimisticIds());
          finalOptimistic.delete(productId);
          this._optimisticIds.set(finalOptimistic);

          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          console.error('Lỗi khi xóa khỏi wishlist', err);
          this.loadWishlist(); // Rollback từ server nếu lỗi
          observer.error(err);
        }
      });
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
