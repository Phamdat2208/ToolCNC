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
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { Brand, BrandService } from '../../services/brand.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { PageBreadcrumbComponent } from '../../shared/components/page-breadcrumb/page-breadcrumb.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ToastService } from '../../shared/services/toast.service';
import { UrlUtils } from '../../shared/utils/url-utils';

@Component({
  selector: 'app-product-catalog',
  imports: [CommonModule, FormsModule, NzGridModule, NzMenuModule, NzCheckboxModule, NzSliderModule, NzInputModule, NzCardModule, NzButtonModule, NzIconModule, NzPaginationModule, NzDropDownModule, NzSpinModule, NzEmptyModule, NzPopoverModule, ProductCardComponent, PageBreadcrumbComponent, LoadingComponent, PaginationComponent],
  templateUrl: './product-catalog.component.html',
  styleUrl: './product-catalog.component.css'
})
export class ProductCatalogComponent implements OnInit {
  activeCategory: string = '';
  currentSort: string = 'Mới nhất';
  isFilterOpen = false;

  products: any[] = [];
  loading = true;
  totalProducts = 0;
  totalAllProducts = 0;
  pageSize = 12;
  pageIndex = 1;
  pageSizeOptions = [12, 24, 48, 96];
  onlyInStock = false;

  priceRange: number[] = [0, 10000000];
  readonly MAX_PRICE = 10000000;
  selectedBrands: Set<string> = new Set();
  knownBrands: Brand[] = [];

  categories: any[] = [];
  expandedIds: Set<number> = new Set();

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private brandService = inject(BrandService);
  private toastService = inject(ToastService);

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

      if (this.activeCategory && this.categories.length > 0) {
        this.expandToActiveCategory(this.categories, this.activeCategory);
      }

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

        if (this.activeCategory) {
          this.expandToActiveCategory(this.categories, this.activeCategory);
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
        const data = Array.isArray(list) ? list : [];
        this.knownBrands = data.map(b => ({
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
      brands,
      this.onlyInStock
    ).subscribe({
      next: (res) => {
        const data = (res && Array.isArray(res.content)) ? res.content : [];
        this.products = data.map((p: any) => ({
          ...p,
          imageUrl: UrlUtils.getFullUrl(p.imageUrl)
        }));
        this.totalProducts = res?.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching products', err);
        this.toastService.showError('Không thể kết nối đến máy chủ.');
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
    this.isFilterOpen = false;
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
    this.onlyInStock = sort === 'Hàng có sẵn';
    this.currentSort = sort;
    this.syncStateToUrl(true);
  }

  selectCategory(catName: string, currentActive?: string) {
    this.activeCategory = catName;
    this.isFilterOpen = false; // Auto close mobile filter on category select
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

  private expandToActiveCategory(nodes: any[], targetName: string, path: number[] = []): boolean {
    if (!targetName) return false;
    for (const node of nodes) {
      if (node.name === targetName) {
        path.forEach(id => this.expandedIds.add(id));
        return true;
      }
      if (node.children && node.children.length > 0) {
        if (this.expandToActiveCategory(node.children, targetName, [...path, node.id])) {
          return true;
        }
      }
    }
    return false;
  }
}