import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { QuotationResponse } from '../../../models/quotation.model';
import { QuotationService } from '../../../services/quotation.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { QUOTATION_STATUS_MAP } from '../../../shared/constants/status-maps';

@Component({
  selector: 'app-my-quotations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzTableModule,
    NzTagModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzEmptyModule,
    NzBadgeModule,
    LoadingComponent,
    NzToolTipModule,
    StatusTagComponent
  ],
  templateUrl: './my-quotations.component.html',
  styleUrl: './my-quotations.component.css'
})
export class MyQuotationsComponent implements OnInit {
  private quotationService = inject(QuotationService);
  
  quotations: QuotationResponse[] = [];
  isLoading = true;
  readonly QUOTATION_STATUS_MAP = QUOTATION_STATUS_MAP;

  ngOnInit(): void {
    this.loadMyQuotations();
  }

  loadMyQuotations(): void {
    this.isLoading = true;
    this.quotationService.getMyQuotations().subscribe({
      next: (res) => {
        this.quotations = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
