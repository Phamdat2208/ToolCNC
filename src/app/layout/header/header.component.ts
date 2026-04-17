import { Component, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, RouterLinkActive, NavigationEnd } from '@angular/router';
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
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { ProductService } from '../../services/product.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
 
@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, NzMenuModule, NzInputModule, NzIconModule, NzBadgeModule, NzButtonModule, NzDropDownModule, NzModalModule, NzSpinModule, NzDrawerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  cartService = inject(CartService);
  authService = inject(AuthService);
  private wishlistService = inject(WishlistService);
  private router = inject(Router);
  private confirmModalService = inject(ConfirmModalService);
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
    // Sync search bar with URL keyword and clear results on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const urlTree = this.router.parseUrl(this.router.url);
      const keyword = urlTree.queryParams['keyword'];
      
      this.searchKeyword = keyword !== undefined ? keyword.trim() : '';
      this.searchResults = [];
      this.isSearching = false;
      this.showDropdown = false;
      
      // Force reset the search stream to cancel any pending debounce
      this.search$.next('');
    });

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
        if (res && res.content && Array.isArray(res.content)) {
          this.searchResults = res.content.map((p: any) => ({
            ...p,
            img: p.imageUrl || `https://placehold.co/50x50?text=${encodeURIComponent(p.name?.charAt(0) ?? '?')}`
          }));
        } else {
          this.searchResults = [];
        }
        this.isSearching = false;
        // Chỉ hiện dropdown nếu vẫn còn từ khóa (tránh việc hiện lại sau khi đã clear/navigate)
        this.showDropdown = !!this.searchKeyword.trim();
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
      const keyword = this.searchKeyword.trim();
      this.showDropdown = false;
      this.isSearching = false; // Stop spinner
      this.searchResults = [];
      this.router.navigate(['/products'], { queryParams: { keyword: keyword } });
      this.searchKeyword = '';
    }
  }

  goToProduct(product: any) {
    this.showDropdown = false;
    this.isSearching = false; // Stop spinner
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
      this.confirmModalService.confirm({
        title: 'Yêu cầu đăng nhập',
        content: 'Bạn cần đăng nhập để xem danh sách giỏ hàng. Chuyển đến trang Đăng nhập?',
        okText: 'Đăng nhập',
        cancelText: 'Đóng',
        type: 'info'
      }, () => this.router.navigate(['/login']));
    } else {
      this.router.navigate(['/cart']);
    }
  }

  gotoWishList() {
    if (!this.authService.isLoggedIn()) {
      this.confirmModalService.confirm({
        title: 'Yêu cầu đăng nhập',
        content: 'Bạn cần đăng nhập để xem danh sách yêu thích. Chuyển đến trang Đăng nhập?',
        okText: 'Đăng nhập',
        cancelText: 'Đóng',
        type: 'info'
      }, () => this.router.navigate(['/login']));
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
