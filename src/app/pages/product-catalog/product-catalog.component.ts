import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-product-catalog',
  imports: [CommonModule, FormsModule, RouterLink, NzGridModule, NzMenuModule, NzCheckboxModule, NzSliderModule, NzInputModule, NzCardModule, NzButtonModule, NzIconModule, NzPaginationModule, NzDropDownModule, NzSpinModule, NzEmptyModule, ProductCardComponent, PageBreadcrumbComponent],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.css'
})
export class ProductCatalogComponent implements OnInit {
  activeCategory: string = '';
  currentSort: string = 'Mới nhất';

  products: any[] = [];
  loading = true;
  totalProducts = 0;
  totalAllProducts = 0;
  pageSize = 12;
  pageIndex = 1;

  priceRange: number[] = [0, 2000000000];
  readonly MAX_PRICE = 2000000000;
  selectedBrands: Set<string> = new Set();
  knownBrands = ['Makino', 'Mazak', 'DMG Mori', 'Okuma', 'SMTCL', 'Hitachi'];

  categories: any[] = [];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NzNotificationService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);

  searchKeyword = '';

  ngOnInit() {
    this.loadCategories();
    this.route.queryParams.subscribe(params => {
      this.activeCategory = params['category'] || '';
      this.searchKeyword = params['keyword'] || '';
      
      this.selectedBrands.clear();
      
      // Ưu tiên lọc theo tham số 'brand' trực tiếp từ URL
      if (params['brand']) {
        this.selectedBrands.add(params['brand']);
      } 
      // Nếu không có param brand nhưng có keyword, thử khớp keyword với các thương hiệu đã biết
      else if (this.searchKeyword) {
        const matchedBrand = this.knownBrands.find(b => 
          b.toLowerCase() === this.searchKeyword.trim().toLowerCase()
        );
        if (matchedBrand) {
          this.selectedBrands.add(matchedBrand);
        }
      }
      
      // Thử khớp keyword với danh mục (nếu danh mục đã load xong)
      if (this.searchKeyword && this.categories.length > 0) {
        this.matchKeywordToCategory();
      }
      
      this.loadProducts();
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (list) => {
        this.categories = list;
        // Calculate total count of all products from categories
        this.totalAllProducts = list.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
        
        // Nếu đang có searchKeyword, thử khớp với danh mục vừa load xong
        if (this.searchKeyword) {
          this.matchKeywordToCategory();
        }
      },
      error: (err) => {
        console.error('Error fetching categories', err);
      }
    });
  }

  loadProducts() {
    this.loading = true;
    const apiPage = this.pageIndex - 1;
    const brandStr = this.selectedBrands.size > 0 ? [...this.selectedBrands].join(',') : undefined;

    this.productService.getProducts(apiPage, this.pageSize, this.currentSort, this.searchKeyword || undefined, this.activeCategory || undefined, this.priceRange[0], this.priceRange[1], brandStr).subscribe({
      next: (res) => {
        console.log(res)
        this.products = res.content.map((p: any) => ({
          ...p,
          img: p.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(p.name)}`
        }));
        console.log(this.products)
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

  applyFilters() {
    this.pageIndex = 1;
    this.loadProducts();
  }

  clearKeyword() {
    this.searchKeyword = '';
    this.pageIndex = 1;
    this.loadProducts();
    this.router.navigate(['/products'], {
      queryParams: {
        category: this.activeCategory || undefined,
        brand: this.selectedBrands.size === 1 ? [...this.selectedBrands][0] : undefined
      },
      queryParamsHandling: 'merge'
    });
  }

  toggleBrand(brand: string, checked: boolean) {
    if (checked) {
      this.selectedBrands.add(brand);
    } else {
      this.selectedBrands.delete(brand);
    }
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

  private matchKeywordToCategory() {
    // Nếu activeCategory đã có giá trị từ URL thì không ghi đè
    if (this.activeCategory) return;
    
    const matchedCat = this.categories.find(c => 
      c.name.toLowerCase() === this.searchKeyword.trim().toLowerCase()
    );
    if (matchedCat) {
      this.activeCategory = matchedCat.name;
    }
  }
}
