import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, NzButtonModule, NzIconModule, NzEmptyModule, NzToolTipModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
  wishlistService = inject(WishlistService);
  cartService = inject(CartService);
  private notification = inject(NzNotificationService);

  isAddingToCart: { [key: number]: boolean } = {};
  isRemoving: { [key: number]: boolean } = {};
  isLoading = true;

  constructor() {
    // Giả lập loading hoặc đợi service có dữ liệu
    // Vì wishlist service tự động load trong constructor, ta sẽ tắt loading sau một khoảng ngắn
    // hoặc khi items đã được fetch xong.
    setTimeout(() => this.isLoading = false, 600);
  }

  addToCart(product: any) {
    this.isAddingToCart[product.id] = true;
    this.cartService.addToCart(product, 1, product.img || product.imageUrl).subscribe(success => {
      this.isAddingToCart[product.id] = false;
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
      }
    });
  }

  removeFromWishlist(productId: number) {
    this.isRemoving[productId] = true;
    this.wishlistService.removeViaObservable(productId, false).subscribe({
      next: () => {
        this.isRemoving[productId] = false;
        this.notification.info('Yêu thích', 'Đã xóa sản phẩm khỏi danh sách yêu thích');
      },
      error: () => {
        this.isRemoving[productId] = false;
      }
    });
  }
}
