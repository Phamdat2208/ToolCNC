import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NzTableModule, NzTagModule, NzSpinModule, NzModalModule, NzButtonModule, NzDividerModule, NzSelectModule, NzIconModule],
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
  isAdmin = false;

  isVisibleOrderModal = false;
  selectedOrder: any = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.isAdmin = this.authService.isAdmin();
    this.loadOrders();
  }

  loadOrders() {
    this.isLoadingOrders = true;
    const request = this.isAdmin ? this.orderService.getAllOrders() : this.orderService.getMyOrders();
    
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

  updateStatus(order: any, newStatus: string) {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res) => {
        order.status = res.newStatus;
        this.message.success('Cập nhật trạng thái thành công!');
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật trạng thái', err);
        this.message.error('Lỗi cập nhật trạng thái');
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'orange';
      case 'CONFIRMED': return 'geekblue';
      case 'SHIPPED': return 'blue';
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'default';
    }
  }

  viewOrderDetails(order: any) {
    this.selectedOrder = order;
    this.isVisibleOrderModal = true;
  }

  closeOrderModal() {
    this.isVisibleOrderModal = false;
    setTimeout(() => this.selectedOrder = null, 300);
  }
}
