import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { OrderService } from '../../../services/order.service';
import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import { LoadingComponent } from "../../../shared/components/loading/loading.component";
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzSelectModule,
    FormsModule,
    NzToolTipModule,
    NzModalModule,
    NzDividerModule,
    NzIconModule,
    CustomInputComponent,
    PaginationComponent,
    LoadingComponent
],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  orders: any[] = [];
  loading = true;
  page = 1;
  size = 10;

  isVisibleOrderModal = false;
  selectedOrder: any = null;

  isVisibleAdminCancelModal = false;
  adminCancelReasonText = '';
  orderBeingCancelled: any = null;
  previousStatusMap: { [key: number]: string } = {};

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        this.orders = res;
        this.orders.forEach(o => this.previousStatusMap[o.id] = o.status);
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Không thể tải danh sách đơn hàng');
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#f59e0b';   // Amber 500
      case 'SHIPPING': return '#0ea5e9';  // Cyan 500
      case 'COMPLETED': return '#10b981'; // Emerald 500
      case 'CANCELLED': return '#ef4444'; // Red 500
      default: return '#94a3b8';          // Slate 400
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  }

  onStatusChange(newStatus: string, order: any) {
    if (newStatus === 'CANCELLED') {
       this.orderBeingCancelled = order;
       this.adminCancelReasonText = '';
       this.isVisibleAdminCancelModal = true;
    } else {
       this.performStatusUpdate(order.id, newStatus);
    }
  }

  submitAdminCancel() {
    if (!this.adminCancelReasonText.trim()) {
      this.toastService.showWarning('Vui lòng nhập lý do hủy đơn');
      return;
    }
    this.performStatusUpdate(this.orderBeingCancelled.id, 'CANCELLED', this.adminCancelReasonText);
    this.isVisibleAdminCancelModal = false;
  }

  cancelAdminModal() {
    this.isVisibleAdminCancelModal = false;
    if (this.orderBeingCancelled) {
      this.orderBeingCancelled.status = this.previousStatusMap[this.orderBeingCancelled.id];
      this.orderBeingCancelled = null;
    }
  }

  performStatusUpdate(orderId: number, status: string, cancelReason?: string) {
    this.orderService.updateOrderStatus(orderId, status, cancelReason).subscribe({
      next: () => {
        this.toastService.showSuccess(`Đã cập nhật trạng thái đơn hàng #${orderId}`);
        this.previousStatusMap[orderId] = status;
        this.loadOrders(); 
      },
      error: () => {
        this.toastService.showError('Lỗi khi cập nhật trạng thái');
        this.loadOrders(); 
      }
    });
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isVisibleOrderModal = true;
  }

  closeOrderModal() {
    this.isVisibleOrderModal = false;
    setTimeout(() => this.selectedOrder = null, 300);
  }

  onPageChange(index: number) {
    this.page = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
  }
}