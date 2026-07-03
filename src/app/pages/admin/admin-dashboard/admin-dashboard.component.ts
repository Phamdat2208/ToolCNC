import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { DashboardService, RecentOrder, LowStockProduct } from '../../../services/dashboard.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Router, RouterLink } from "@angular/router";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzCardModule, NzStatisticModule, NzIconModule, NzSpinModule, LoadingComponent, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  totalSales = 0;
  totalOrders = 0;
  totalProducts = 0;
  activeUsers = 0;
  isLoading = true;

  recentOrders: RecentOrder[] = [];
  lowStockProducts: LowStockProduct[] = [];

  ngOnInit() {
    this.isLoading = true;
    this.dashboardService.getDashboardSummary().subscribe({
      next: (res) => {
        this.totalSales = res.totalSales;
        this.totalOrders = res.totalOrders;
        this.totalProducts = res.totalProducts;
        this.activeUsers = res.activeUsers;
        this.recentOrders = res.recentOrders;
        this.lowStockProducts = res.lowStockProducts;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
