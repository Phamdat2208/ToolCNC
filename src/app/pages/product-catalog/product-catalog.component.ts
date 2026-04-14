import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { BrandService, Brand } from '../../services/brand.service';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { UrlUtils } from '../../shared/utils/url-utils';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-product-catalog',
  imports: [CommonModule, FormsModule, NzGridModule, NzMenuModule, NzCheckboxModule, NzSliderModule, NzInputModule, NzCardModule, NzButtonModule, NzIconModule, NzPaginationModule, NzDropDownModule, NzSpinModule, NzEmptyModule, NzPopoverModule, ProductCardComponent, PageBreadcrumbComponent, LoadingComponent, PaginationComponent],
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
  pageSizeOptions = [12, 24, 48, 96];

  priceRange: number[] = [0, 10000000];
  readonly MAX_PRICE = 10000000;
  selectedBrands: Set<string> = new Set();
  knownBrands: Brand[] = [];

  categories: any[] = [];
  expandedIds: Set<number> = new Set();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NzNotificationService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);

  searchKeyword = '';
  private initialized = false;

  ngOnInit() {
    this.loadCategories();
    this.loadBrands();
    this.route.queryParams.subscribe(params => {
      // 1. Sync State from URL
      this.pageIndex = params['page'] ? Number(params['page']) : 1;
      this.activeCategory = params['category'] || '';
      this.searchKeyword = params['keyword'] || '';
      this.currentSort = params['sort'] || 'Mới nhất';
      
      const minP = params['minPrice'] ? Number(params['minPrice']) : 0;
      const maxP = params['maxPrice'] ? Number(params['maxPrice']) : this.MAX_PRICE;
      this.priceRange = [minP, maxP];

      this.selectedBrands.clear();
      if (params['brands']) {
        params['brands'].split(',').forEach((b: string) => this.selectedBrands.add(b));
      } else if (params['brand']) {
        this.selectedBrands.add(params['brand']);
      }

      // 2. Logic bổ trợ cho Keyword
      if (this.searchKeyword && this.categories.length > 0) {
        this.matchKeywordToCategory();
      }

      // 3. Load Data
      this.loadProducts();
      this.initialized = true;
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (tree) => {
        // We keep the tree structure for the collapsible UI
        this.totalAllProducts = this.calculateCountsRecursively(tree);
        this.categories = tree;
        
        if (this.searchKeyword && !this.activeCategory) {
          this.matchKeywordToCategory();
        }
      },
      error: (err) => console.error('Error fetching categories', err)
    });
  }

  private calculateCountsRecursively(nodes: any[]): number {
    let totalInCurrentLevel = 0;
    nodes.forEach(node => {
      let nodeTotal = node.productCount || 0;
      if (node.children && node.children.length > 0) {
        nodeTotal += this.calculateCountsRecursively(node.children);
      }
      node.displayCount = nodeTotal;
      totalInCurrentLevel += nodeTotal; // MUST add the full node total (including its children)
    });
    return totalInCurrentLevel;
  }

  toggleExpand(event: Event, catId: number): void {
    event.stopPropagation(); // Prevent selecting the category when just toggling
    if (this.expandedIds.has(catId)) {
      this.expandedIds.delete(catId);
    } else {
      this.expandedIds.add(catId);
    }
  }

  isExpanded(catId: number): boolean {
    return this.expandedIds.has(catId);
  }

  loadBrands() {
    this.brandService.getBrands().subscribe({
      next: (list) => {
        this.knownBrands = list.map(b => ({
          ...b,
          logoUrl: UrlUtils.getFullUrl(b.logoUrl)
        }));
      },
      error: (err) => console.error('Error fetching brands', err)
    });
  }

  loadProducts() {
    this.loading = true;
    const apiPage = this.pageIndex - 1;
    const brands = this.selectedBrands.size > 0 ? [...this.selectedBrands].join(',') : undefined;

    this.productService.getProducts(
      apiPage, 
      this.pageSize, 
      this.currentSort, 
      this.searchKeyword || undefined, 
      this.activeCategory || undefined, 
      this.priceRange[0], 
      this.priceRange[1], 
      brands
    ).subscribe({
      next: (res) => {
        this.products = res.content.map((p: any) => ({
          ...p,
          imageUrl: UrlUtils.getFullUrl(p.imageUrl)
        }));
        this.totalProducts = res.totalElements;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.notification.error('Lỗi', 'Không thể kết nối đến máy chủ.');
        this.loading = false;
      }
    });
  }

  private syncStateToUrl(resetPage = false) {
    const targetPage = resetPage ? 1 : this.pageIndex;
    const queryParams: any = {
      page: targetPage > 1 ? targetPage : null,
      category: this.activeCategory || null,
      keyword: this.searchKeyword || null,
      sort: this.currentSort !== 'Mới nhất' ? this.currentSort : null,
      minPrice: this.priceRange[0] > 0 ? this.priceRange[0] : null,
      maxPrice: this.priceRange[1] < this.MAX_PRICE ? this.priceRange[1] : null,
      brands: this.selectedBrands.size > 0 ? [...this.selectedBrands].join(',') : null,
      brand: null // Explicitly clear singular brand if it came from Home
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams
    });
  }

  applyFilters() {
    this.syncStateToUrl(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearKeyword() {
    this.searchKeyword = '';
    this.syncStateToUrl(true);
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
    this.syncStateToUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.pageIndex = 1; // Reset to first page when size changes
    this.syncStateToUrl();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  changeSort(sort: string) {
    this.currentSort = sort;
    this.syncStateToUrl(true);
  }

  selectCategory(catName: string) {
    this.activeCategory = catName;
    this.syncStateToUrl(true);
  }

  clearFilters() {
    this.priceRange = [0, this.MAX_PRICE];
    this.selectedBrands.clear();
    this.searchKeyword = '';
    this.activeCategory = '';
    this.currentSort = 'Mới nhất';
    this.syncStateToUrl(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  breadcrumbItems = [
    { label: 'Trang chủ', url: '/' },
    { label: 'Sản phẩm' }
  ];

  private matchKeywordToCategory() {
    if (this.activeCategory) return;
    const matchedCat = this.categories.find(c => 
      c.name.toLowerCase() === this.searchKeyword.trim().toLowerCase()
    );
    if (matchedCat) {
      this.activeCategory = matchedCat.name;
    }
  }
}
