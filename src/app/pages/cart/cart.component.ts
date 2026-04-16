import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CartService } from '../../services/cart.service';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { Subject, debounceTime, takeUntil, switchMap, tap } from 'rxjs';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-cart',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    NzTableModule, 
    NzButtonModule, 
    NzIconModule, 
    NzInputModule,
    NzInputNumberModule, 
    NzDividerModule, 
    NzGridModule, 
    NzPopconfirmModule, 
    NzTagModule,
    NzEmptyModule,
    QuantityInputComponent,
    PageBreadcrumbComponent,
    LoadingComponent
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnDestroy {
  cartService = inject(CartService);
  private router = inject(Router);
  private notification = inject(NzNotificationService);
  
  private destroy$ = new Subject<void>();
  private quantityUpdateSubject = new Subject<{ id: number, productId: number, variantId: number | undefined, quantity: number }>();
  isUpdatingTotal = false;
  isLoading = true;

  breadcrumbItems = [
    { label: 'Trang chủ', url: '/' },
    { label: 'Sản phẩm', url: '/products' },
    { label: 'Giỏ hàng' }
  ];

  constructor() {
    // Tự động tắt loading sau khi khởi tạo dữ liệu giỏ hàng
    setTimeout(() => this.isLoading = false, 500);

    // Debounce quantity updates to reduce API calls
    this.quantityUpdateSubject.pipe(
      tap(() => this.isUpdatingTotal = true),
      debounceTime(500),
      switchMap(({ id, productId, variantId, quantity }) => 
        this.cartService.updateQuantity(id, productId, variantId, quantity)
      ),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.isUpdatingTotal = false;
      },
      error: () => {
        this.isUpdatingTotal = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isRemoving: { [key: number]: boolean } = {};

  get cartItems() {
    return this.cartService.cartItems();
  }

  get totalAmount() {
    return this.cartService.totalAmount;
  }

  removeItem(id: number) {
    this.isRemoving[id] = true;
    this.cartService.removeItem(id).subscribe({
      next: () => {
        delete this.isRemoving[id];
        this.notification.success('Đã xóa sản phẩm', 'Sản phẩm đã được gỡ khỏi giỏ hàng.');
        
        if (this.cartItems.length === 0) {
          this.notification.info('Giỏ hàng trống', 'Giỏ hàng của bạn đang trống. Hãy tiếp tục mua sắm nhé!', { nzDuration: 5000 });
        }
      },
      error: () => {
        delete this.isRemoving[id];
      }
    });
  }

  updateQuantity(item: any, quantity: number) {
    this.quantityUpdateSubject.next({ 
      id: item.id, 
      productId: item.productId, 
      variantId: item.variantId, 
      quantity: quantity 
    });
  }

  goToProduct(productId: number) {
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}