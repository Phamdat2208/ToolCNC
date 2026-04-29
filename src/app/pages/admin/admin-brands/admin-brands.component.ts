import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { Brand, BrandService } from '../../../services/brand.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginationComponent } from "../../../shared/components/pagination/pagination.component";

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzFormModule,
    NzInputModule,
    NzModalModule,
    NzToolTipModule,
    NzRadioModule,
    FormsModule,
    ReactiveFormsModule,
    ImageCropperComponent,
    LoadingComponent,
    PaginationComponent
],
  templateUrl: './admin-brands.component.html',
  styleUrl: './admin-brands.component.css'
})
export class AdminBrandsComponent implements OnInit {
  private brandService = inject(BrandService);
  private confirmModalService = inject(ConfirmModalService);
  private fb = inject(FormBuilder);
  private cloudinaryService = inject(CloudinaryService);
  private message = inject(NzMessageService);
  private toastService = inject(ToastService);
  public isLoadingModal = false;

  brands: Brand[] = [];
  loading = true;
  total = 0;
  page = 1;
  size = 10;
  
  // Modal state
  isModalVisible = false;
  isEditMode = false;
  currentBrandId: number | null = null;
  uploadMode: 'url' | 'upload' = 'url';
  
  // Cropper state
  imageChangedEvent: any = null;
  croppedImage: string = '';
  showCropper = false;
  previewLogoSrc: string | null = null;
  private _resizedBlob: Blob | null = null;
  private _selectedFile: File | null = null;

  brandForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    logoUrl: [''],
    description: ['']
  });

  ngOnInit() {
    this.loadBrands();
  }

  loadBrands() {
    this.loading = true;
    this.brandService.adminGetBrands(this.page - 1, this.size).subscribe({
      next: (res) => {
        if (res && res.content) {
          this.brands = res.content;
          this.total = res.totalElements;
        } else if (Array.isArray(res)) {
          this.brands = res;
          this.total = res.length;
        }
        this.loading = false;
      },
      error: () => {
        this.toastService.showError('Không thể tải danh sách thương hiệu');
        this.loading = false;
      }
    });
  }

  showAddModal() {
    this.isEditMode = false;
    this.currentBrandId = null;
    this.uploadMode = 'url';
    this.brandForm.reset();
    this.clearUploadState();
    this.isModalVisible = true;
  }

  showEditModal(brand: Brand) {
    this.isEditMode = true;
    this.currentBrandId = brand.id!;
    this.uploadMode = 'url';
    this.brandForm.patchValue({
      name: brand.name,
      logoUrl: brand.logoUrl,
      description: brand.description
    });
    this.clearUploadState();
    this.isModalVisible = true;
  }

  handleCancel() {
    this.isModalVisible = false;
  }

  onPageIndexChange(index: number) {
    this.page = index;
    this.loadBrands();
  }

  onPageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
    this.loadBrands();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this._selectedFile = file;
      this.imageChangedEvent = event;
      this.showCropper = true;
    }
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = event.base64;
    }
  }

  cancelCrop() {
    this.showCropper = false;
    this.imageChangedEvent = null;
    this._selectedFile = null;
  }

  confirmCrop() {
    this.showCropper = false;
    
    // Auto-resize to exactly 400x400 (Centered with contain logic)
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      
      // Clear background to white (good for logos)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);

      // Draw image centered and contained
      const scale = Math.min(400 / img.width, 400 / img.height);
      const x = (400 - img.width * scale) / 2;
      const y = (400 - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      this.previewLogoSrc = canvas.toDataURL('image/jpeg', 0.9);
      canvas.toBlob((blob) => {
        this._resizedBlob = blob;
      }, 'image/jpeg', 0.9);
    };
    img.src = this.croppedImage;
  }

  clearUploadState() {
    this.imageChangedEvent = null;
    this.croppedImage = '';
    this.showCropper = false;
    this.previewLogoSrc = null;
    this._resizedBlob = null;
    this._selectedFile = null;
  }

  handleOk() {
    this.isLoadingModal = true;
    if (this.brandForm.valid) {
      const submit = (finalLogoUrl?: string) => {
        const data = { ...this.brandForm.value };
        if (finalLogoUrl) data.logoUrl = finalLogoUrl;

        const request$ = (this.isEditMode && this.currentBrandId)
          ? this.brandService.updateBrand(this.currentBrandId, data)
          : this.brandService.createBrand(data);

        request$.subscribe({
          next: () => {
            this.toastService.showSuccess(this.isEditMode ? 'Cập nhật thành công' : 'Thêm thành công');
            this.isModalVisible = false;
            this.loadBrands();
          },
          error: (err: any) => this.toastService.showError(err.error?.message || 'Lỗi khi lưu dữ liệu')
        });
      };

      if (this.uploadMode === 'upload' && this._resizedBlob) {
        this.message.loading('Đang xử lý logo...', { nzDuration: 0 });
        this.uploadLogo().then(url => {
          this.message.remove();
          submit(url);
        }).catch(() => {
          this.message.remove();
          this.toastService.showError('Không thể tải logo lên');
        });
      } else {
        submit();
      }
    }
  }

  uploadLogo(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._resizedBlob) return reject('Không có logo để tải lên');
      
      this.cloudinaryService.uploadImage(this._resizedBlob)
        .subscribe({
          next: (res) => resolve(res.secure_url),
          error: (err) => {
            console.error('Lỗi upload logo lên Cloudinary:', err);
            reject(err);
          }
        });
    });
  }

  deleteBrand(id: number) {
    this.confirmModalService.confirm({
      title: 'Xác nhận xóa',
      content: 'Dữ liệu thương hiệu này sẽ bị gỡ bỏ khỏi hệ thống. Bạn có chắc chắn?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    }, () => {
      this.brandService.deleteBrand(id).subscribe({
        next: () => {
          this.toastService.showSuccess('Xóa thành công');
          this.loadBrands();
        },
        error: () => this.toastService.showError('Lỗi khi xóa thương hiệu')
      });
    });
  }
}
