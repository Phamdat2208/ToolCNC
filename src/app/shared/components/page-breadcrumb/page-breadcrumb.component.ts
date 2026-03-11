import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  imports: [CommonModule, RouterLink, NzBreadCrumbModule],
  templateUrl: './page-breadcrumb.component.html',
  styleUrl: './page-breadcrumb.component.css'
})
export class PageBreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
