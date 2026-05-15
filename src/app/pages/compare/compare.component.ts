import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CompareProduct } from '../../models/compare.model';
import { CartService } from '../../services/cart.service';
import { CompareService } from '../../services/compare.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../services/toast.service';

interface SpecEntry { key: string; value: string; }

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, RouterLink, NzButtonModule, NzIconModule, NzEmptyModule, NzTagModule, NzToolTipModule],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css'
})
export class CompareComponent implements OnInit {
  compareService = inject(CompareService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  products: CompareProduct[] = [];

  ngOnInit(): void {
    this.compareService.compareList$.subscribe(list => {
      this.products = list;
    });

    if (this.compareService.compareList.length === 0) {
      this.toastService.showInfo('Chưa có sản phẩm để so sánh');
      this.router.navigate(['/products']);
    }
  }

  removeProduct(productId: number): void {
    this.compareService.removeFromCompare(productId);
    if (this.compareService.compareList.length === 0) {
      this.router.navigate(['/products']);
    }
  }

  addToCart(product: CompareProduct): void {
    this.cartService.addToCart(product, 1, product.imageUrl).subscribe(success => {
      if (success) {
        this.toastService.showSuccess(`Đã thêm "${product.name}" vào giỏ hàng`);
      }
    });
  }

  parseSpecs(specs: any): SpecEntry[] {
    if (!specs) return [];
    
    // Nếu đã là mảng (từ API detail)
    if (Array.isArray(specs)) {
      return specs.filter(s => s.key && s.value);
    }

    // Nếu là object (JSON parsed hoặc object từ API)
    if (typeof specs === 'object') {
      return Object.entries(specs).map(([key, value]) => ({ 
        key, 
        value: String(value) 
      }));
    }

    // Nếu là string (từ API list hoặc chưa parse)
    if (typeof specs === 'string') {
      try {
        const parsed = JSON.parse(specs);
        return this.parseSpecs(parsed);
      } catch {
        return [];
      }
    }

    return [];
  }

  getSpecValue(product: CompareProduct, key: string): string {
    const specs = this.parseSpecs(product.specs);
    const entry = specs.find(s => s.key.trim().toLowerCase() === key.trim().toLowerCase());
    return entry?.value || '—';
  }

  getAllSpecKeys(): string[] {
    const keySet = new Set<string>();
    this.products.forEach(p => {
      this.parseSpecs(p.specs).forEach(s => {
        // Chuẩn hóa key để tránh trùng lặp do viết hoa/thường hoặc khoảng trắng
        const normalizedKey = s.key.trim();
        if (normalizedKey) {
          keySet.add(normalizedKey);
        }
      });
    });
    return Array.from(keySet);
  }

  isBestPrice(product: CompareProduct): boolean {
    if (this.products.length < 2) return false;
    const prices = this.products.map(p => p.price || p.minPrice || 0);
    const min = Math.min(...prices);
    const allSame = prices.every(v => v === min);
    return !allSame && (product.price || product.minPrice || 0) === min;
  }

  isBestStock(product: CompareProduct): boolean {
    if (this.products.length < 2) return false;
    const stocks = this.products.map(p => p.stock ?? 0);
    const max = Math.max(...stocks);
    const allSame = stocks.every(v => v === max);
    return !allSame && (product.stock ?? 0) === max;
  }
}
