import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-product-add',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzInputNumberModule, NzTabsModule, NzSelectModule],
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.css'
})
export class ProductAddComponent implements OnInit {
  addMode: 'single' | 'bulk' = 'single';
  bulkJson: string = '';
  isEditMode: boolean = false;
  productId: number | null = null;

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private location = inject(Location);

  isSubmitting = false;
  categories: any[] = [];

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    brand: ['', [Validators.required]],
    categoryId: [null, [Validators.required]],
    description: [''],
    imageUrl: ['']
  });

  ngOnInit(): void {
    this.loadCategories();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = +id;
        this.loadProductDetails(this.productId);
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (list) => {
        this.categories = list;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  onCategoryChange(event: any) {
    console.log(event)
  }

  back(): void {
    this.location.back();
  }

  loadProductDetails(id: number): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          price: product.price,
          brand: product.brand,
          categoryId: product.category?.id,
          description: product.description,
          imageUrl: product.imageUrl
        });
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải thông tin sản phẩm');
        console.error(err);
      }
    });
  }

  submitSingle(): void {
    if (this.productForm.valid) {
      this.isSubmitting = true;
      const productData = this.productForm.value;

      if (this.isEditMode && this.productId) {
        this.productService.updateProduct(this.productId, productData).subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.success('Thành công', 'Đã cập nhật sản phẩm!');
            this.router.navigate(['/products', this.productId]);
          },
          error: (err) => {
            this.isSubmitting = false;
            const msg = typeof err.error === 'string' ? err.error : 'Không thể cập nhật sản phẩm do lỗi máy chủ.';
            this.notification.error('Thất bại', msg);
            console.error(err);
          }
        });
      } else {
        this.productService.createProduct(productData).subscribe({
          next: (res) => {
            this.isSubmitting = false;
            this.notification.success('Thành công', 'Đã thêm sản phẩm mới!');
            this.router.navigate(['/products']);
          },
          error: (err) => {
            this.isSubmitting = false;
            const msg = typeof err.error === 'string' ? err.error : 'Không thể thêm sản phẩm. Vui lòng kiểm tra quyền Admin hoặc server.';
            this.notification.error('Thất bại', msg);
            console.error(err);
          }
        });
      }
    } else {
      Object.values(this.productForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  submitBulk(): void {
    if (!this.bulkJson.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập JSON hợp lệ');
      return;
    }

    try {
      const parsed = JSON.parse(this.bulkJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Định dạng phải là một mảng Mảng JSON (Array)');
      }

      this.isSubmitting = true;
      this.productService.createProductsBulk(parsed).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.notification.success('Thành công', `Đã thêm hàng loạt ${res.length} sản phẩm!`);
          this.router.navigate(['/products']);
        },
        error: (err) => {
          this.isSubmitting = false;
          const msg = typeof err.error === 'string' ? err.error : 'Có lỗi xảy ra khi lưu trên server';
          this.notification.error('Thất bại', msg);
          console.error(err);
        }
      });
    } catch (e: any) {
      this.notification.error('Lỗi cú pháp', 'Nội dung JSON không hợp lệ: ' + e.message);
    }
  }
}
