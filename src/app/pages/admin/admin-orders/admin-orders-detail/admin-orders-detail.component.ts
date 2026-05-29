import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';
import { ORDER_STATUS_MAP } from '../../../../shared/constants/status-maps';

@Component({
  selector: 'app-admin-orders-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzTagModule,
    NzModalModule,
    NzIconModule,
    NzDividerModule,
    StatusTagComponent
  ],
  providers: [DatePipe],
  templateUrl: './admin-orders-detail.component.html',
  styleUrls: ['./admin-orders-detail.component.css']
})
export class AdminOrdersDetailComponent {
  readonly modalRef = inject(NzModalRef);
  readonly data = inject(NZ_MODAL_DATA);
  selectedOrder: any = this.data;
  readonly ORDER_STATUS_MAP = ORDER_STATUS_MAP;

  close(): void {
    this.modalRef.destroy();
  }
}
