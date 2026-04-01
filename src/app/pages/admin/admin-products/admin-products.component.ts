import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ProductService } from '../../../services/product.service';
import { FormsModule } from '@angular/forms';

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
    FormsModule
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  products: any[] = [];
  loading = true;
  total = 0;
  page = 1;
  size = 10;
  searchKeyword = '';

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(reset: boolean = false) {
    if (reset) this.page = 1;
    this.loading = true;
    this.productService.getProducts(this.page - 1, this.size, undefined, this.searchKeyword).subscribe({
      next: (res) => {
        this.products = res.content;
        this.total = res.totalElements;
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải danh sách sản phẩm');
        this.loading = false;
      }
    });
  }

  onPageIndexChange(index: number) {
    this.page = index;
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
            this.message.success('Đã xóa sản phẩm thành công');
            this.loadProducts();
          },
          error: () => this.message.error('Lỗi khi xóa sản phẩm')
        });
      }
    });
  }
}
