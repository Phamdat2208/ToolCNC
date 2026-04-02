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
    
    this.orderService.getAllOrders().subscribe({
      next: (res) => {
        this.totalOrders = res.length;
        checkDone();
      },
      error: () => checkDone()
    });
  }
}
