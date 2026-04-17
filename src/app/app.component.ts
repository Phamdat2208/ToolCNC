import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpeedDialComponent } from './shared/components/speed-dial/speed-dial.component';

import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { CustomToastComponent } from './shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SpeedDialComponent, NzBackTopModule, NzIconModule, CustomToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private router = inject(Router);
  isLoginRoute = false;
  isAdminRoute = false;

  title = 'tool-cnc-app';

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
      this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
    });
  }
}

