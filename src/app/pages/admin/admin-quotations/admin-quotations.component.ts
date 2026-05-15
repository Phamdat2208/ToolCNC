import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { QuotationResponse } from '../../../models/quotation.model';
import { QuotationService } from '../../../services/quotation.service';
import { ToastService } from '../../../services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { QUOTATION_STATUS_MAP } from '../../../shared/constants/status-maps';

@Component({
  selector: 'app-admin-quotations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzEmptyModule,
    NzToolTipModule,
    LoadingComponent,
    StatusTagComponent,
    PaginationComponent
  ],
  templateUrl: './admin-quotations.component.html',
  styleUrl: './admin-quotations.component.css'
})
export class AdminQuotationsComponent implements OnInit {
  private quotationService = inject(QuotationService);
  private toastService = inject(ToastService);

  quotations: QuotationResponse[] = [];
  isLoading = false;
  totalItems = 0;
  page = 1;
  size = 10;
  readonly QUOTATION_STATUS_MAP = QUOTATION_STATUS_MAP;

  statusOptions = [
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã xem xét', value: 'REVIEWED' },
    { label: 'Đã gửi báo giá', value: 'SENT' }
  ];

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.isLoading = true;
    this.quotationService.getAdminQuotations(this.page - 1, this.size).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.content) {
          this.quotations = res.content;
          this.totalItems = res.totalElements ?? res.content.length;
        } else if (Array.isArray(res)) {
          this.quotations = res;
          this.totalItems = res.length;
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.showError('Không thể tải danh sách yêu cầu báo giá');
      }
    });
  }
  
  onPageChange(index: number) {
    this.page = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
  }

  updateStatus(id: number, status: string): void {
    this.quotationService.updateQuotationStatus(id, status).subscribe({
      next: () => {
        this.toastService.showSuccess('Đã cập nhật trạng thái');
        this.loadQuotations();
      },
      error: () => this.toastService.showError('Cập nhật thất bại')
    });
  }
}
