import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { UrlUtils } from '../../utils/url-utils';
import { QuickSelectModalComponent } from '../quick-select-modal/quick-select-modal.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule, 
    NzCardModule, 
    NzButtonModule, 
    NzIconModule, 
    NzToolTipModule, 
    NzModalModule,
    RouterLink, 
    ScrollRevealDirective
  ],
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
  private modal = inject(NzModalService);

  get imageUrl(): string {
    return UrlUtils.getFullUrl(this.product.imageUrl || this.product.img);
  }

  isAddingToCart = false;
  isTogglingWishlist = false;

  addToCart(product: any) {
    if (product.hasVariants) {
      this.openQuickSelectModal(product);
      return;
    }

    this.isAddingToCart = true;
    this.cartService.addToCart(product, 1, product.img).subscribe(success => {
      this.isAddingToCart = false;
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
      }
    });
  }

  private openQuickSelectModal(product: any) {
    this.modal.create({
      nzTitle: 'Lựa chọn phân loại sản phẩm',
      nzContent: QuickSelectModalComponent,
      nzData: {
        productId: product.id
      },
      nzFooter: null,
      nzWidth: 700,
      nzClassName: 'quick-select-modal-custom'
    });
  }

  toggleWishlist(product: any) {
    this.isTogglingWishlist = true;
    this.wishlistService.toggle(product).subscribe(added => {
      this.isTogglingWishlist = false;
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
