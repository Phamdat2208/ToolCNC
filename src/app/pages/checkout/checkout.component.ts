import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { LocationService, Province, Ward } from '../../services/location.service';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { CustomSelectComponent, SelectOption } from '../../shared/components/custom-select/custom-select.component';
import { CustomTextareaComponent } from '../../shared/components/custom-textarea/custom-textarea.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    NzStepsModule, 
    NzFormModule, 
    NzInputModule, 
    NzSelectModule, 
    NzButtonModule, 
    NzRadioModule, 
    NzGridModule, 
    NzDividerModule, 
    NzResultModule, 
    NzTagModule, 
    NzIconModule,
    NzToolTipModule,
    CustomInputComponent,
    CustomSelectComponent,
    CustomTextareaComponent,
    LoadingComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  currentStep = 0;
  paymentMethod = 'cod';
  isSubmitting = false;
  orderTrackingNumber = '';
  finalTotal = 0;

  // New Location Fields
  provinces: Province[] = [];
  wards: Ward[] = [];
  provinceOptions: SelectOption[] = [];
  wardOptions: SelectOption[] = [];
  isLoadingProvinces = false;
  isLoadingWards = false;

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private locationService = inject(LocationService);

  ngOnInit(): void {
    this.loadProvinces();

    // Tự động điền dữ liệu từ profile nếu có
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.validateForm.patchValue({
          fullName: this.validateForm.get('fullName')?.value || user.fullName || '',
          phone: this.validateForm.get('phone')?.value || user.phone || ''
        });
      }
    });

    // Nếu quay lại trang này khi đã có dữ liệu, re-validate
    if (this.validateForm.get('fullName')?.value) {
      this.validateForm.get('fullName')?.updateValueAndValidity();
    }

    // Khởi tạo trạng thái disable cho xã/phường nếu chưa chọn tỉnh
    if (!this.validateForm.get('provinceCode')?.value) {
      this.validateForm.get('wardCode')?.disable();
    }
  }

  loadProvinces() {
    this.isLoadingProvinces = true;
    this.locationService.getProvinces().subscribe({
      next: (data) => {
        this.provinces = data;
        this.provinceOptions = data.map(p => ({ label: p.name, value: p.code }));
        this.isLoadingProvinces = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải danh sách tỉnh thành');
        this.isLoadingProvinces = false;
      }
    });
  }

  onProvinceChange(code: number | null) {
    if (!code) {
      // Nếu xóa chọn tỉnh, xóa và disable xã/phường
      this.validateForm.get('wardCode')?.disable();
      this.validateForm.patchValue({ provinceName: null, wardCode: null, wardName: null });
      this.wards = [];
      this.wardOptions = [];
      return;
    }

    const province = this.provinces.find(p => p.code === code);
    if (province) {
      this.validateForm.get('wardCode')?.enable();
      this.validateForm.patchValue({ provinceName: province.name, wardCode: null, wardName: null });
    }
    
    this.wards = [];
    this.wardOptions = [];
    this.isLoadingWards = true;
    this.locationService.getWards(code).subscribe({
      next: (data) => {
        this.wards = data;
        this.wardOptions = data.map(w => ({ label: w.name, value: w.code }));
        this.isLoadingWards = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể tải danh sách xã/phường');
        this.isLoadingWards = false;
      }
    });
  }

  onWardChange(code: number) {
    const ward = this.wards.find(w => w.code === code);
    if (ward) {
      this.validateForm.patchValue({ wardName: ward.name });
    }
  }

  get isTransfer() {
    return this.paymentMethod === 'transfer';
  }

  get steps() {
    if (this.isTransfer) {
      return ['Thông tin giao hàng', 'Xác nhận & Thanh toán', 'Chuyển khoản', 'Hoàn tất'];
    }
    return ['Thông tin giao hàng', 'Xác nhận & Thanh toán', 'Hoàn tất'];
  }

  get cartTotal() {
    return this.cartService.totalAmount;
  }

  get totalItems() {
    return this.cartService.totalItems;
  }

  validateForm: FormGroup = this.fb.group({
    fullName: [null, [Validators.required]],
    phone: [
      null,
      [
        Validators.pattern((/^(0|\+84)\d+$/)),
        Validators.minLength(10), Validators.maxLength(11)
      ]
    ],
    provinceCode: [null, [Validators.required]],
    provinceName: [null, [Validators.required]],
    wardCode: [null, [Validators.required]],
    wardName: [null, [Validators.required]],
    address: [null, [Validators.required]],
  });

  goHome(): void {
    this.router.navigate(['/']);
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notification.success('Đã sao chép', `Nội dung: ${text}`);
    });
  }

  // MOCK DATA for Success Screen
  checkedOutItems: any[] = [];

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
    }
  }

  private submitOrder(onSuccessStep: number, successMsg: string) {
    this.isSubmitting = true;
    const formVal = this.validateForm.value;

    const payload = {
      fullName: formVal.fullName,
      phone: formVal.phone,
      provinceCode: formVal.provinceCode,
      provinceName: formVal.provinceName,
      wardCode: formVal.wardCode,
      wardName: formVal.wardName,
      address: formVal.address,
      paymentMethod: this.paymentMethod,
      items: this.cartService.cartItems().map(item => ({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    };

    this.orderService.createOrder(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.orderTrackingNumber = res.trackingNumber;

        // Lấy items ra review trước khi clear giỏ hàng
        this.checkedOutItems = [...this.cartService.cartItems()];
        this.finalTotal = this.cartService.totalAmount;

        this.cartService.clearCart();

        this.currentStep = onSuccessStep;
        this.notification.success('Đặt hàng thành công!', successMsg);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Lỗi đặt hàng', err);
        this.notification.error('Đặt hàng thất bại', 'Đã có lỗi xảy ra trong quá trình đặt hàng, vui lòng thử lại!');
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 0) {
      if (this.validateForm.valid) {
        this.currentStep += 1;
      } else {
        Object.values(this.validateForm.controls).forEach(control => {
          if (control.invalid) {
            control.markAsDirty();
            control.updateValueAndValidity({ onlySelf: true });
          }
        });
      }
    } else if (this.currentStep === 1) {
      if (!this.authService.isLoggedIn()) {
        this.notification.error('Chưa đăng nhập', 'Vui lòng đăng nhập để tiến hành đặt hàng.');
        this.router.navigate(['/login']);
        return;
      }

      if (this.isTransfer) {
        // Chỉ lưu thông tin, nhảy step QR, CHƯA ĐẶT HÀNG!
        this.finalTotal = this.cartService.totalAmount;
        this.currentStep = 2;
      } else {
        // COD - đặt hàng luôn
        this.submitOrder(2, 'Chờ điện thoại xác nhận.\nGiỏ hàng đã được làm trống.');
      }
    }
  }

  confirmTransfer() {
    this.submitOrder(3, 'Chúng tôi sẽ kiểm tra thanh toán ngân hàng và liên hệ với bạn.');
  }
}