import { TemplateRef } from '@angular/core';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  fixed?: 'left' | 'right';
  cellTemplate?: TemplateRef<{ $implicit: T; index: number }>;
}

export interface TableConfig {
  showPagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  showSizeChanger: boolean;
  scrollX?: string;
  bordered?: boolean;
  size?: 'small' | 'middle' | 'default';
  emptyText?: string;
}

export interface TableSortEvent {
  columnKey: string;
  direction: 'ascend' | 'descend' | null;
}

export interface TablePageEvent {
  pageIndex: number;
  pageSize: number;
}

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  showPagination: true,
  pageSize: 10,
  pageSizeOptions: [10, 20, 50],
  showSizeChanger: true,
  bordered: false,
  size: 'default',
  emptyText: 'Không có dữ liệu'
};
