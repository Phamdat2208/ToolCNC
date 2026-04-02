import { Component, inject, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { AuthService } from '../../../services/auth.service';


import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-product-add',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzInputNumberModule, NzTabsModule, NzSelectModule, NzRadioModule, NzDividerModule, NzIconModule, ImageCropperComponent, CustomInputComponent, CustomSelectComponent, LoadingComponent],
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.css'
})
export class ProductAddComponent implements OnInit {
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  addMode: 'single' | 'bulk' = 'single';
  bulkJson: string = '';
  isEditMode: boolean = false;
  productId: number | null = null;

  // --- Image upload state ---
  uploadMode: 'url' | 'upload' = 'url';
  originalImageSrc: string | null = null;
  previewImageSrc: string | null = null;
  resizeWidth: number = 800;
  resizeHeight: number = 600;
  isResizing = false;
  private _selectedFile: File | null = null;
  private _resizedBlob: Blob | null = null;
  
  // --- Cropper state ---
  imageChangedEvent: Event | null = null;
  croppedImage: string = '';
  showCropper: boolean = false;

  readonly presetSizes = [
    { label: 'Vuông 1:1 (800×800)', w: 800, h: 800 },
    { label: 'Ngang 4:3 (800×600)', w: 800, h: 600 },
    { label: 'Dọc 3:4 (600×800)', w: 600, h: 800 },
    { label: 'Banner 16:9 (960×540)', w: 960, h: 540 },
  ];

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private location = inject(Location);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  isSubmitting = false;
  categories: any[] = [];
  categoryOptions: SelectOption[] = [];

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    brand: ['', [Validators.required]],
    categoryId: [null, [Validators.required]],
    stock: [10, [Validators.required, Validators.min(0)]],
    description: [''],
    imageUrl: [''],
    specifications: this.fb.array([])
  });

  get specifications(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  addSpec(key: string = '', value: string = ''): void {
    const specGroup = this.fb.group({
      key: [key],
      value: [value]
    });
    this.specifications.push(specGroup);
  }

  removeSpec(index: number): void {
    this.specifications.removeAt(index);
  }

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
        this.categoryOptions = list.map((c: any) => ({ label: c.name, value: c.id }));
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  onCategoryChange(event: any) {
    console.log(event);
  }

  triggerFileInput() {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.notification.error('Lỗi', 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }
    
    this._selectedFile = file;
    this.imageChangedEvent = event;
    this.showCropper = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = event.base64;
    } else if (event.objectUrl) {
      // For ngx-image-cropper newer versions if base64 is null
      this.croppedImage = event.objectUrl; 
    }
  }

  confirmCrop() {
    this.showCropper = false;
    this.originalImageSrc = this.croppedImage; // Lấy ảnh đã Crop làm ảnh gốc chuẩn bị Resize
    
    const img = new Image();
    img.onload = () => {
      // Vì Crop là 1:1, ảnh sẽ là vuông, ta lấy min width/height với tùy chọn preset
      // Ta để mặc định resize 800x800 cho chuẩn nét
      this.resizeWidth = Math.min(img.naturalWidth, 800);
      this.resizeHeight = Math.min(img.naturalHeight, 800);
      this.applyResize();
    };
    img.src = this.croppedImage;
  }

  cancelCrop() {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.clearUploadedImage();
  }

  applyPreset(preset: { w: number; h: number }) {
    this.resizeWidth = preset.w;
    this.resizeHeight = preset.h;
    this.applyResize();
  }

  applyResize() {
    if (!this.originalImageSrc) return;
    this.isResizing = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.resizeWidth;
      canvas.height = this.resizeHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, this.resizeWidth, this.resizeHeight);
      // Show preview only (not stored as Base64)
      this.previewImageSrc = canvas.toDataURL('image/jpeg', 0.85);
      // Store the canvas data as a blob for later upload
      canvas.toBlob((blob) => {
        if (blob) this._resizedBlob = blob;
      }, 'image/jpeg', 0.85);
      this.isResizing = false;
    };
    img.src = this.originalImageSrc;
  }

  uploadResizedImage(): Promise<string> {
    return new Promise((resolve, reject) => {
      const blob = this._resizedBlob;
      if (!blob) { reject('No image to upload'); return; }

      const formData = new FormData();
      const filename = (this._selectedFile?.name || 'product') + '_resized.jpg';
      formData.append('file', blob, filename);

      const token = this.authService.getToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      this.http.post<any>('http://localhost:8080/api/v1/admin/upload/image', formData, { headers })
        .subscribe({
          next: (res) => resolve('http://localhost:8080' + res.url),
          error: (err) => reject(err)
        });
    });
  }

  clearUploadedImage() {
    this.originalImageSrc = null;
    this.previewImageSrc = null;
    this.imageChangedEvent = null;
    this.croppedImage = '';
    this.showCropper = false;
    this._selectedFile = null;
    this._resizedBlob = null;
    this.productForm.patchValue({ imageUrl: '' });
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
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
          stock: product.stock,
          description: product.description,
          imageUrl: product.imageUrl
        });

        // Handle specifications JSON
        this.specifications.clear();
        if (product.specifications) {
          try {
            const specs = JSON.parse(product.specifications);
            if (Array.isArray(specs)) {
              specs.forEach(s => this.addSpec(s.key, s.value));
            }
          } catch (e) {
            console.error('Error parsing specifications JSON', e);
          }
        }
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

      const doSubmit = (imageUrl?: string) => {
        const formValue = this.productForm.value;
        const productData = { 
          ...formValue,
          // Convert FormArray to JSON string for backend
          specifications: JSON.stringify(formValue.specifications)
        };
        
        if (imageUrl) productData.imageUrl = imageUrl;

        const request$ = (this.isEditMode && this.productId)
          ? this.productService.updateProduct(this.productId, productData)
          : this.productService.createProduct(productData);

        request$.subscribe({
          next: () => {
            this.isSubmitting = false;
            this.notification.success('Thành công', this.isEditMode ? 'Đã cập nhật sản phẩm!' : 'Đã thêm sản phẩm mới!');
            if (this.router.url.startsWith('/admin')) {
              this.router.navigate(['/admin/products']);
            } else {
              this.router.navigate(['/products', this.productId]);
            }
          },
          error: (err) => {
            this.isSubmitting = false;
            const msg = typeof err.error === 'string' ? err.error : 'Lỗi máy chủ. Vui lòng thử lại.';
            this.notification.error('Thất bại', msg);
          }
        });
      };

      // If using upload mode and an image was selected, upload it first
      if (this.uploadMode === 'upload' && this._resizedBlob) {
        this.notification.info('Đang xử lý', 'Đang tải ảnh lên máy chủ...');
        this.uploadResizedImage()
          .then((url) => doSubmit(url))
          .catch(() => {
            this.notification.error('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại hoặc dùng URL.');
            this.isSubmitting = false;
          });
      } else {
        doSubmit();
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
