import { inject, Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ConfirmModalComponent, ConfirmModalData } from '../components/confirm-modal/confirm-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ConfirmModalService {
  private modalService = inject(NzModalService);

  confirm(data: ConfirmModalData, onOk: () => void, onCancel?: () => void): void {
    const modal = this.modalService.create({
      nzContent: ConfirmModalComponent,
      nzData: data,
      nzFooter: null, // Chúng ta dùng footer tự định nghĩa trong component
      nzCentered: true,
      nzWidth: 400,
      nzClassName: 'premium-confirm-modal',
      nzMaskClosable: false,
      nzClosable: false,
      nzOnOk: () => {
        if (onOk) onOk();
      },
      nzOnCancel: () => {
        if (onCancel) onCancel();
      }
    });
  }
}
