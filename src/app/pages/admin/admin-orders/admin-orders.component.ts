import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TableColumn, TableConfig, TablePageEvent } from '../../../models/table.model';
import { ModalService } from '../../../services/modal.service';
import { OrderService } from '../../../services/order.service';
import { ToastService } from '../../../services/toast.service';
import { BaseTableComponent } from '../../../shared/components/base-table/base-table.component';
import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { ORDER_STATUS_MAP } from '../../../shared/constants/status-maps';
import { AdminOrdersDetailComponent } from './admin-orders-detail/admin-orders-detail.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    NzTagModule,
    NzButtonModule,
    NzSelectModule,
    FormsModule,
    NzToolTipModule,
    NzModalModule,
    NzDividerModule,
    NzIconModule,
    CustomInputComponent,
    LoadingComponent,
    StatusTagComponent,
    BaseTableComponent,
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent implements OnInit, AfterViewInit {
  @ViewChild('trackingCell') trackingCell!: TemplateRef<any>;
  @ViewChild('customerCell') customerCell!: TemplateRef<any>;
  @ViewChild('dateCell') dateCell!: TemplateRef<any>;
  @ViewChild('priceCell') priceCell!: TemplateRef<any>;
  @ViewChild('qtyCell') qtyCell!: TemplateRef<any>;
  @ViewChild('statusCell') statusCell!: TemplateRef<any>;
  @ViewChild('actionCell') actionCell!: TemplateRef<any>;

  private orderService = inject(OrderService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(ModalService);
  readonly ORDER_STATUS_MAP = ORDER_STATUS_MAP;

  orders: any[] = [];
  totalElements = 0;
  loading = true;
  page = 1;
  size = 10;

  isVisibleAdminCancelModal = false;
  adminCancelReasonText = '';
  orderBeingCancelled: any = null;
  previousStatusMap: { [key: number]: string } = {};

  columns: TableColumn<any>[] = [];
  tableConfig: TableConfig = {
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    scrollX: '1000px',
  };

  ngOnInit() {
    this.loadOrders();
  }

  ngAfterViewInit() {
    this.columns = [
      {
        key: 'trackingNumber',
        label: 'Mã đơn hàng',
        width: '150px',
        align: 'center',
        fixed: 'left',
        cellTemplate: this.trackingCell,
      },
      {
        key: 'customerName',
        label: 'Khách hàng',
        width: '200px',
        align: 'left',
        cellTemplate: this.customerCell,
      },
      {
        key: 'dateCreated',
        label: 'Ngày đặt',
        width: '160px',
        align: 'center',
        cellTemplate: this.dateCell,
      },
      {
        key: 'totalPrice',
        label: 'Tổng tiền',
        width: '150px',
        align: 'center',
        cellTemplate: this.priceCell,
      },
      {
        key: 'totalQuantity',
        label: 'Số lượng',
        width: '100px',
        align: 'center',
        cellTemplate: this.qtyCell,
      },
      {
        key: 'status',
        label: 'Trạng thái',
        width: '180px',
        align: 'center',
        cellTemplate: this.statusCell,
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

  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrders(this.page - 1, this.size).subscribe({
      next: (res) => {
        this.orders = res.content;
        this.totalElements = res.totalElements;
        this.orders.forEach((o) => (this.previousStatusMap[o.id] = o.status));
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Không thể tải danh sách đơn hàng');
        this.loading = false;
      },
    });
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
      this.toastService.showWarning('Vui lòng nhập lý do hủy đơn');
      return;
    }
    this.performStatusUpdate(
      this.orderBeingCancelled.id,
      'CANCELLED',
      this.adminCancelReasonText,
    );
    this.isVisibleAdminCancelModal = false;
  }

  cancelAdminModal() {
    this.isVisibleAdminCancelModal = false;
    if (this.orderBeingCancelled) {
      this.orderBeingCancelled.status =
        this.previousStatusMap[this.orderBeingCancelled.id];
      this.orderBeingCancelled = null;
    }
  }

  performStatusUpdate(orderId: number, status: string, cancelReason?: string) {
    this.orderService
      .updateOrderStatus(orderId, status, cancelReason)
      .subscribe({
        next: () => {
          this.toastService.showSuccess(
            `Đã cập nhật trạng thái đơn hàng #${orderId}`,
          );
          this.previousStatusMap[orderId] = status;
          this.loadOrders();
        },
        error: () => {
          this.toastService.showError('Lỗi khi cập nhật trạng thái');
          this.loadOrders();
        },
      });
  }

  viewOrderDetails(order: any) {
    this.modalService.createCustomModal(
      'Chi tiết đơn hàng',
      AdminOrdersDetailComponent,
      order,
      800,
      true,
      () => { },
      () => { }
    );
  }

  onTablePageChange(event: TablePageEvent) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
