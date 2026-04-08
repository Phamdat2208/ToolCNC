import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzIconModule, NzButtonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() total: number = 0;
  @Input() pageIndex: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 20, 50, 100];

  @Output() pageIndexChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages: number = 0;
  pages: (number | string)[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.calculateTotalPages();
    this.generatePages();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.total / this.pageSize) || 1;
  }

  generatePages(): void {
    const total = this.totalPages;
    const current = this.pageIndex;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push('...');

      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 3) pages.push('...');
      pages.push(total);
    }
    this.pages = pages;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number' && page !== this.pageIndex) {
      this.pageIndexChange.emit(page);
    }
  }

  onPrev(): void {
    if (this.pageIndex > 1) {
      this.pageIndexChange.emit(this.pageIndex - 1);
    }
  }

  onNext(): void {
    if (this.pageIndex < this.totalPages) {
      this.pageIndexChange.emit(this.pageIndex + 1);
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }

  get startRange(): number {
    return (this.pageIndex - 1) * this.pageSize + 1;
  }

  get endRange(): number {
    return Math.min(this.pageIndex * this.pageSize, this.total);
  }
}
