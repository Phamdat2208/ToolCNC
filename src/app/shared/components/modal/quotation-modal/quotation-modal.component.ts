import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AuthService } from '../../../../services/auth.service';
import { QuotationService } from '../../../../services/quotation.service';
import { ToastService } from '../../../../services/toast.service';
import { HelperService } from '../../../../services/helper.service';
import { QuantityInputComponent } from '../../quantity-input/quantity-input.component';

@Component({
  selector: 'app-quotation-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzButtonModule,
    NzIconModule,
    QuantityInputComponent
  ],
  templateUrl: './quotation-modal.component.html',
  styleUrl: './quotation-modal.component.css'
})
export class QuotationModalComponent implements OnInit {
  readonly modalData: { 
    productId: number; 
    productName: string; 
    variantId?: number; 
    variantName?: string;
    price?: number;
    maxStock?: number;
  } = inject(NZ_MODAL_DATA);
  private modalRef = inject(NzModalRef);
  private fb = inject(FormBuilder);
  private quotationService = inject(QuotationService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private helperService = inject(HelperService);
  
  quantity = 1;
  availableStock = 0;
  readonly quantityLimit = 99999;
  isSubmitting = false;
  exportExcel = false;

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
      next: async (res) => {
        this.isSubmitting = false;
        this.toastService.showSuccess('Yêu cầu báo giá đã được gửi! Chúng tôi sẽ liên hệ bạn trong thời gian sớm nhất.');
        
        if (this.exportExcel) {
          const formVal = this.form.value;
          await this.helperService.exportQuotationExcel({
            customerName: formVal.customerName,
            customerPhone: formVal.customerPhone,
            customerEmail: formVal.customerEmail,
            companyName: formVal.companyName,
            note: formVal.note,
            items: [{
              name: this.modalData.productName,
              variantName: this.modalData.variantName,
              quantity: this.quantity,
              price: this.modalData.price || 0
            }]
          }, `Bao_Gia_${this.modalData.productName.replace(/\s+/g, '_')}.xlsx`);
        }
        
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
