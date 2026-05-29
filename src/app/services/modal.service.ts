import { inject, Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  ConfirmModalComponent,
  ConfirmModalData,
} from '../shared/components/confirm-modal/confirm-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalService = inject(NzModalService);

  confirm(
    data: ConfirmModalData,
    onOk: () => Promise<unknown> | void,
    onCancel?: () => void,
  ): void {
    const modal = this.modalService.create<ConfirmModalComponent>({
      nzContent: ConfirmModalComponent,
      nzData: data,
      nzFooter: null,
      nzCentered: true,
      nzWidth: 400,
      nzClassName: 'premium-confirm-modal',
      nzMaskClosable: false,
      nzClosable: false,
      nzOnOk: async () => {
        const instance = modal.getContentComponent();
        instance?.isOkLoading.set(true);
        try {
          await onOk();
        } finally {
          instance?.isOkLoading.set(false);
        }
      },
      nzOnCancel: () => {
        if (onCancel) onCancel();
      },
    });
  }

  createCustomModal(
    title: string,
    component: any,
    data: any,
    nzWidth: number,
    isBtnClose: boolean,
    onOk: () => Promise<unknown> | void,
    onCancel?: () => void,
  ) {
    const modal = this.modalService.create<any>({
      nzTitle: title,
      nzContent: component,
      nzData: data,
      nzFooter: null,
      nzCentered: true,
      nzWidth: nzWidth,
      nzClassName: 'premium-confirm-modal',
      nzMaskClosable: false,
      nzClosable: isBtnClose,
      nzOnOk: async () => {
        const instance = modal.getContentComponent();
        instance?.isOkLoading.set(true);
        try {
          await onOk();
        } finally {
          instance?.isOkLoading.set(false);
        }
      },
      nzOnCancel: () => {
        if (onCancel) onCancel();
      },
    });
  }
}
