import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { debounceTime, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';
import { ToastService } from '../../shared/services/toast.service';

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
  private toastService = inject(ToastService);
  
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
        this.toastService.showSuccess('Đã xóa sản phẩm khỏi giỏ hàng.');
        
        if (this.cartItems.length === 0) {
          this.toastService.showInfo('Giỏ hàng của bạn đã trống. Hãy tiếp tục mua sắm nhé!');
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
