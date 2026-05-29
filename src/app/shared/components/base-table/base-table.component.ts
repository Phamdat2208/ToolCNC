import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import {
  DEFAULT_TABLE_CONFIG,
  TableColumn,
  TableConfig,
  TablePageEvent,
  TableSortEvent
} from '../../../models/table.model';
import { PaginationComponent } from '../pagination/pagination.component';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-base-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzEmptyModule,
    PaginationComponent,
    LoadingComponent
  ],
  templateUrl: './base-table.component.html',
  styleUrl: './base-table.component.css'
})
export class BaseTableComponent<T = any> implements OnChanges {
  @Input() columns: TableColumn<T>[] = [];
  @Input() dataSource: T[] = [];
  @Input() total: number = 0;
  @Input() pageIndex: number = 1;
  @Input() isLoading: boolean = false;
  @Input() config: Partial<TableConfig> = {};
  @Input() rowExpand?: TemplateRef<{ $implicit: T }>;

  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() rowClick = new EventEmitter<T>();

  mergedConfig: TableConfig = { ...DEFAULT_TABLE_CONFIG };
  expandedRows = new Set<number>();

  get safeDataSource(): T[] {
    return this.dataSource ?? [];
  }

  get showEmptyState(): boolean {
    return this.safeDataSource.length === 0 && !this.isLoading;
  }

  get tableScroll(): { x?: string } | null {
    return this.mergedConfig.scrollX ? { x: this.mergedConfig.scrollX } : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.mergedConfig = { ...DEFAULT_TABLE_CONFIG, ...this.config };
    }
    if (changes['dataSource']) {
      this.expandedRows.clear();
    }
  }

  onRowClick(row: T, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isInteractiveElement = target.closest('button, a, input, [nz-button]');
    if (!isInteractiveElement) {
      this.rowClick.emit(row);
    }
  }

  onSortChange(columnKey: string, direction: string | null): void {
    this.sortChange.emit({ columnKey, direction: direction as 'ascend' | 'descend' | null });
  }

  onPageIndexChange(index: number): void {
    this.pageChange.emit({ pageIndex: index, pageSize: this.mergedConfig.pageSize });
  }

  onPageSizeChange(size: number): void {
    this.mergedConfig = { ...this.mergedConfig, pageSize: size };
    this.pageChange.emit({ pageIndex: 1, pageSize: size });
  }

  toggleRowExpand(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isRowExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  trackByColumnKey(_index: number, col: TableColumn<T>): string {
    return col.key;
  }

  trackByRowIndex(index: number): number {
    return index;
  }

  getCellValue(row: T, key: string): string {
    const value = (row as Record<string, unknown>)[key];
    return value != null ? String(value) : '';
  }
}
