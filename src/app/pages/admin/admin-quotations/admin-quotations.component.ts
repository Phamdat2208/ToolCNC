import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { QuotationResponse } from '../../../models/quotation.model';
import { TableColumn, TableConfig } from '../../../models/table.model';
import { ModalService } from '../../../services/modal.service';
import { QuotationService } from '../../../services/quotation.service';
import { ToastService } from '../../../services/toast.service';
import { BaseTableComponent } from '../../../shared/components/base-table/base-table.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { QUOTATION_STATUS_MAP } from '../../../shared/constants/status-maps';
import { AdminQuotationsDetailComponent } from './admin-quotations-detail/admin-quotations-detail.component';

@Component({
  selector: 'app-admin-quotations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSelectModule,
    NzEmptyModule,
    NzToolTipModule,
    NzModalModule,
    NzDividerModule,
    LoadingComponent,
    StatusTagComponent,
    BaseTableComponent,
  ],
  templateUrl: './admin-quotations.component.html',
  styleUrl: './admin-quotations.component.css',
})
export class AdminQuotationsComponent implements OnInit, AfterViewInit {
  @ViewChild('indexCell') indexCell!: TemplateRef<any>;
  @ViewChild('customerCell') customerCell!: TemplateRef<any>;
  @ViewChild('contactCell') contactCell!: TemplateRef<any>;
  @ViewChild('companyCell') companyCell!: TemplateRef<any>;
  @ViewChild('productCell') productCell!: TemplateRef<any>;
  @ViewChild('qtyCell') qtyCell!: TemplateRef<any>;
  @ViewChild('statusCell') statusCell!: TemplateRef<any>;
  @ViewChild('dateCell') dateCell!: TemplateRef<any>;
  @ViewChild('actionCell') actionCell!: TemplateRef<any>;

  private quotationService = inject(QuotationService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalService);

  quotations: QuotationResponse[] = [];
  isLoading = false;
  totalItems = 0;
  page = 1;
  size = 10;
  readonly QUOTATION_STATUS_MAP = QUOTATION_STATUS_MAP;

  statusOptions = [
    { label: 'Chờ xử lý', value: 'PENDING' },
    { label: 'Đã xem xét', value: 'REVIEWED' },
    { label: 'Đã gửi báo giá', value: 'SENT' },
  ];

  columns: TableColumn<any>[] = [];
  tableConfig: TableConfig = {
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    scrollX: '1200px',
  };

  ngOnInit(): void {
    this.loadQuotations();
  }

  ngAfterViewInit(): void {
    this.columns = [
      {
        key: 'index',
        label: '#',
        width: '50px',
        align: 'center',
        fixed: 'left',
        cellTemplate: this.indexCell,
      },
      {
        key: 'customerName',
        label: 'Khách hàng',
        width: '150px',
        align: 'left',
        cellTemplate: this.customerCell,
      },
      {
        key: 'contact',
        label: 'Email / SĐT',
        width: '180px',
        align: 'left',
        cellTemplate: this.contactCell,
      },
      {
        key: 'companyName',
        label: 'Công ty',
        width: '120px',
        align: 'left',
        cellTemplate: this.companyCell,
      },
      { key: 'productName', label: 'Sản phẩm', cellTemplate: this.productCell },
      {
        key: 'quantity',
        label: 'Số lượng',
        width: '100px',
        align: 'center',
        cellTemplate: this.qtyCell,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        width: '130px',
        align: 'center',
        cellTemplate: this.statusCell,
      },
      {
        key: 'createdAt',
        label: 'Ngày tạo',
        width: '120px',
        align: 'center',
        cellTemplate: this.dateCell,
      },
      {
        key: 'action',
        label: 'Thao tác',
        width: '80px',
        align: 'center',
        fixed: 'right',
        cellTemplate: this.actionCell,
      },
    ];
    this.cdr.detectChanges();
  }

  loadQuotations(): void {
    this.isLoading = true;
    this.quotationService
      .getAdminQuotations(this.page - 1, this.size)
      .subscribe({
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
          this.toastService.showError(
            'Không thể tải danh sách yêu cầu báo giá',
          );
        },
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
      error: () => this.toastService.showError('Cập nhật thất bại'),
    });
  }

  viewDetails(quotation: QuotationResponse): void {
    this.modalService.createCustomModal(
      'Chi tiết yêu cầu báo giá',
      AdminQuotationsDetailComponent,
      quotation,
      700,
      true,
      () => {},
      () => {}
    );
  }
}
