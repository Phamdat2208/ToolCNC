import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../../services/auth.service';
import { CustomInputComponent } from '../../shared/components/custom-input/custom-input.component';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    NzDescriptionsModule, 
    NzButtonModule,
    ReactiveFormsModule,
    CustomInputComponent,
    LoadingComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);
  fb = inject(FormBuilder);
  message = inject(NzMessageService);

  userInfo: any = null;
  isLoadingProfile = true;
  isSaving = false;
  editMode = false;
  profileForm!: FormGroup;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.initForm();
    this.loadProfile();
  }

  initForm() {
    this.profileForm = this.fb.group({
      fullName: [''],
      phone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]]
    });
  }

  loadProfile() {
    this.isLoadingProfile = true;
    this.authService.fetchMe().subscribe({
      next: (data) => {
        this.userInfo = data;
        this.profileForm.patchValue({
          fullName: data.fullName || '',
          phone: data.phone || ''
        });
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Lỗi lấy profile', err);
        this.userInfo = this.authService.currentUserValue;
        this.isLoadingProfile = false;
      }
    });
  }

  toggleEdit() {
    this.editMode = true;
  }

  cancelEdit() {
    this.editMode = false;
    if (this.userInfo) {
      this.profileForm.patchValue({
        fullName: this.userInfo.fullName || '',
        phone: this.userInfo.phone || ''
      });
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      Object.values(this.profileForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSaving = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.message.success('Cập nhật hồ sơ thành công');
        this.userInfo = { ...this.userInfo, ...this.profileForm.value };
        this.editMode = false;
        this.isSaving = false;
      },
      error: (err) => {
        this.message.error('Lỗi cập nhật hồ sơ');
        this.isSaving = false;
      }
    });
  }
}
