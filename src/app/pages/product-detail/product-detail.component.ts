import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { UrlUtils } from '../../shared/utils/url-utils';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule, 
    FormsModule, 
    NzGridModule, 
    NzButtonModule, 
    NzIconModule, 
    NzTabsModule, 
    NzInputNumberModule, 
    NzDividerModule, 
    NzSpinModule, 
    PageBreadcrumbComponent, 
    QuantityInputComponent, 
    LoadingComponent,
    NzToolTipModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  cartService = inject(CartService);
  wishlistService = inject(WishlistService);
  productService = inject(ProductService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  private router = inject(Router);

  product: any = null;
  breadcrumbItems: any[] = [];
  mainImage: string = '';
  quantity = 1;
  isLoading = true;
  isAddingToCart = false;
  isTogglingWishlist = false;
  parsedSpecs: any[] = [];
  selectedVariant: any = null;

  private notification = inject(NzNotificationService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(+id);
      }
    });
  }

  loadProduct(id: number) {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.product = res;
        
        // Build the image gallery array
        const gallery: any[] = [];
        if (this.product.imageUrl) {
          gallery.push(this.product.imageUrl.trim());
        }
        
        if (this.product.images && Array.isArray(this.product.images)) {
          this.product.images.forEach((img: any) => {
            const url = (img && typeof img === 'object') ? img.url : img;
            if (url && !gallery.includes(url.trim())) {
              gallery.push(url.trim());
            }
          });
        }
        
        this.product.images = gallery.length > 0 
          ? gallery.map(url => UrlUtils.getFullUrl(url)) 
          : ['https://placehold.co/600x400?text=No+Image'];
        this.mainImage = this.product.images[0];

        // Parse specifications JSON
        this.parsedSpecs = [];
        if (this.product.specifications) {
          try {
            const specs = JSON.parse(this.product.specifications);
            if (Array.isArray(specs)) {
              this.parsedSpecs = specs.filter(s => s.key && s.value);
            } else if (typeof specs === 'object' && specs !== null) {
              // Chuyển đổi { "Key": "Value" } sang [ {key, value} ]
              this.parsedSpecs = Object.entries(specs).map(([key, value]) => ({
                key: key,
                value: String(value)
              }));
            }
          } catch (e) {
            console.error('Error parsing specs', e);
          }
        }

        // Setup features mock if description is plain
        this.product.features = this.product.description ? this.product.description.split('\n').filter((f: string) => f.trim().length > 0) : ['Sản phẩm chưa có đặc điểm nổi bật'];

        this.breadcrumbItems = [
          { label: 'Trang chủ', url: '/' },
          { label: 'Sản phẩm', url: '/products' }
        ];

        if (this.product.categoryName || this.product.category?.name) {
          const catName = this.product.categoryName || this.product.category?.name;
          this.breadcrumbItems.push({ 
            label: catName, 
            url: `/products?category=${encodeURIComponent(catName)}` 
          });
        }

        this.breadcrumbItems.push({ label: this.product.name });

        this.isLoading = false;

        // Removed auto-select variant to show the price range initially (min - max)
        /*
        if (this.product.hasVariants && this.product.variants && this.product.variants.length > 0) {
          this.selectVariant(this.product.variants[0]);
        }
        */
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải chi tiết sản phẩm');
        this.isLoading = false;
      }
    });
  }

  setMainImage(img: string) {
    this.mainImage = img;
  }

  selectVariant(variant: any) {
    this.selectedVariant = variant;
  }

  get displayPrice(): number {
    if (this.product?.hasVariants && this.selectedVariant) {
      return this.selectedVariant.price;
    }
    return this.product?.price || 0;
  }

  get displaySku(): string {
    if (this.product?.hasVariants && this.selectedVariant) {
      return this.selectedVariant.sku;
    }
    return this.product?.sku || '';
  }

  get displayStock(): number {
    if (this.product?.hasVariants && this.selectedVariant) {
      return this.selectedVariant.stock;
    }
    return this.product?.totalStock || 0;
  }

  addToCart() {
    if (!this.product) return;
    if (this.product.hasVariants && !this.selectedVariant) {
      this.notification.warning('Thông báo', 'Vui lòng chọn kích thước/mã hàng');
      return;
    }

    this.isAddingToCart = true;
    
    // Create a modified product object with selected variant info for the cart service
    const cartProduct = { ...this.product };
    if (this.selectedVariant) {
      cartProduct.price = this.selectedVariant.price;
      cartProduct.variantId = this.selectedVariant.id;
      cartProduct.variantName = this.selectedVariant.variantName;
    }

    this.cartService.addToCart(cartProduct, this.quantity, this.mainImage).subscribe(success => {
      this.isAddingToCart = false;
      if (success) {
        let msg = `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng`;
        if (this.selectedVariant) {
          msg = `Đã thêm ${this.quantity} sản phẩm (${this.selectedVariant.variantName}) vào giỏ hàng`;
        }
        this.notification.success('Thành công', msg);
      }
    });
  }

  toggleWishlist(product: any) {
    if (!product) return;
    this.isTogglingWishlist = true;
    this.wishlistService.toggle(product).subscribe((added: boolean | null) => {
      this.isTogglingWishlist = false;
      if (added === null) return;
      if (added) {
        this.notification.success('Yêu thích', `Đã thêm ${this.product.name} vào danh sách yêu thích ♥`);
      } else {
        this.notification.info('Yêu thích', `Đã xóa ${this.product.name} khỏi danh sách yêu thích`);
      }
    });
  }

  editProduct() {
    if (this.product) {
      this.router.navigate(['/products', this.product.id, 'edit']);
    }
  }
}

