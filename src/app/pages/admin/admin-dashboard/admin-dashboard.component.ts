import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, NzGridModule, NzCardModule, NzStatisticModule, NzIconModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);

  totalSales = 25400000; // Mock
  totalOrders = 124; // Mock
  totalProducts = 0;
  activeUsers = 45; // Mock

  ngOnInit() {
    this.productService.getProducts(0, 1).subscribe(res => {
      this.totalProducts = res.totalElements;
    });
  }
}
