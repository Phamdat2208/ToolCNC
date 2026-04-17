import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { UserService } from '../../../services/user.service';
import { LoadingComponent } from "../../../shared/components/loading/loading.component";
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule, NzAvatarModule, PaginationComponent, LoadingComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  users: any[] = [];
  loading = true;
  page = 1;
  size = 10;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.toastService.showError('Không thể tải danh sách người dùng');
        this.loading = false;
        console.error(err);
      }
    });
  }

  onPageChange(index: number) {
    this.page = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
  }
}
