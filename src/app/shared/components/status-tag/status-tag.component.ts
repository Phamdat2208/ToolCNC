import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { StatusMap } from '../../../models/status-tag.model';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  templateUrl: './status-tag.component.html',
  styleUrl: './status-tag.component.css'
})
export class StatusTagComponent implements OnChanges {
  @Input() status: string = '';
  @Input() statusMap: StatusMap = {};
  @Input() fallbackLabel?: string;
  @Input() customClass: string = '';

  resolvedLabel: string = '';
  resolvedColor: string = 'default';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status'] || changes['statusMap']) {
      this.resolveStatus();
    }
  }

  private resolveStatus(): void {
    if (!this.status) {
      this.resolvedLabel = this.fallbackLabel || '';
      this.resolvedColor = 'default';
      return;
    }

    const upperStatus = this.status.toUpperCase();
    const config = this.statusMap[upperStatus];

    if (config) {
      this.resolvedLabel = config.label;
      this.resolvedColor = config.color;
    } else {
      this.resolvedLabel = this.fallbackLabel || this.status;
      this.resolvedColor = 'default';
    }
  }
}
