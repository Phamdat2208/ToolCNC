import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { LoadingComponent } from "../../shared/components/loading/loading.component";

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzTableModule,
    NzTagModule,
    NzSpinModule,
    NzModalModule,
    NzButtonModule,
    NzDividerModule,
    NzSelectModule,
    NzIconModule,
    CustomInputComponent,
    LoadingComponent
],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.css'
})
export class OrderManagementComponent implements OnInit {
  authService = inject(AuthService);
  orderService = inject(OrderService);
  router = inject(Router);
  private message = inject(NzMessageService);

  orders: any[] = [];
  isLoadingOrders = true;

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

  loadOrders() {
    this.isLoadingOrders = true;
    const request = this.orderService.getMyOrders();
    
    request.subscribe({
      next: (data) => {
        this.orders = data;
        this.isLoadingOrders = false;
      },
      error: (err) => {
        console.error('Lỗi lấy đơn hàng', err);
        this.isLoadingOrders = false;
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
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'Đang xử lý';
      case 'SHIPPING': return 'Đang giao hàng';
      case 'COMPLETED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
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
      this.message.warning('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    this.isCancelling = true;
    this.orderService.cancelOrder(this.selectedOrder.id, this.cancelReasonText).subscribe({
      next: (res) => {
        this.message.success(res.message || 'Hủy đơn thành công');
        this.isCancelling = false;
        this.isVisibleCancelModal = false;
        this.closeOrderModal();
        this.loadOrders();
      },
      error: (err) => {
        const msg = typeof err.error === 'string' ? err.error : (err.error?.message || 'Có lỗi xảy ra khi hủy đơn');
        this.message.error(msg);
        this.isCancelling = false;
      }
    });
  }

  closeOrderModal() {
    this.isVisibleOrderModal = false;
    setTimeout(() => this.selectedOrder = null, 300);
  }
}