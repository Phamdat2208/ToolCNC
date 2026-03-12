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
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { QuantityInputComponent } from '../../shared/components/quantity-input/quantity-input.component';

@Component({
  selector: 'app-product-detail',
  imports: [CommonModule, FormsModule, NzGridModule, NzButtonModule, NzIconModule, NzTabsModule, NzInputNumberModule, NzDividerModule, NzSpinModule, PageBreadcrumbComponent, QuantityInputComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css'
})
export class ProductDetailComponent implements OnInit {
  cartService = inject(CartService);
  productService = inject(ProductService);
  route = inject(ActivatedRoute);

  product: any = null;
  breadcrumbItems: any[] = [];
  mainImage: string = '';
  quantity = 1;
  isLoading = true;

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
        // Map backend imageUrl to frontend array structure to keep template intact
        this.product.images = this.product.imageUrl ? [this.product.imageUrl] : ['https://placehold.co/600x400?text=No+Image'];
        this.mainImage = this.product.images[0];

        // Setup features mock if description is plain
        this.product.features = this.product.description ? this.product.description.split('\n').filter((f: string) => f.trim().length > 0) : ['Sản phẩm chưa có mô tả chi tiết'];

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

  addToCart() {
    if (!this.product) return;
    this.cartService.addToCart(this.product, this.quantity, this.mainImage).subscribe(success => {
      if (success) {
        this.notification.success('Thành công', `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng`);
      }
    });
  }
}

