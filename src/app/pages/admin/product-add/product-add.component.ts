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
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { BrandService, Brand } from '../../../services/brand.service';
import { CloudinaryService } from '../../../services/cloudinary.service';

import { CustomInputComponent } from '../../../shared/components/custom-input/custom-input.component';
import { CustomSelectComponent, SelectOption } from '../../../shared/components/custom-select/custom-select.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { environment } from '../../../../environments/environment';
import { UrlUtils } from '../../../shared/utils/url-utils';

@Component({
  selector: 'app-product-add',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NzFormModule, NzInputModule, NzButtonModule, NzInputNumberModule, NzTabsModule, NzSelectModule, NzRadioModule, NzDividerModule, NzIconModule, NzSwitchModule, NzTableModule, ImageCropperComponent, CustomInputComponent, CustomSelectComponent],
  templateUrl: './product-add.component.html',
  styleUrl: './product-add.component.css'
})
export class ProductAddComponent implements OnInit {
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  isEditMode: boolean = false;
  productId: number | null = null;

  // --- Image upload state (MAIN) ---
  uploadMode: 'url' | 'upload' = 'url';
  originalImageSrc: string | null = null;
  previewImageSrc: string | null = null;
  resizeWidth: number = 800;
  resizeHeight: number = 600;
  isResizing = false;
  private _mainSelectedFile: File | null = null;
  private _mainResizedBlob: Blob | null = null;
  
  // --- Cropper state (MAIN) ---
  imageChangedEvent: Event | null = null;
  croppedImage: string = '';
  showCropper: boolean = false;

  // --- Gallery ---
  galleryUrls: string[] = [];
  newGalleryUrl: string = '';
  readonly MAX_GALLERY = 8;
  isGalleryUploading = false;
  private _gallerySelectedFile: File | null = null;
  private _galleryResizedBlob: Blob | null = null;

  // --- Gallery Cropper state ---
  galleryChangedEvent: Event | null = null;
  galleryCroppedImage: string = '';
  galleryShowCropper: boolean = false;
  galleryOriginalSrc: string | null = null;

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
  private brandService = inject(BrandService);
  private location = inject(Location);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private cloudinaryService = inject(CloudinaryService);

  isSubmitting = false;
  categories: any[] = [];
  categoryOptions: SelectOption[] = [];
  brandOptions: SelectOption[] = [];

  productForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    sku: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    brandId: [null, [Validators.required]],
    categoryId: [null, [Validators.required]],
    totalStock: [10, [Validators.required, Validators.min(0)]],
    description: [''],
    imageUrl: [''],
    hasVariants: [false],
    specifications: this.fb.array([]),
    variants: this.fb.array([])
  });

  get specifications(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  get variants(): FormArray {
    return this.productForm.get('variants') as FormArray;
  }

  getFullUrl(url: string | null | undefined): string {
    return UrlUtils.getFullUrl(url);
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

  addVariant(data: any = null): void {
    const variantGroup = this.fb.group({
      id: [data?.id || null],
      sku: [data?.sku || ''],
      variantName: [data?.variantName || '', [Validators.required]],
      price: [data?.price || this.productForm.get('price')?.value || 0, [Validators.required, Validators.min(0)]],
      stock: [data?.stock || 0, [Validators.required, Validators.min(0)]]
    });
    this.variants.push(variantGroup);
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
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
        const options: SelectOption[] = [];
        this.flattenCategories(list, 0, options);
        this.categoryOptions = options;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  loadBrands(): void {
    this.brandService.getBrands().subscribe({
      next: (list) => {
        this.brandOptions = list.map(b => ({
          label: b.name,
          value: b.id!
        }));
      },
      error: (err) => console.error('Error loading brands', err)
    });
  }

  flattenCategories(data: any[], level: number, result: SelectOption[]) {
    data.forEach(node => {
      result.push({
        label: `${'-- '.repeat(level)}${node.name}`,
        value: node.id
      });

      if (node.children && node.children.length > 0) {
        this.flattenCategories(node.children, level + 1, result);
      }
    });
  }

  triggerFileInput(target: 'main' | 'gallery' = 'main') {
    // We can use a local flag to tell onFileSelected where to put the data
    const input = this.fileInputRef?.nativeElement;
    if (input) {
      input.setAttribute('data-target', target);
      input.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const target = input.getAttribute('data-target') || 'main';
    const file = input.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      this.notification.error('Lỗi', 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP)');
      return;
    }

    if (target === 'gallery') {
      this._gallerySelectedFile = file;
      this.galleryChangedEvent = event;
      this.galleryShowCropper = true;
    } else {
      this._mainSelectedFile = file;
      this.imageChangedEvent = event;
      this.showCropper = true;
    }
  }

  // Called by the MAIN image cropper
  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = event.base64;
    } else if (event.objectUrl) {
      this.croppedImage = event.objectUrl;
    }
  }

  // Called by the GALLERY image cropper 
  galleryCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.galleryCroppedImage = event.base64;
    } else if (event.objectUrl) {
      this.galleryCroppedImage = event.objectUrl;
    }
  }

  // Confirm crop for MAIN image
  confirmCrop() {
    this.showCropper = false;
    this.originalImageSrc = this.croppedImage;

    const img = new Image();
    img.onload = () => {
      this.resizeWidth = img.naturalWidth;
      this.resizeHeight = img.naturalHeight;
      this.applyResize();
    };
    img.src = this.croppedImage;
  }

  // Confirm crop for GALLERY image (auto resize 800x800 then upload)
  confirmGalleryCrop() {
    this.galleryShowCropper = false;
    this.galleryOriginalSrc = this.galleryCroppedImage;

    // Auto resize 800x800
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 800, 800);
      canvas.toBlob((blob) => {
        if (blob) {
          this._galleryResizedBlob = blob;
          this.uploadAndAddGallery();
        }
      }, 'image/jpeg', 0.85);
    };
    img.src = this.galleryCroppedImage;
  }

  cancelGalleryCrop() {
    this.galleryShowCropper = false;
    this.galleryChangedEvent = null;
    this.galleryCroppedImage = '';
    this.galleryOriginalSrc = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // Internal helper for chaining resize and upload
  private applyResizeInternal(callback?: () => void) {
    if (!this.originalImageSrc) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = this.resizeWidth;
      canvas.height = this.resizeHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, this.resizeWidth, this.resizeHeight);
      this.previewImageSrc = canvas.toDataURL('image/jpeg', 0.85);
      canvas.toBlob((blob) => {
        if (blob) {
          this._mainResizedBlob = blob;
          if (callback) callback();
        }
      }, 'image/jpeg', 0.85);
    };
    img.src = this.originalImageSrc;
  }

  uploadAndAddGallery() {
    if (this.galleryUrls.length >= this.MAX_GALLERY) {
      this.notification.warning('Giới hạn', `Đã đạt tối đa ${this.MAX_GALLERY} ảnh`);
      return;
    }

    this.isGalleryUploading = true;
    this.notification.info('Đang xử lý', 'Đang tải ảnh bổ sung lên hệ thống...');
    
    this.uploadResizedImage(this._galleryResizedBlob, this._gallerySelectedFile)
      .then((url) => {
        this.galleryUrls.push(url);
        this.notification.success('Thành công', 'Đã thêm ảnh vào thư viện');
        this.isGalleryUploading = false;
        // Only clear gallery state
        this.galleryShowCropper = false;
        this.galleryChangedEvent = null;
        this.galleryCroppedImage = '';
        this.galleryOriginalSrc = null;
        this._galleryResizedBlob = null;
        this._gallerySelectedFile = null;
        if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
      })
      .catch((err) => {
        console.error(err);
        this.notification.error('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
        this.isGalleryUploading = false;
      });
  }

  cancelCrop() {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this.croppedImage = '';
    this.originalImageSrc = null;
    this.previewImageSrc = null;
    this._mainResizedBlob = null;
    this._mainSelectedFile = null;
    if (this.fileInputRef) this.fileInputRef.nativeElement.value = '';
  }

  applyPreset(preset: { w: number; h: number }) {
    this.resizeWidth = preset.w;
    this.resizeHeight = preset.h;
    this.applyResize();
  }

  applyResize() {
    this.isResizing = true;
    this.applyResizeInternal(() => {
      this.isResizing = false;
    });
  }

  uploadResizedImage(blob: Blob | null, selectedFile: File | null): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!blob) { reject('Không có hình ảnh để tải lên'); return; }

      this.cloudinaryService.uploadImage(blob)
        .subscribe({
          next: (res) => resolve(res.secure_url),
          error: (err) => {
            console.error('Lỗi upload Cloudinary:', err);
            reject(err);
          }
        });
    });
  }

  clearUploadedImage() {
    this.originalImageSrc = null;
    this.previewImageSrc = null;
    this.imageChangedEvent = null;
    this.croppedImage = '';
    this.showCropper = false;
    this._mainSelectedFile = null;
    this._mainResizedBlob = null;
    
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
          sku: product.sku,
          price: product.price,
          brandId: product.brand?.id,
          categoryId: product.category?.id,
          totalStock: product.totalStock,
          description: product.description,
          imageUrl: product.imageUrl,
          hasVariants: product.hasVariants || false
        });

        // Load variants
        this.variants.clear();
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((v: any) => this.addVariant(v));
        }

        // Load existing gallery images
        if (product.images && product.images.length > 0) {
          this.galleryUrls = product.images.map((img: any) => img.url || img);
        }

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
      const productName = this.productForm.get('name')?.value;

      const finishSubmit = (imageUrl?: string) => {
        const formValue = this.productForm.value;
        const productData = { 
          ...formValue,
          specifications: JSON.stringify(formValue.specifications),
          imageGallery: this.galleryUrls
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

      const startFlow = () => {
        // If using upload mode and an image was selected, upload it first
        if (this.uploadMode === 'upload' && this._mainResizedBlob) {
          this.notification.info('Đang xử lý', 'Đang tải ảnh lên máy chủ...');
          this.uploadResizedImage(this._mainResizedBlob, this._mainSelectedFile)
            .then((url) => finishSubmit(url))
            .catch(() => {
              this.notification.error('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại hoặc dùng URL.');
              this.isSubmitting = false;
            });
        } else {
          finishSubmit();
        }
      };

      // Duplicate check before Cloudinary (Apply for Create Mode)
      if (!this.isEditMode) {
        this.productService.checkDuplicates([productName]).subscribe({
          next: (duplicates) => {
            if (duplicates && duplicates.length > 0) {
              this.notification.error('Trùng lặp', `Sản phẩm "${productName}" đã tồn tại trên hệ thống!`);
              this.isSubmitting = false;
            } else {
              startFlow();
            }
          },
          error: () => startFlow() // Fallback
        });
      } else {
        startFlow();
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

  addGalleryImage(): void {
    const url = this.newGalleryUrl.trim();
    if (!url) return;
    if (this.galleryUrls.length >= this.MAX_GALLERY) {
      this.notification.warning('Giới hạn', `Chỉ được thêm tối đa ${this.MAX_GALLERY} ảnh`);
      return;
    }
    this.galleryUrls.push(url);
    this.newGalleryUrl = '';
  }

  removeGalleryImage(index: number): void {
    this.galleryUrls.splice(index, 1);
  }

}
