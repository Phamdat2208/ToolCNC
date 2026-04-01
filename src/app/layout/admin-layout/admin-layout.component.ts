import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzButtonModule,
    NzAvatarModule,
    NzDropDownModule,
  ],
  template: `
    <nz-layout class="admin-layout">
      <nz-sider 
        nzCollapsible 
        [(nzCollapsed)]="isCollapsed" 
        [nzWidth]="260" 
        [nzCollapsedWidth]="0"
        nzBreakpoint="lg"
        nzTheme="dark" 
        class="admin-sider"
      >
        <div class="logo-wrapper">
          <span class="logo-icon">T</span>
          <span class="logo-text" *ngIf="!isCollapsed">ToolCNC Admin</span>
        </div>
        <ul nz-menu nzTheme="dark" nzMode="inline">
          <li nz-menu-item routerLink="/admin" routerLinkActive="ant-menu-item-selected" [routerLinkActiveOptions]="{exact: true}">
            <nz-icon nzType="dashboard" />
            <span>Thống kê</span>
          </li>
          <li nz-menu-item nzMatchRouter routerLink="/admin/products">
            <nz-icon nzType="appstore" />
            <span>Quản lý sản phẩm</span>
          </li>
          <li nz-menu-item nzMatchRouter routerLink="/admin/orders">
            <nz-icon nzType="shopping-cart" />
            <span>Quản lý đơn hàng</span>
          </li>
          <li nz-menu-item nzMatchRouter routerLink="/admin/users">
            <nz-icon nzType="team" />
            <span>Người dùng</span>
          </li>
          <li nz-menu-divider></li>
          <li nz-menu-item routerLink="/">
            <nz-icon nzType="home" />
            <span>Về trang chủ</span>
          </li>
        </ul>
      </nz-sider>
      <nz-layout class="main-content-layout">
        <nz-header class="admin-header">
          <div class="header-left">
            <button nz-button nzType="text" (click)="isCollapsed = !isCollapsed">
              <nz-icon [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'" />
            </button>
          </div>
          <div class="header-right">
            <a nz-dropdown [nzDropdownMenu]="userMenu" class="user-dropdown">
              <nz-avatar nzIcon="user" class="admin-avatar"></nz-avatar>
              <span class="username hide-mobile">{{ authService.currentUserValue?.username }}</span>
              <nz-icon nzType="down" />
            </a>
            <nz-dropdown-menu #userMenu="nzDropdownMenu">
              <ul nz-menu>
                <li nz-menu-item (click)="logout()" nzDanger>
                  <nz-icon nzType="logout" /> Đăng xuất
                </li>
              </ul>
            </nz-dropdown-menu>
          </div>
        </nz-header>
        <nz-content class="admin-content">
          <div class="inner-content">
            <router-outlet></router-outlet>
          </div>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .admin-layout {
      min-height: 100vh;
    }
    .admin-sider {
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
      position: relative;
      z-index: 100;
    }
    .logo-wrapper {
      height: 64px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
      background: rgba(255,255,255,0.05);
      margin-bottom: 8px;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      background: var(--primary-color);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: white;
      font-size: 20px;
      flex-shrink: 0;
    }
    .logo-text {
      color: white;
      font-size: 18px;
      font-weight: bold;
      white-space: nowrap;
    }
    .admin-header {
      background: #fff;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      z-index: 10;
    }
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-main);
    }
    .admin-avatar {
      background-color: var(--primary-color);
    }
    .admin-content {
      padding: 24px;
      background: #f0f2f5;
      overflow-x: hidden;
    }
    .inner-content {
      background: transparent;
      min-height: 280px;
      overflow-x: auto;
    }
    
    @media (max-width: 768px) {
      .admin-header {
        padding: 0 12px;
      }
      .admin-content {
        padding: 12px;
      }
      .hide-mobile {
        display: none;
      }
    }

    ::ng-deep .ant-menu-dark.ant-menu-inline .ant-menu-item-selected {
      background-color: var(--primary-color) !important;
    }
    
    /* Handle zero width sider overlay on mobile */
    ::ng-deep .ant-layout-sider-zero-width-trigger {
      display: none; /* Hide default trigger as we use custom button */
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  isCollapsed = false;

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
