import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ModalService } from '../../../services/modal.service';
import { ProductService } from '../../../services/product.service';
import { ToastService } from '../../../services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { PRODUCT_STATUS_MAP } from '../../../shared/constants/status-maps';
import { UrlUtils } from '../../../shared/utils/url-utils';
import { BaseTableComponent } from '../../../shared/components/base-table/base-table.component';
import { TableColumn, TableConfig, TablePageEvent } from '../../../models/table.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzModalModule,
    NzToolTipModule,
    FormsModule,
    LoadingComponent,
    StatusTagComponent,
    BaseTableComponent
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit, AfterViewInit {
  @ViewChild('imgCell') imgCell!: TemplateRef<any>;
  @ViewChild('nameCell') nameCell!: TemplateRef<any>;
  @ViewChild('categoryCell') categoryCell!: TemplateRef<any>;
  @ViewChild('brandCell') brandCell!: TemplateRef<any>;
  @ViewChild('stockCell') stockCell!: TemplateRef<any>;
  @ViewChild('priceCell') priceCell!: TemplateRef<any>;
  @ViewChild('statusCell') statusCell!: TemplateRef<any>;
  @ViewChild('actionCell') actionCell!: TemplateRef<any>;

  private productService = inject(ProductService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private cdr = inject(ChangeDetectorRef);

  products: any[] = [];
  loading = true;
  total = 0;
  readonly PRODUCT_STATUS_MAP = PRODUCT_STATUS_MAP;
  page = 1;
  size = 10;
  searchKeyword = '';
  statusFilter: boolean | undefined = true; // Default to active products
  isDeleteProduct: { [key: number]: boolean } = {};
  isRestoreProduct: { [key: number]: boolean } = {};

  columns: TableColumn<any>[] = [];
  tableConfig: TableConfig = {
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    scrollX: '1000px'
  };

  ngOnInit() {
    this.loadProducts();
  }

  ngAfterViewInit() {
    this.columns = [
      { key: 'id', label: 'ID', width: '80px', align: 'center' },
      { key: 'imageUrl', label: 'Ảnh', width: '100px', align: 'center', cellTemplate: this.imgCell },
      { key: 'name', label: 'Tên sản phẩm', width: '300px', align: 'left', cellTemplate: this.nameCell },
      { key: 'categoryName', label: 'Danh mục', width: '180px', align: 'center', cellTemplate: this.categoryCell },
      { key: 'brandName', label: 'Thương hiệu', width: '150px', align: 'center', cellTemplate: this.brandCell },
      { key: 'totalStock', label: 'Tồn kho', width: '120px', align: 'center', cellTemplate: this.stockCell },
      { key: 'price', label: 'Giá', width: '140px', align: 'center', cellTemplate: this.priceCell },
      { key: 'status', label: 'Trạng thái', width: '120px', align: 'center', cellTemplate: this.statusCell },
      { key: 'action', label: 'Thao tác', width: '100px', align: 'center', fixed: 'right', cellTemplate: this.actionCell }
    ];
    this.cdr.detectChanges();
  }


  loadProducts(reset: boolean = false) {
    if (reset) this.page = 1;
    this.loading = true;
    this.productService.getAdminProducts(this.page - 1, this.size, this.searchKeyword, this.statusFilter).subscribe({
      next: (res) => {
        this.products = res.content.map((p: any) => ({
          ...p,
          imageUrl: UrlUtils.getFullUrl(p.imageUrl)
        }));
        this.total = res.totalElements;                                                                                                                                                                                                                                           
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Không thể tải danh sách sản phẩm');
        this.loading = false;
      }
    });
  }

  onPageIndexChange(index: number) {
    this.page = index;
    this.loadProducts();
  }

  onPageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
    this.loadProducts();
  }

  onTablePageChange(event: TablePageEvent): void {
      this.page = event.pageIndex;
      this.size = event.pageSize;
      this.loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

  deleteProduct(id: number) {
    this.modalService.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa sản phẩm này không? Sản phẩm sẽ bị ẩn khỏi cửa hàng nhưng vẫn được giữ lại trong lịch sử hệ thống.',
      okText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    }, () => {
      this.isDeleteProduct[id] = true;
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          delete this.isDeleteProduct[id];
          this.toastService.showSuccess('Đã xóa sản phẩm thành công');
          this.loadProducts();
        },
        error: () => {
          delete this.isDeleteProduct[id];
          this.toastService.showError('Lỗi khi xóa sản phẩm');
        }
      });
    });
  }

  restoreProduct(id: number) {
    this.isRestoreProduct[id] = true;
    this.productService.restoreProduct(id).subscribe({
      next: () => {
        delete this.isRestoreProduct[id];
        this.toastService.showSuccess('Đã khôi phục sản phẩm thành công');
        this.loadProducts();
      },
      error: () => {
        delete this.isRestoreProduct[id];
        this.toastService.showError('Lỗi khi khôi phục sản phẩm');
      }
    });
  }
}
