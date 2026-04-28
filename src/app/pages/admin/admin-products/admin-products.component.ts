import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ProductService } from '../../../services/product.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import { UrlUtils } from '../../../shared/utils/url-utils';
import { lastValueFrom } from 'rxjs';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { AdminBulkImportComponent } from '../bulk-import/admin-bulk-import.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzSelectModule,
    NzModalModule,
    NzToolTipModule,
    FormsModule,
    PaginationComponent,
    LoadingComponent,
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private modal = inject(NzModalService);
  private toastService = inject(ToastService);
  private confirmModalService = inject(ConfirmModalService);

  products: any[] = [];
  loading = true;
  total = 0;
  page = 1;
  size = 10;
  searchKeyword = '';
  statusFilter: boolean | undefined = true; // Default to active products
  isDeleteProduct: { [key: number]: boolean } = {};
  isRestoreProduct: { [key: number]: boolean } = {};

  ngOnInit() {
    this.loadProducts();
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

  deleteProduct(id: number) {
    this.confirmModalService.confirm({
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
