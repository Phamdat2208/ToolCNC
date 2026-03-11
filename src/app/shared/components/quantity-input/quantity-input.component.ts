import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-quantity-input',
  imports: [CommonModule, FormsModule, NzInputNumberModule],
  templateUrl: './quantity-input.component.html',
  styleUrl: './quantity-input.component.css'
})
export class QuantityInputComponent {
  @Input() quantity: number = 1;
  @Input() maxStock: number = 100;

  @Output() quantityChange = new EventEmitter<number>();

  onQuantityChange(value: number) {
    this.quantity = value;
    this.quantityChange.emit(this.quantity);
  }
}
