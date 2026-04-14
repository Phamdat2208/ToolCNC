import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzModalModule,
    NzToolTipModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingComponent
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.css'
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private fb = inject(FormBuilder);

  categories: Category[] = [];
  displayCategories: any[] = [];
  parentOptions: any[] = [];
  loading = true;
  
  // Modal state
  isModalVisible = false;
  isEditMode = false;
  currentCategoryId: number | null = null;
  
  categoryForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    parentId: [null]
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories = res;
        this.calculateTotalProductCount(this.categories);
        this.processCategories();
        this.loading = false;
      },
      error: () => {
        this.message.error('Không thể tải danh sách danh mục');
        this.loading = false;
      }
    });
  }

  calculateTotalProductCount(list: Category[]): number {
    let listTotal = 0;
    list.forEach(cat => {
      let currentTotal = cat.productCount || 0;
      if (cat.children && cat.children.length > 0) {
        currentTotal += this.calculateTotalProductCount(cat.children);
      }
      cat.totalProductCount = currentTotal;
      listTotal += currentTotal;
    });
    return listTotal;
  }

  processCategories() {
    this.displayCategories = [];
    this.parentOptions = [];
    this.flattenTree(this.categories, 0, this.displayCategories);
    this.flattenTree(this.categories, 0, this.parentOptions, true);
  }

  flattenTree(data: Category[], level: number, result: any[], isForSelect = false, parentId: number | null = null) {
    data.forEach(node => {
      // For select dropdown, skip the current category being edited and its children
      if (isForSelect && this.currentCategoryId && node.id === this.currentCategoryId) {
        return;
      }

      const flatNode = {
        ...node,
        level: level,
        parentId: parentId,
        expand: false, // Default to collapsed as requested
        displayName: isForSelect ? `${'-- '.repeat(level)}${node.name}` : node.name
      };

      result.push(flatNode);

      if (node.children && node.children.length > 0) {
        this.flattenTree(node.children, level + 1, result, isForSelect, node.id!);
      }
    });
  }

  get filteredCategories(): any[] {
    return this.displayCategories.filter(node => this.isRowVisible(node));
  }

  isRowVisible(data: any): boolean {
    if (data.level === 0) return true;
    const parent = this.displayCategories.find(c => c.id === data.parentId);
    if (!parent) return false;
    // For a row to be visible, its parent must be expanded and the parent itself must be visible
    return parent.expand && this.isRowVisible(parent);
  }

  showAddModal() {
    this.isEditMode = false;
    this.currentCategoryId = null;
    this.categoryForm.reset();
    this.processCategories(); // Refresh options without current edit ID
    this.isModalVisible = true;
  }

  showEditModal(category: any) {
    this.isEditMode = true;
    this.currentCategoryId = category.id;
    this.processCategories(); // Re-flatten to exclude current category from parent options

    // Find the original category object to get parentId
    // Actually our displayCategories has the data, but for parentId we need to check if it's top level
    
    this.categoryForm.patchValue({
      name: category.name,
      parentId: category.parentId || (this.findParentId(category.id, this.categories))
    });
    this.isModalVisible = true;
  }

  findParentId(id: number, list: Category[]): number | null {
    for (const cat of list) {
      if (cat.children && cat.children.some(child => child.id === id)) {
        return cat.id || null;
      }
      if (cat.children) {
        const foundId = this.findParentId(id, cat.children);
        if (foundId) return foundId;
      }
    }
    return null;
  }

  handleOk() {
    if (this.categoryForm.valid) {
      const data = this.categoryForm.value;
      if (this.isEditMode && this.currentCategoryId) {
        this.categoryService.updateCategory(this.currentCategoryId, data).subscribe({
          next: () => {
            this.message.success('Cập nhật thành công');
            this.handleCancel();
            this.loadCategories();
          },
          error: (err: any) => this.message.error(err.error?.message || 'Lỗi khi cập nhật')
        });
      } else {
        this.categoryService.createCategory(data).subscribe({
          next: () => {
            this.message.success('Thêm thành công');
            this.handleCancel();
            this.loadCategories();
          },
          error: (err: any) => this.message.error(err.error?.message || 'Lỗi khi thêm mới')
        });
      }
    } else {
      Object.values(this.categoryForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleCancel() {
    this.isModalVisible = false;
  }

  deleteCategory(id: number) {
    this.modalService.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Xóa danh mục này có thể ảnh hưởng đến các sản phẩm liên quan. Bạn có chắc chắn?',
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        this.categoryService.deleteCategory(id).subscribe({
          next: () => {
            this.message.success('Xóa thành công');
            this.loadCategories();
          },
          error: (err: any) => {
             const msg = err.error?.message || 'Lỗi khi xóa';
             this.message.error(msg);
          }
        });
      }
    });
  }
}
