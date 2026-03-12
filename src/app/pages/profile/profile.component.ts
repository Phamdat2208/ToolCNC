import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NzDescriptionsModule, NzSpinModule, NzIconModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);

  userInfo: any = null;
  isLoadingProfile = true;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
  }

  loadProfile() {
    this.isLoadingProfile = true;
    const token = this.authService.getToken();
    this.http.get<any>('http://localhost:8080/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.userInfo = data;
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Lỗi lấy profile', err);
        this.userInfo = this.authService.currentUserValue;
        this.isLoadingProfile = false;
      }
    });
  }
}
