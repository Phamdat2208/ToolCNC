import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { BrandService, Brand } from '../../services/brand.service';
import { Category } from '../../models/category.model';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { UrlUtils } from '../../shared/utils/url-utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    NzCarouselModule, 
    NzCardModule, 
    NzGridModule, 
    NzButtonModule, 
    NzIconModule, 
    NzSpinModule, 
    NzBackTopModule, 
    ProductCardComponent, 
    ScrollRevealDirective,
    LoadingComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private notification = inject(NzNotificationService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);

  addToCart(product: any) {
    this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
  }
  
  categories: Category[] = [];
  banners = [
    {
      title: 'Hệ thống Dao cụ Cắt gọt Kỹ thuật cao',
      content: 'Chuyên cung cấp các giải pháp gia công kim loại với độ chính xác tuyệt đối',
      color: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      image: 'assets/images/dung-cu-cat-got-banner.png'
    },
    {
      title: 'Chip tiện Insert chính hãng - Giá Xưởng',
      content: 'Giảm đến 20% cho đơn hàng số lượng lớn các dòng mã chip CNMG, WNMG, MGMN',
      color: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
      image: 'assets/images/chip-dao-tien-cnc-banner.png'
    },
    {
      title: 'Tư vấn giải pháp gia công CAM/CNC',
      content: 'Tối ưu hóa quy trình sản xuất và tăng tuổi thọ dao cụ cùng chuyên gia',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)',
      image: 'assets/images/phu-kien-cnc-banner.png'
    }
  ];

  ngOnInit() {
    this.loadFeaturedProducts();
    this.loadCategories();
    this.loadBrands();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res.map((cat: Category) => ({
        ...cat,
        icon: this.getIconForCategory(cat.name)
      }));
    });
  }

  loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res) => {
        this.featuredBrands = res.map(brand => ({
          ...brand,
          logoUrl: UrlUtils.getFullUrl(brand.logoUrl)
        }));
      },
      error: (err) => console.error('Error loading brands', err)
    });
  }

  getIconForCategory(name: string): string {
    const iconMap: { [key: string]: string } = {
      'Dao Phay': 'block',
      'Chip Tiện': 'border-inner',
      'Mũi Khoan': 'format-painter',
      'Mũi Taro': 'deployment-unit',
      'Phụ Kiện CNC': 'appstore'
    };
    for (const key in iconMap) {
      if (name.includes(key)) return iconMap[key];
    }
    return 'appstore';
  }

  featuredBrands: Brand[] = [];

  featuredProducts: any[] = [];
  loading = true;

  loadFeaturedProducts() {
    this.loading = true;
    this.productService.getProducts(0, 12, 'Mới nhất').subscribe({
      next: (res) => {
        this.featuredProducts = res.content.map((p: any) => ({
          ...p,
          img: p.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(p.name)}`
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching featured products', err);
        this.loading = false;
      }
    });
  }
}
