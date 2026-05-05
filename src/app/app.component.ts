import { Component, inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpeedDialComponent } from './shared/components/speed-dial/speed-dial.component';

import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { CustomToastComponent } from './shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, SpeedDialComponent, NzBackTopModule, NzIconModule, CustomToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();
  private modalObserver?: MutationObserver;

  isLoginRoute = false;
  isAdminRoute = false;
  isModalOpen = false;

  title = 'tool-cnc-app';

  constructor() {
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
        this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
      })
    );
  }

  ngOnInit(): void {
    // Use MutationObserver to detect when Ng-Zorro adds/removes modal masks in the DOM.
    // This avoids NG0100 by updating state outside Angular's change detection cycle,
    // then calling detectChanges() manually.
    this.modalObserver = new MutationObserver(() => {
      const hasModal = document.querySelectorAll('.ant-modal-mask').length > 0;
      if (this.isModalOpen !== hasModal) {
        this.isModalOpen = hasModal;
        this.cdr.detectChanges();
      }
    });

    this.modalObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.modalObserver?.disconnect();
  }
}
