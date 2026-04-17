import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../services/auth.service';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink,
    NzFormModule, 
    NzButtonModule, 
    NzIconModule, 
    CustomInputComponent
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = false;

  confirmationValidator: ValidatorFn = (control: AbstractControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (this.registerForm && control.value !== this.registerForm.get('password')?.value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  registerForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(4)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, this.confirmationValidator]]
  });

  get confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Vui lòng xác nhận mật khẩu!';
    if (control?.hasError('confirm')) return 'Hai mật khẩu không khớp!';
    return '';
  }

  updateConfirmValidator(): void {
    Promise.resolve().then(() => this.registerForm.get('confirmPassword')?.updateValueAndValidity());
  }

  submitForm(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.authService.register({
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        role: ['user']
      }).subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.showSuccess('Đăng ký thành công! Bạn có thể đăng nhập bằng tài khoản mới.');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false;
          let errorMsg = 'Có lỗi xảy ra, vui lòng thử lại sau.';
          const beMsg: string = (err.error?.message || err.error || '').toLowerCase();
          if (beMsg.includes('username')) {
            errorMsg = 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.';
          } else if (beMsg.includes('email')) {
            errorMsg = 'Email này đã được đăng ký. Vui lòng dùng email khác.';
          }
          this.toastService.showError(errorMsg);
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
