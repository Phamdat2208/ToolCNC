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
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { UrlUtils } from '../../shared/utils/url-utils';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, NzGridModule, NzButtonModule, NzIconModule, NzTabsModule, NzInputNumberModule, NzDividerModule, NzSpinModule, PageBreadcrumbComponent, QuantityInputComponent, LoadingComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  cartService = inject(CartService);
  productService = inject(ProductService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  private router = inject(Router);

  product: any = null;
  breadcrumbItems: any[] = [];
  mainImage: string = '';
  quantity = 1;
  isLoading = true;
  parsedSpecs: any[] = [];

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
            }
          } catch (e) {
            console.error('Error parsing specs', e);
          }
        }

        // Setup features mock if description is plain
        this.product.features = this.product.description ? this.product.description.split('\n').filter((f: string) => f.trim().length > 0) : ['Sản phẩm chưa có đặc điểm nổi bật'];

        this.breadcrumbItems = [
          { label: 'Trang chủ', url: '/' },
          { label: 'Sản phẩm', url: '/products' },
          { label: this.product.name }
        ];

        this.isLoading = false;
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

  isAddingToCart = false;

  addToCart() {
    if (!this.product) return;
    this.isAddingToCart = true;
    this.cartService.addToCart(this.product, this.quantity, this.mainImage).subscribe(success => {
      this.isAddingToCart = false;
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng`);
      }
    });
  }

  editProduct() {
    if (this.product) {
      this.router.navigate(['/products', this.product.id, 'edit']);
    }
  }
}

