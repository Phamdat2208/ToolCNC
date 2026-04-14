import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './page-breadcrumb.component.html',
  styleUrl: './page-breadcrumb.component.css'
})
export class PageBreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
