import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

export interface ConfirmModalData {
  title: string;
  content: string;
  okText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'success' | 'danger';
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.css'
})
export class ConfirmModalComponent {
  modal = inject(NzModalRef);
  data: ConfirmModalData = inject(NZ_MODAL_DATA);

  get iconType(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'danger': return 'close-circle';
      case 'success': return 'check-circle';
      default: return 'info-circle';
    }
  }

  get iconColorClass(): string {
    switch (this.data.type) {
      case 'warning': return 'text-warning';
      case 'danger': return 'text-danger';
      case 'success': return 'text-success';
      default: return 'text-primary';
    }
  }

  handleOk(): void {
    this.modal.triggerOk();
  }

  handleCancel(): void {
    this.modal.triggerCancel();
  }
}
