import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { Router } from '@angular/router';
import { ɵNzTransitionPatchDirective } from "ng-zorro-antd/core/transition-patch";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzTableModule, NzDescriptionsModule, NzTagModule, NzSpinModule, NzModalModule, NzButtonModule, NzDividerModule, ɵNzTransitionPatchDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  orderService = inject(OrderService);
  http = inject(HttpClient);
  router = inject(Router);

  userInfo: any = null;
  orders: any[] = [];
  isLoadingProfile = true;
  isLoadingOrders = true;

  isVisibleOrderModal = false;
  selectedOrder: any = null;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
    this.loadOrders();
  }

  loadProfile() {
    this.isLoadingProfile = true;
    const token = this.authService.getToken();
    this.http.get<any>('http://localhost:8080/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.userInfo = data;
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Lỗi lấy profile', err);
        // Fallback to sessionStorage user data if API fails or not ready
        this.userInfo = this.authService.currentUserValue;
        this.isLoadingProfile = false;
      }
    });
  }

  loadOrders() {
    this.isLoadingOrders = true;
    this.orderService.getMyOrders().subscribe({
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
      case 'PENDING': return 'orange';
      case 'PROCESSING': return 'blue';
      case 'COMPLETED': return 'green';
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
    setTimeout(() => this.selectedOrder = null, 300); // clear after animation
  }
}
