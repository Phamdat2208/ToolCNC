import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast } from '../../models/toast.model'; 

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  
  private idCounter = 0;
  private readonly MAX_TOASTS = 3;

  showSuccess(message: string) {
    this.addToast(message, 'success');
  }

  showError(message: string) {
    this.addToast(message, 'error');
  }

  showWarning(message: string) {
    this.addToast(message, 'warning');
  }

  showInfo(message: string) {
    this.addToast(message, 'info');
  }

  private addToast(message: string, type: Toast['type']) {
    const toast: Toast = { id: this.idCounter++, message, type };
    
    // Nếu vượt quá tối đa 3 toast, xóa cái cũ nhất (đầu danh sách)
    if (this.toasts.length >= this.MAX_TOASTS) {
      this.toasts.shift();
    }

    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    // Tự động xóa sau 4 giây (tăng thêm chút để người dùng kịp đọc)
    setTimeout(() => this.remove(toast.id), 4000);
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }
}