import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { OrderService } from '../../../services/order.service';
import { FormsModule } from '@angular/forms';
import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

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
    PaginationComponent
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private message = inject(NzMessageService);

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
        this.message.error('Không thể tải danh sách đơn hàng');
        this.loading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SHIPPING': return 'processing';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
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
      this.message.warning('Vui lòng nhập lý do hủy đơn');
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
        this.message.success(`Đã cập nhật trạng thái đơn hàng #${orderId}`);
        this.previousStatusMap[orderId] = status;
        this.loadOrders(); 
      },
      error: () => {
        this.message.error('Lỗi khi cập nhật trạng thái');
        this.loadOrders(); 
      }
    });
  }

  viewOrderDetails(order: any) {
    console.log(order);
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
