import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  public scrollToInvalidControl(modalElement?: HTMLElement | Element) {
    const container = modalElement ? modalElement : document;

    // Tìm tất cả các phần tử có class ng-invalid
    const invalidElements = container.querySelectorAll('.ng-invalid');

    // Lọc ra phần tử đầu tiên là control (bỏ qua form, formGroup)
    const firstInvalidControl = Array.from(invalidElements).find((el) => {
      return el.tagName !== 'FORM' &&
        !el.hasAttribute('formGroup') &&
        !el.hasAttribute('formGroupName') &&
        !el.hasAttribute('formArrayName');
    });

    if (!firstInvalidControl) {
      return;
    }

    firstInvalidControl.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Cố gắng tìm phần tử có thể focus bên trong custom component (như input, textarea)
    const inputToFocus = firstInvalidControl.querySelector(
      'input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;

    setTimeout(() => {
      if (inputToFocus) {
        inputToFocus.focus();
      } else {
        (firstInvalidControl as HTMLElement).focus();
      }
    }, 300);
  }
}