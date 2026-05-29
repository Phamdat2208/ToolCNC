import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpeedDialComponent } from './shared/components/speed-dial/speed-dial.component';

import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CompareService } from './services/compare.service';
import { SeoService } from './services/seo.service';
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
  private seoService = inject(SeoService);
  public compareService = inject(CompareService);
  private subscriptions = new Subscription();
  private modalObserver?: MutationObserver;

  isLoginRoute = false;
  isRegisterRoute = false;
  isAdminRoute = false;
  isModalOpen = false;

  title = 'tool-cnc-app';

  constructor() {
    this.subscriptions.add(
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe((event: any) => {
        this.isLoginRoute = event.urlAfterRedirects.startsWith('/login');
        this.isRegisterRoute = event.urlAfterRedirects.startsWith('/register');
        this.isAdminRoute = event.urlAfterRedirects.startsWith('/admin');
      })
    );
  }

  ngOnInit(): void {
    this.seoService.init();
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
