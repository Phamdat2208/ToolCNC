import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AuthService } from '../../services/auth.service';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    NzFormModule, NzButtonModule, NzCheckboxModule, NzTypographyModule, NzIconModule, CustomInputComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    remember: [true]
  });

  isLoading = false;

  submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login({
        username: this.loginForm.value.username,
        password: this.loginForm.value.password
      }).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.toastService.showSuccess(`Đăng nhập thành công! Chào mừng ${res.username} trở lại!`);
          this.router.navigate(['/']); // Redirect to home
        },
        error: (err) => {
          this.isLoading = false;
          let errorMsg = 'Có lỗi xảy ra, vui lòng thử lại sau.';
          if (err.status === 401 || err.status === 403) {
            errorMsg = 'Tên đăng nhập hoặc mật khẩu không đúng.';
          }
          this.toastService.showError(errorMsg);
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
