import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, NzMenuModule, NzInputModule, NzIconModule, NzBadgeModule, NzButtonModule, NzDropDownModule, NzModalModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private router = inject(Router);
  private modal = inject(NzModalService);

  get cartCount() {
    return this.cartService.totalItems;
  }

  goToCart() {
    if (!this.authService.isLoggedIn()) {
      this.modal.confirm({
        nzTitle: 'Yêu cầu đăng nhập',
        nzContent: 'Bạn cần đăng nhập để xem danh sách giỏ hàng. Chuyển đến trang Đăng nhập?',
        nzOkText: 'Đăng nhập',
        nzCancelText: 'Đóng',
        nzOnOk: () => this.router.navigate(['/login'])
      });
    } else {
      this.router.navigate(['/cart']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
