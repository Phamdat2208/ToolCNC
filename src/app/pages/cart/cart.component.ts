import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CartService } from '../../services/cart.service';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';
import { Subject, debounceTime, takeUntil, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule, RouterLink, NzTableModule, NzButtonModule, NzIconModule, NzInputNumberModule, NzDividerModule, NzGridModule, NzPopconfirmModule, QuantityInputComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartService = inject(CartService);

  private notification = inject(NzNotificationService);
  private destroy$ = new Subject<void>();
  private quantityUpdateSubject = new Subject<{ id: number, quantity: number }>();
  isUpdatingTotal = false;

  constructor() {
    // Debounce quantity updates to reduce API calls
    this.quantityUpdateSubject.pipe(
      tap(() => this.isUpdatingTotal = true),
      debounceTime(500),
      switchMap(({ id, quantity }) => 
        this.cartService.updateQuantity(id, quantity)
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
        
        // Notify if cart is now empty
        if (this.cartItems.length === 0) {
          this.notification.info('Giỏ hàng trống', 'Giỏ hàng của bạn đang trống. Hãy tiếp tục mua sắm nhé!', { nzDuration: 5000 });
        }
      },
      error: () => {
        delete this.isRemoving[id];
      }
    });
  }

  updateQuantity(id: number, quantity: number) {
    // Push update to subject for debouncing
    this.quantityUpdateSubject.next({ id, quantity });
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}

