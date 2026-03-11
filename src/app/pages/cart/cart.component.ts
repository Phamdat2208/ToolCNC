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

@Component({
  selector: 'app-cart',
  imports: [CommonModule, FormsModule, RouterLink, NzTableModule, NzButtonModule, NzIconModule, NzInputNumberModule, NzDividerModule, NzGridModule, NzPopconfirmModule, QuantityInputComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cartService = inject(CartService);

  private notification = inject(NzNotificationService);

  get cartItems() {
    return this.cartService.cartItems();
  }

  get totalAmount() {
    return this.cartService.totalAmount;
  }

  removeItem(id: number) {
    this.cartService.removeItem(id);
    this.notification.success('Đã xóa sản phẩm', 'Sản phẩm đã được gỡ khỏi giỏ hàng.', { nzPlacement: 'topRight' });
  }

  updateQuantity(id: number, quantity: number) {
    this.cartService.updateQuantity(id, quantity);
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}

