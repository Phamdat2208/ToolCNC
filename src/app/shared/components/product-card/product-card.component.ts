import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzButtonModule, NzIconModule, NzToolTipModule, RouterLink, ScrollRevealDirective],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: any;

  cartService = inject(CartService);
  authService = inject(AuthService);
  wishlistService = inject(WishlistService);
  private router = inject(Router);
  private notification = inject(NzNotificationService);

  isAddingToCart = false;

  addToCart(product: any) {
    this.isAddingToCart = true;
    this.cartService.addToCart(product, 1, product.img).subscribe(success => {
      this.isAddingToCart = false;
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
      }
    });
  }

  toggleWishlist(product: any) {
    this.wishlistService.toggle(product).subscribe(added => {
      if (added === null) return; // Chưa login, chỉ hiển thị modal yêu cầu đăng nhập
      if (added) {
        this.notification.success('Yêu thích', `Đã thêm ${product.name} vào danh sách yêu thích ♥`);
      } else {
        this.notification.info('Yêu thích', `Đã xóa ${product.name} khỏi danh sách yêu thích`);
      }
    });
  }

  editProduct(product: any) {
    this.router.navigate(['/products', product.id, 'edit']);
  }
}
