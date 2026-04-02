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
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-home',
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

  addToCart(product: any) {
    this.notification.success('Thành công', `Đã thêm ${product.name} vào giỏ hàng`);
  }
  banners = [
    {
      title: 'Công nghệ phay CNC tiên tiến',
      content: 'Cải thiện độ chính xác và năng suất vượt trội',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #0c4a6e 100%)',
      image: '/assets/images/may-cnc-banner.png'
    },
    {
      title: 'Dao cụ giảm giá sốc',
      content: 'Giảm đến 30% cho đơn hàng dao phay thép gió',
      color: 'linear-gradient(135deg, #64748b 0%, #0f172a 100%)',
      image: '/assets/images/mui-khoan-banner.png'
    },
    {
      title: 'Tư vấn kỹ thuật gia công',
      content: 'Đội ngũ chuyên gia hỗ trợ kỹ thuật 24/7',
      color: 'linear-gradient(135deg, #0ea5e9 0%, #64748b 100%)',
      image: '/assets/images/chip-dao-tien-cnc-banner.png'
    }
  ];

  categories = [
    { id: 1, name: 'Máy Phay CNC', icon: 'setting', link: '/products' },
    { id: 2, name: 'Máy Tiện CNC', icon: 'tool', link: '/products' },
    { id: 3, name: 'Dao Cụ Cắt Gọt', icon: 'scissor', link: '/products' },
    { id: 4, name: 'Phụ Kiện Máy', icon: 'appstore', link: '/products' },
    { id: 5, name: 'Dụng Cụ Đo', icon: 'dashboard', link: '/products' },
    { id: 6, name: 'Vật Tư Tiêu Hao', icon: 'experiment', link: '/products' }
  ];

  featuredBrands = [
    { name: 'Makino', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/23/MAKINO-Logo.svg' },
    { name: 'Mazak', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Mazak_logo.svg' },
    { name: 'DMG Mori', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Logo_DMG_MORI_black_png_%281%29.png' },
    { name: 'Okuma', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Okuma_Corporation_company_logo.svg' },
    { name: 'SMTCL', logoUrl: 'https://www.smtcl-en.com/wp-content/uploads/2024/06/SMTCL%E9%80%8F%E6%98%8Emini.png' },
    { name: 'Hitachi', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Hitachi_Group_Logo.svg' }
  ];

  featuredProducts: any[] = [];
  loading = true;

  ngOnInit() {
    this.loadFeaturedProducts();
  }

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
