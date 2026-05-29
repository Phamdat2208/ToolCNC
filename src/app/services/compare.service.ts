import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CompareProduct } from '../models/compare.model';
import { ToastService } from './toast.service';

const COMPARE_STORAGE_KEY = 'toolcnc_compare';
const MAX_COMPARE_ITEMS = 4;

@Injectable({ providedIn: 'root' })
export class CompareService {
  private toastService = inject(ToastService);
  private compareSubject = new BehaviorSubject<CompareProduct[]>(this.loadFromStorage());

  compareList$: Observable<CompareProduct[]> = this.compareSubject.asObservable();

  get compareList(): CompareProduct[] {
    return this.compareSubject.value;
  }

  addToCompare(product: CompareProduct): void {
    const current = this.compareSubject.value;

    if (this.isInCompare(product.id)) {
      this.toastService.showInfo(`"${product.name}" đã có trong danh sách so sánh`);
      return;
    }

    if (current.length >= MAX_COMPARE_ITEMS) {
      this.toastService.showWarning(`Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm`);
      return;
    }

    const updated = [...current, product];
    this.compareSubject.next(updated);
    this.saveToStorage(updated);
  }

  removeFromCompare(productId: number): void {
    const updated = this.compareSubject.value.filter(p => p.id !== productId);
    this.compareSubject.next(updated);
    this.saveToStorage(updated);
  }

  clearCompare(): void {
    this.compareSubject.next([]);
    sessionStorage.removeItem(COMPARE_STORAGE_KEY);
  }

  isInCompare(productId: number): boolean {
    return this.compareSubject.value.some(p => p.id === productId);
  }

  private saveToStorage(products: CompareProduct[]): void {
    try {
      sessionStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(products));
    } catch {
      // sessionStorage unavailable
    }
  }

  private loadFromStorage(): CompareProduct[] {
    try {
      const stored = sessionStorage.getItem(COMPARE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
