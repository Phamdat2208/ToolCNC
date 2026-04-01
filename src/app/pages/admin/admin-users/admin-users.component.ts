import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../services/user.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule, NzAvatarModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  users: any[] = [];
  loading = true;

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
        this.message.error('Không thể tải danh sách người dùng');
        this.loading = false;
        console.error(err);
      }
    });
  }
}
