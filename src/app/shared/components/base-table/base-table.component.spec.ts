import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BaseTableComponent } from './base-table.component';
import { TableColumn } from '../../../models/table.model';

interface MockItem {
  id: number;
  name: string;
  status?: string;
}

// Host component để test cellTemplate
@Component({
  template: `
    <ng-template #nameCell let-row>
      <strong id="custom-cell-{{ row.id }}">{{ row.name }}</strong>
    </ng-template>

    <app-base-table
      [columns]="columns"
      [dataSource]="data"
      [total]="total"
      [pageIndex]="pageIndex"
      [isLoading]="isLoading"
      [config]="config"
      (pageChange)="onPageChange($event)"
      (rowClick)="onRowClick($event)"
    ></app-base-table>
  `,
  standalone: true,
  imports: [BaseTableComponent]
})
class HostComponent {
  @ViewChild('nameCell') nameCell!: TemplateRef<any>;

  columns: TableColumn<MockItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên' }
  ];
  data: MockItem[] = [{ id: 1, name: 'Tool A' }];
  total = 1;
  pageIndex = 1;
  isLoading = false;
  config: any = {};

  lastPageChange: any = null;
  lastRowClick: any = null;

  onPageChange(event: any) { this.lastPageChange = event; }
  onRowClick(row: any) { this.lastRowClick = row; }
}

describe('BaseTableComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let hostComponent: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule]
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  describe('TASK-002: Render cơ bản', () => {
    it('should_render_correct_number_of_th_when_columns_provided', () => {
      hostComponent.columns = [
        { key: 'a', label: 'Cột 1' },
        { key: 'b', label: 'Cột 2' },
        { key: 'c', label: 'Cột 3' }
      ];
      hostFixture.detectChanges();

      const headers = hostFixture.debugElement.queryAll(By.css('th'));
      expect(headers.length).toBe(3);
    });

    it('should_render_correct_cell_value_from_dataSource', () => {
      hostComponent.data = [{ id: 1, name: 'Tool A' }];
      hostFixture.detectChanges();

      const cells = hostFixture.debugElement.queryAll(By.css('td'));
      const cellTexts = cells.map(c => c.nativeElement.textContent.trim());
      expect(cellTexts).toContain('Tool A');
    });

    it('should_render_empty_string_when_row_key_is_undefined', () => {
      hostComponent.columns = [{ key: 'nonexistent', label: 'X' }];
      hostComponent.data = [{ id: 1, name: 'A' }] as any;
      hostFixture.detectChanges();

      const cells = hostFixture.debugElement.queryAll(By.css('tbody td'));
      expect(cells[0].nativeElement.textContent.trim()).toBe('');
    });

    it('should_not_throw_error_when_dataSource_is_empty', () => {
      hostComponent.data = [];
      hostComponent.total = 0;
      expect(() => hostFixture.detectChanges()).not.toThrow();

      const rows = hostFixture.debugElement.queryAll(By.css('tbody tr'));
      expect(rows.length).toBe(0);
    });

    it('should_not_throw_error_when_columns_is_empty', () => {
      hostComponent.columns = [];
      expect(() => hostFixture.detectChanges()).not.toThrow();

      const headers = hostFixture.debugElement.queryAll(By.css('th'));
      expect(headers.length).toBe(0);
    });
  });

  describe('TASK-002: Events', () => {
    it('should_emit_rowClick_with_correct_row_object_when_row_clicked', () => {
      const targetRow = { id: 99, name: 'ClickMe' };
      hostComponent.data = [targetRow];
      hostFixture.detectChanges();

      const row = hostFixture.debugElement.query(By.css('tbody tr'));
      row.nativeElement.click();
      hostFixture.detectChanges();

      expect(hostComponent.lastRowClick).toEqual(targetRow);
    });

    it('should_emit_pageChange_when_pagination_page_index_changes', () => {
      hostComponent.total = 25;
      hostComponent.config = { showPagination: true, pageSize: 10 };
      hostFixture.detectChanges();

      const paginationComponent = hostFixture.debugElement.query(By.css('app-pagination'));
      expect(paginationComponent).toBeTruthy();

      paginationComponent.componentInstance.pageIndexChange.emit(2);
      hostFixture.detectChanges();

      expect(hostComponent.lastPageChange).toEqual({ pageIndex: 2, pageSize: 10 });
    });
  });

  describe('TASK-002 + TASK-005: Pagination & Empty State', () => {
    it('should_not_render_app_pagination_when_showPagination_is_false', () => {
      hostComponent.config = { showPagination: false };
      hostFixture.detectChanges();

      const pagination = hostFixture.debugElement.query(By.css('app-pagination'));
      expect(pagination).toBeNull();
    });

    it('should_show_empty_state_when_dataSource_is_empty_and_not_loading', () => {
      hostComponent.data = [];
      hostComponent.total = 0;
      hostComponent.isLoading = false;
      hostFixture.detectChanges();

      const emptyBlock = hostFixture.debugElement.query(By.css('.empty-state-block'));
      expect(emptyBlock).toBeTruthy();
    });

    it('should_not_show_empty_state_when_isLoading_is_true', () => {
      hostComponent.data = [];
      hostComponent.isLoading = true;
      hostFixture.detectChanges();

      const emptyBlock = hostFixture.debugElement.query(By.css('.empty-state-block'));
      expect(emptyBlock).toBeNull();
    });

    it('should_show_custom_emptyText_when_provided', () => {
      hostComponent.data = [];
      hostComponent.isLoading = false;
      hostComponent.config = { emptyText: 'Chưa có đơn hàng' };
      hostFixture.detectChanges();

      const emptyText = hostFixture.debugElement.query(By.css('.empty-text'));
      expect(emptyText?.nativeElement.textContent.trim()).toBe('Chưa có đơn hàng');
    });
  });
});
