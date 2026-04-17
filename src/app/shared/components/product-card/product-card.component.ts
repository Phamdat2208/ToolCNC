import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';
import { ToastService } from '../../services/toast.service';
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
  private modal = inject(NzModalService);
  private toastService = inject(ToastService);

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
        this.toastService.showSuccess(`Đã thêm ${product.name} vào giỏ hàng`);
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
        this.toastService.showSuccess(`Đã thêm ${product.name} vào danh sách yêu thích ♥`);
      } else {
        this.toastService.showInfo(`Đã xóa ${product.name} khỏi danh sách yêu thích`);
      }
    });
  }

  editProduct(product: any) {
    this.router.navigate(['/products', product.id, 'edit']);
  }
}
