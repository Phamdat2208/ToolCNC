import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-custom-toast',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './custom-toast.component.html',
  styleUrl: './custom-toast.component.css'
})
export class CustomToastComponent {
  public toastService = inject(ToastService);
  private router = inject(Router);
  isLoginRoute = false;
  isAdminRoute = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
      this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
    });
  }

  trackById(index: number, item: any): number {
    return item.id;
  }
}
