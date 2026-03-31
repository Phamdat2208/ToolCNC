import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { ProductService } from '../../services/product.service';
 
@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NzMenuModule, NzInputModule, NzIconModule, NzBadgeModule, NzButtonModule, NzDropDownModule, NzModalModule, NzSpinModule, NzDrawerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  wishlistService = inject(WishlistService);
  private router = inject(Router);
  private modal = inject(NzModalService);
  private productService = inject(ProductService);
  private el = inject(ElementRef);

  searchKeyword = '';
  searchResults: any[] = [];
  isSearching = false;
  showDropdown = false;
  isScrolled = false;
  isDrawerVisible = false;

  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(keyword => {
        if (!keyword.trim()) {
          this.searchResults = [];
          this.isSearching = false;
          return [];
        }
        this.isSearching = true;
        return this.productService.getProducts(0, 8, undefined, keyword);
      })
    ).subscribe({
      next: (res: any) => {
        if (res && res.content) {
          this.searchResults = res.content.map((p: any) => ({
            ...p,
            img: p.imageUrl || `https://placehold.co/50x50?text=${encodeURIComponent(p.name?.charAt(0) ?? '?')}`
          }));
        } else {
          this.searchResults = [];
        }
        this.isSearching = false;
        this.showDropdown = true;
      },
      error: () => {
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  onSearchInput() {
    if (this.searchKeyword.trim()) {
      this.isSearching = true;
      this.showDropdown = true;
    } else {
      this.showDropdown = false;
      this.searchResults = [];
    }
    this.search$.next(this.searchKeyword);
  }

  onSearchEnter() {
    if (this.searchKeyword.trim()) {
      this.showDropdown = false;
      this.router.navigate(['/products'], { queryParams: { keyword: this.searchKeyword.trim() } });
      this.searchKeyword = '';
    }
  }

  goToProduct(product: any) {
    this.showDropdown = false;
    this.searchKeyword = '';
    this.searchResults = [];
    this.router.navigate(['/products', product.id]);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  get cartCount() {
    return this.cartService.totalItems;
  }

  get wishlistCount() {
    return this.wishlistService.count();
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

  gotoWishList() {
    if (!this.authService.isLoggedIn()) {
      this.modal.confirm({
        nzTitle: 'Yêu cầu đăng nhập',
        nzContent: 'Bạn cần đăng nhập để xem danh sách yêu thích. Chuyển đến trang Đăng nhập?',
        nzOkText: 'Đăng nhập',
        nzCancelText: 'Đóng',
        nzOnOk: () => this.router.navigate(['/login'])
      });
    } else {
      this.router.navigate(['/wishlist']);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    this.isScrolled = scroll > 20;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  openDrawer() {
    this.isDrawerVisible = true;
  }

  closeDrawer() {
    this.isDrawerVisible = false;
  }
}
