import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';
import { BaseTableComponent } from '../../shared/components/base-table/base-table.component';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { StatusTagComponent } from '../../shared/components/status-tag/status-tag.component';
import { ORDER_STATUS_MAP } from '../../shared/constants/status-maps';
import { TableColumn, TableConfig, TablePageEvent } from '../../models/table.model';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzModalModule,
    NzButtonModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
    NzToolTipModule,
    BaseTableComponent,
    CustomInputComponent,
    StatusTagComponent,
  ],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css'
})
export class OrderManagementComponent implements OnInit {
  @ViewChild('dateCell') dateCell!: TemplateRef<any>;
  @ViewChild('priceCell') priceCell!: TemplateRef<any>;
  @ViewChild('qtyCell') qtyCell!: TemplateRef<any>;
  @ViewChild('statusCell') statusCell!: TemplateRef<any>;
  @ViewChild('actionCell') actionCell!: TemplateRef<any>;

  authService = inject(AuthService);
  orderService = inject(OrderService);
  router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  orders: any[] = [];
  totalElements = 0;
  page = 1;
  size = 10;
  isLoadingOrders = true;

  readonly ORDER_STATUS_MAP = ORDER_STATUS_MAP;

  orderColumns: TableColumn<any>[] = [];

  tableConfig: TableConfig = {
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20],
    showSizeChanger: true,
    scrollX: '800px',
  };

  isVisibleOrderModal = false;
  selectedOrder: any = null;

  isVisibleCancelModal = false;
  isCancelling = false;
  cancelReasonText = '';

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
  }

  ngAfterViewInit(): void {
    this.orderColumns = [
      { key: 'trackingNumber', label: 'Mã đơn hàng', width: '160px', align: 'center' },
      { key: 'dateCreated', label: 'Ngày đặt', width: '160px', align: 'center', cellTemplate: this.dateCell },
      { key: 'totalPrice', label: 'Tổng tiền', width: '140px', align: 'center', cellTemplate: this.priceCell },
      { key: 'totalQuantity', label: 'Số lượng', width: '100px', align: 'center', cellTemplate: this.qtyCell },
      { key: 'status', label: 'Trạng thái', width: '150px', align: 'center', cellTemplate: this.statusCell },
      { key: 'action', label: 'Thao tác', width: '100px', align: 'center', fixed: 'right', cellTemplate: this.actionCell },
    ];
    this.cdr.detectChanges();
  }

  loadOrders() {
    this.isLoadingOrders = true;
    this.orderService.getMyOrders(this.page - 1, this.size).subscribe({
      next: (data) => {
        this.orders = data.content;
        this.totalElements = data.totalElements;
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Lỗi lấy đơn hàng', err);
        this.isLoadingOrders = false;
      }
    });
  }

  onTablePageChange(event: TablePageEvent): void {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isVisibleOrderModal = true;
  }

  openCancelModal() {
    this.isVisibleCancelModal = true;
    this.cancelReasonText = '';
  }

  submitCancelOrder() {
    if (!this.cancelReasonText.trim()) {
      this.toastService.showWarning('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    this.isCancelling = true;
    this.orderService.cancelOrder(this.selectedOrder.id, this.cancelReasonText).subscribe({
      next: (res) => {
        this.toastService.showSuccess(res.message || 'Hủy đơn thành công');
        this.isCancelling = false;
        this.isVisibleCancelModal = false;
        this.closeOrderModal();
        this.loadOrders();
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Có lỗi xảy ra khi hủy đơn');
        this.toastService.showError(msg);
        this.isCancelling = false;
      }
    });
  }

  closeOrderModal() {
    this.isVisibleOrderModal = false;
    setTimeout(() => this.selectedOrder = null, 300);
  }
}
