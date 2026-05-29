import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AuthService } from '../../../../services/auth.service';
import { QuotationService } from '../../../../services/quotation.service';
import { ToastService } from '../../../../services/toast.service';
import { QuantityInputComponent } from '../../quantity-input/quantity-input.component';

@Component({
  selector: 'app-quotation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzIconModule,
    QuantityInputComponent
  ],
  templateUrl: './quotation-modal.component.html',
  styleUrl: './quotation-modal.component.css'
})
export class QuotationModalComponent implements OnInit {
  readonly modalData: { productId: number; productName: string; variantId?: number; maxStock?: number } = inject(NZ_MODAL_DATA);
  private modalRef = inject(NzModalRef);
  private fb = inject(FormBuilder);
  private quotationService = inject(QuotationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  quantity = 1;
  /** Số lượng tồn kho hiện có — chỉ dùng để hiển thị thông tin cho user */
  availableStock = 0;
  /** Giới hạn nhập liệu cho ô số lượng — báo giá có thể yêu cầu vượt tồn kho hiện tại */
  readonly quantityLimit = 99999;

  isSubmitting = false;

  form!: FormGroup;

  onQuantityChange(value: number): void {
    this.quantity = value;
    this.form.get('quantity')?.setValue(value);
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.availableStock = this.modalData.maxStock ?? 0;
    this.form = this.fb.group({
      customerName: [user?.fullName || '', Validators.required],
      customerEmail: [(user as any)?.['email'] || '', [Validators.required, Validators.email]],
      customerPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      companyName: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      note: ['', Validators.maxLength(500)]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(ctrl => ctrl.markAsDirty());
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = {
      ...this.form.value,
      quantity: this.quantity, // Dùng trực tiếp this.quantity để đảm bảo giá trị chính xác nhất
      productId: this.modalData.productId,
      // productName is intentionally omitted: backend resolves it from the database using productId
      variantId: this.modalData.variantId
    };

    this.quotationService.submitQuotation(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Yêu cầu báo giá đã được gửi! Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất.');
        this.modalRef.close();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastService.showError('Gửi yêu cầu thất bại. Vui lòng thử lại sau.');
      }
    });
  }

  cancel(): void {
    this.modalRef.close();
  }
}
