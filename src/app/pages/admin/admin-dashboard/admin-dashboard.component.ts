import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzCardModule, NzStatisticModule, NzIconModule, NzSpinModule, LoadingComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);

  totalSales = 25400000; // Mock
  totalOrders = 0; // Mock
  totalProducts = 0;
  activeUsers = 45; // Mock
  isLoading = true;

  recentOrders = [
    { id: '#12845', customer: 'Nguyễn Văn A', date: '10:45, 06/05', amount: 1250000, status: 'pending' },
    { id: '#12844', customer: 'Trần Thị B', date: '09:30, 06/05', amount: 450000, status: 'completed' },
    { id: '#12843', customer: 'Lê Văn C', date: '18:20, 05/05', amount: 3200000, status: 'completed' },
    { id: '#12842', customer: 'Phạm Minh D', date: '15:15, 05/05', amount: 890000, status: 'completed' }
  ];

  lowStockProducts = [
    { name: 'Mũi phay ngón 4mm', sku: 'MPN-004', stock: 3 },
    { name: 'Dao tiện trong CNC', sku: 'DTC-122', stock: 5 },
    { name: 'Mảnh chip tiện TNMG', sku: 'CPT-TN16', stock: 2 }
  ];

  ngOnInit() {
    this.isLoading = true;
    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= 2) this.isLoading = false;
    };

    this.productService.getProducts(0, 1).subscribe({
      next: (res) => {
        this.totalProducts = res.totalElements;
        checkDone();
      },
      error: () => checkDone()
    });
    
    this.orderService.getAllOrders(0, 1).subscribe({
      next: (res) => {
        this.totalOrders = res.totalElements ?? res.content?.length ?? 0;
        checkDone();
      },
      error: () => checkDone()
    });
  }
}
