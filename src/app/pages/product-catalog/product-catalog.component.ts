import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-catalog',
  imports: [CommonModule, FormsModule, RouterLink, NzGridModule, NzMenuModule, NzCheckboxModule, NzSliderModule, NzInputModule, NzCardModule, NzButtonModule, NzIconModule, NzPaginationModule, NzDropDownModule, NzSpinModule, ProductCardComponent, PageBreadcrumbComponent],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.css'
})
export class ProductCatalogComponent implements OnInit {
  activeCategory: string = '';
  currentSort: string = 'Mới nhất';

  products: any[] = [];
  loading = true;
  totalProducts = 0;
  pageSize = 12;
  pageIndex = 1;

  priceRange: number[] = [0, 50000000];
  categories = [
    { name: 'Máy Phay CNC', count: 12 },
    { name: 'Máy Tiện CNC', count: 8 },
    { name: 'Dao Cụ Cắt Gọt', count: 154 },
    { name: 'Phụ kiện kẹp chặt', count: 65 },
    { name: 'Dầu mỡ công nghiệp', count: 23 },
    { name: 'Dụng cụ đo kiểm', count: 41 }
  ];

  private route = inject(ActivatedRoute);
  private notification = inject(NzNotificationService);
  private productService = inject(ProductService);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.activeCategory = params['category'];
      }
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading = true;
    const apiPage = this.pageIndex - 1;

    this.productService.getProducts(apiPage, this.pageSize, this.currentSort).subscribe({
      next: (res) => {
        this.products = res.content.map((p: any) => ({
          ...p,
          img: p.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(p.name)}`
        }));
        this.totalProducts = res.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.notification.error('Lỗi', 'Không thể kết nối đến máy chủ lấy danh sách sản phẩm.');
        this.loading = false;
      }
    });
  }

  changePage(page: number) {
    this.pageIndex = page;
    this.loadProducts();
  }

  changeSort(sort: string) {
    this.currentSort = sort;
    this.pageIndex = 1; // Reset to first page
    this.loadProducts();
  }

  breadcrumbItems = [
    { label: 'Trang chủ', url: '/' },
    { label: 'Sản phẩm' }
  ];
}
