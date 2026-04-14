import { Component, inject } from '@angular/core';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, NzButtonModule, NzIconModule, NzEmptyModule, LoadingComponent, NzToolTipModule],
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
