import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ProductService } from '../../../services/product.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import { UrlUtils } from '../../../shared/utils/url-utils';
import { AdminBulkImportComponent } from './bulk-import/admin-bulk-import.component';

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
    NzModalModule,
    NzToolTipModule,
    FormsModule,
    AdminBulkImportComponent,
    PaginationComponent,
    LoadingComponent
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private modal = inject(NzModalService);
  private toastService = inject(ToastService);

  products: any[] = [];
  loading = true;
  total = 0;
  page = 1;
  size = 10;
  searchKeyword = '';
  isImportModalVisible = false;

  ngOnInit() {
    this.loadProducts();
  }

  showImportModal() {
    this.isImportModalVisible = true;
  }

  handleImportComplete() {
    this.isImportModalVisible = false;
    this.loadProducts(true);
  }

  loadProducts(reset: boolean = false) {
    if (reset) this.page = 1;
    this.loading = true;
    this.productService.getProducts(this.page - 1, this.size, undefined, this.searchKeyword).subscribe({
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
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.productService.deleteProduct(id).subscribe({
          next: () => {
            this.toastService.showSuccess('Đã xóa sản phẩm thành công');
            this.loadProducts();
          },
          error: () => this.toastService.showError('Lỗi khi xóa sản phẩm')
        });
      }
    });
  }
}
