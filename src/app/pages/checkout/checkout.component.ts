import { Component, inject } from '@angular/core';
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
import { OrderService } from '../../services/order.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzStepsModule, NzFormModule, NzInputModule, NzSelectModule, NzButtonModule, NzRadioModule, NzGridModule, NzDividerModule, NzResultModule, NzSpinModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {
  currentStep = 0;
  paymentMethod = 'cod';
  isSubmitting = false;
  orderTrackingNumber = '';
  finalTotal = 0;

  get isTransfer() {
    return this.paymentMethod === 'transfer';
  }

  get steps() {
    if (this.isTransfer) {
      return ['Thông tin giao hàng', 'Xác nhận & Thanh toán', 'Chuyển khoản', 'Hoàn tất'];
    }
    return ['Thông tin giao hàng', 'Xác nhận & Thanh toán', 'Hoàn tất'];
  }

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private router = inject(Router);
  cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  get cartTotal() {
    return this.cartService.totalAmount;
  }

  validateForm: FormGroup = this.fb.group({
    fullName: [null, [Validators.required]],
    phone: [null, [Validators.required]],
    address: [null, [Validators.required]],
    city: [null, [Validators.required]],
  });

  goHome(): void {
    this.router.navigate(['/']);
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
      city: formVal.city,
      address: formVal.address,
      paymentMethod: this.paymentMethod,
      items: this.cartService.cartItems().map(item => ({
        productId: item.id,
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
