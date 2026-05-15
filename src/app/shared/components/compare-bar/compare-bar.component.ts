import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CompareProduct } from '../../../models/compare.model';
import { CompareService } from '../../../services/compare.service';

@Component({
  selector: 'app-compare-bar',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzToolTipModule],
  templateUrl: './compare-bar.component.html',
  styleUrl: './compare-bar.component.css'
})
export class CompareBarComponent {
  compareService = inject(CompareService);
  private router = inject(Router);

  readonly placeholders = [0, 1, 2, 3];

  getProductAtSlot(index: number): CompareProduct | null {
    return this.compareService.compareList[index] ?? null;
  }

  remove(productId: number): void {
    this.compareService.removeFromCompare(productId);
  }

  clear(): void {
    this.compareService.clearCompare();
  }

  goToCompare(): void {
    this.router.navigate(['/compare']);
  }

  get canCompare(): boolean {
    return this.compareService.compareList.length >= 2;
  }
}
