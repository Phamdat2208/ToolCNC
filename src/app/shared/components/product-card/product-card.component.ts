import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink, NzCardModule, NzButtonModule, NzIconModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: any;

  cartService = inject(CartService);
  authService = inject(AuthService);
  private router = inject(Router);

  private notification = inject(NzNotificationService);

  addToCart(product: any) {
    this.cartService.addToCart(product, 1, product.img).subscribe(success => {
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
      }
    });
  }

  editProduct(product: any) {
    this.router.navigate(['/products', product.id, 'edit']);
  }
}
