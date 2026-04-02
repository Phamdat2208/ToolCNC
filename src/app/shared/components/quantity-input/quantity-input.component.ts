import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-quantity-input',
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './quantity-input.component.html',
  styleUrl: './quantity-input.component.css'
})
export class QuantityInputComponent {
  @Input() quantity: number = 1;
  @Input() maxStock: number = 100;

  @Output() quantityChange = new EventEmitter<number>();

  increase() {
    if (this.quantity < this.maxStock) {
      this.quantity++;
      this.quantityChange.emit(this.quantity);
    }
  }

  decrease() {
    if (this.quantity > 1) {
      this.quantity--;
      this.quantityChange.emit(this.quantity);
    }
  }

  onInputChange(val: number) {
    if (val >= 1 && val <= this.maxStock) {
      this.quantity = val;
      this.quantityChange.emit(this.quantity);
    }
  }

  onBlur() {
    if (this.quantity < 1 || !this.quantity) {
       this.quantity = 1;
       this.quantityChange.emit(this.quantity);
    }
    if (this.quantity > this.maxStock) {
       this.quantity = this.maxStock;
       this.quantityChange.emit(this.quantity);
    }
  }
}
