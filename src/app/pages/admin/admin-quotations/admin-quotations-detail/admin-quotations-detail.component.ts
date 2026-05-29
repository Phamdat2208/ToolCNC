import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { QuotationResponse } from '../../../../models/quotation.model';
import { StatusTagComponent } from '../../../../shared/components/status-tag/status-tag.component';

@Component({
  selector: 'app-admin-quotations-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzDescriptionsModule,
    NzTagModule,
    NzModalModule,
    NzIconModule,
    NzDividerModule,
    StatusTagComponent
  ],
  providers: [DatePipe],
  templateUrl: './admin-quotations-detail.component.html',
  styleUrls: ['./admin-quotations-detail.component.css']
})
export class AdminQuotationsDetailComponent {
  readonly modalRef = inject(NzModalRef);
  readonly data = inject(NZ_MODAL_DATA);
  quotation: QuotationResponse = this.data;

  close(): void {
    this.modalRef.destroy();
  }
}
