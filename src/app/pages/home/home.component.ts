import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Category } from '../../models/category.model';
import { Brand, BrandService } from '../../services/brand.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { ToastService } from '../../shared/services/toast.service';
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
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);

  addToCart(product: any) {
    this.toastService.showSuccess(`Đã thêm ${product.name} vào giỏ hàng`);
  }
  
  categories: Category[] = [];
  banners = [
    {
      title: 'Hệ thống Dao cụ Cắt gọt Kỹ thuật cao',
      content: 'Chuyên cung cấp các giải pháp gia công kim loại với độ chính xác tuyệt đối',
      color: 'linear-gradient(110deg, #0f172a 0%, #334155 40%, #f97316 100%)', /* Slide 1: Xám Slate -> Cam Sáng */
      image: 'assets/images/dung-cu-cat-got-banner.png'
    },
    {
      title: 'Chip tiện Insert chính hãng - Giá Xưởng',
      content: 'Giảm đến 20% cho đơn hàng số lượng lớn các dòng mã chip CNMG, WNMG, MGMN',
      color: 'linear-gradient(110deg, #09090b 0%, #27272a 50%, #a1a1aa 100%)', /* Slide 2: Kim loại Đen -> Bạc (Tôn vinh kim loại) */
      image: 'assets/images/chip-dao-tien-cnc-banner.png'
    },
    {
      title: 'Tư vấn giải pháp gia công CAM/CNC',
      content: 'Tối ưu hóa quy trình sản xuất và tăng tuổi thọ dao cụ cùng chuyên gia',
      color: 'linear-gradient(110deg, #000000 0%, #1e293b 60%, #c2410c 100%)', /* Slide 3: Đen tuyền -> Cam Cháy quyền lực */
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
      const data = Array.isArray(res) ? res : [];
      this.categories = data.map((cat: Category) => ({
        ...cat,
        icon: this.getIconForCategory(cat.name)
      }));
    });
  }

  loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (res) => {
        const data = Array.isArray(res) ? res : [];
        this.featuredBrands = data.map(brand => ({
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
        const data = (res && Array.isArray(res.content)) ? res.content : [];
        this.featuredProducts = data.map((p: any) => ({
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
