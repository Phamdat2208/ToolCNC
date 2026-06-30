import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, AfterViewInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ToastService } from '../../../services/toast.service';
import { UserService } from '../../../services/user.service';
import { LoadingComponent } from "../../../shared/components/loading/loading.component";
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { USER_ROLE_MAP, USER_STATUS_MAP } from '../../../shared/constants/status-maps';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ModalService } from '../../../services/modal.service';
import { BaseTableComponent } from '../../../shared/components/base-table/base-table.component';
import { TableColumn, TableConfig, TablePageEvent } from '../../../models/table.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTagModule,
    NzAvatarModule,
    NzSelectModule,
    LoadingComponent,
    StatusTagComponent,
    NzDividerModule,
    NzIconModule,
    NzButtonModule,
    BaseTableComponent,
    PaginationComponent
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit, AfterViewInit {
  @ViewChild('avatarCell') avatarCell!: TemplateRef<any>;
  @ViewChild('usernameCell') usernameCell!: TemplateRef<any>;
  @ViewChild('fullNameCell') fullNameCell!: TemplateRef<any>;
  @ViewChild('roleCell') roleCell!: TemplateRef<any>;
  @ViewChild('statusCell') statusCell!: TemplateRef<any>;
  @ViewChild('actionCell') actionCell!: TemplateRef<any>;

  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private modalService = inject(ModalService);
  private cdr = inject(ChangeDetectorRef);
  
  users: User[] = [];
  totalUsers = 0;
  statusFilter: 'ALL' | 'ACTIVE' | 'LOCKED' | 'DELETED' = 'ALL';
  
  loading = true;
  readonly USER_ROLE_MAP = USER_ROLE_MAP;
  readonly USER_STATUS_MAP = USER_STATUS_MAP;
  page = 1;
  size = 10;

  columns: TableColumn<User>[] = [];
  tableConfig: TableConfig = {
    showPagination: true,
    pageSize: 10,
    pageSizeOptions: [10, 20, 50, 100],
    showSizeChanger: true,
    scrollX: '800px'
  };

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.columns = [
      { key: 'avatar', label: 'Người dùng', width: '120px', align: 'center', cellTemplate: this.avatarCell },
      { key: 'username', label: 'Email / Username', width: '220px', align: 'left', cellTemplate: this.usernameCell },
      { key: 'fullName', label: 'Họ tên', width: '200px', align: 'left', cellTemplate: this.fullNameCell },
      { key: 'role', label: 'Quyền hạn', width: '150px', align: 'center', cellTemplate: this.roleCell },
      { key: 'status', label: 'Trạng thái', width: '150px', align: 'center', cellTemplate: this.statusCell },
      { key: 'action', label: 'Thao tác', width: '100px', align: 'center', fixed: 'right', cellTemplate: this.actionCell }
    ];
    this.cdr.detectChanges();
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAllUsers(this.page, this.size, this.statusFilter).subscribe({
      next: (res) => {
        this.users = res?.content || [];
        this.totalUsers = res?.totalElements || 0;
        this.loading = false;
      },
      error: (err) => {
        this.users = [];
        this.totalUsers = 0;
        this.toastService.showError('Không thể tải danh sách người dùng');
        this.loading = false;
        console.error(err);
      }
    });
  }

  applyFilter() {
    this.page = 1;
    this.loadUsers();
  }

  lockUser(id: number) {
    this.modalService.confirm({
      title: 'Thông báo',
      content: 'Bạn có chắc chắn muốn khóa người dùng này? Hành động này có thể được hoàn tác sau.',
      okText: 'Khóa',
      cancelText: 'Đóng',
      type: 'info'
    }, async () => {
      try {
        await firstValueFrom(this.userService.lockUser(id));
        this.toastService.showSuccess('Người dùng đã được khóa');
        this.loadUsers();
      } catch (err) {
        this.toastService.showError('Không thể khóa người dùng');
        console.error(err);
      }
    });
  }

  unlockUser(id: number) {
    this.modalService.confirm({
      title: 'Thông báo',
      content: 'Bạn có chắc chắn muốn mở khóa người dùng này?',
      okText: 'Mở khóa',
      cancelText: 'Đóng',
      type: 'info'
    }, async () => {
      try {
        await firstValueFrom(this.userService.unlockUser(id));
        this.toastService.showSuccess('Người dùng đã được mở khóa');
        this.loadUsers();
      } catch (err) {
        this.toastService.showError('Không thể mở khóa người dùng');
        console.error(err);
      }
    });
  }

  deleteUser(id: number) {
    this.modalService.confirm({
      title: 'Thông báo',
      content: 'Bạn có chắc chắn muốn xóa người dùng này? Tài khoản sẽ chuyển sang trạng thái Đã xóa.',
      okText: 'Xóa',
      cancelText: 'Đóng',
      type: 'danger'
    }, async () => {
      try {
        await firstValueFrom(this.userService.deleteUser(id));
        this.toastService.showSuccess('Người dùng đã được xóa');
        this.loadUsers();
      } catch (err) {
        this.toastService.showError('Không thể xóa người dùng');
        console.error(err);
      }
    });
  }

  onTablePageChange(event: TablePageEvent) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMobilePageChange(index: number) {
    this.page = index;
    this.loadUsers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMobilePageSizeChange(size: number) {
    this.size = size;
    this.page = 1;
    this.loadUsers();
  }
}
