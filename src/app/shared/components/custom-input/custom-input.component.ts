import { Component, Input, Optional, Self, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';

import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzInputModule, NzInputNumberModule, NzIconModule],
  templateUrl: './custom-input.component.html',
  styleUrl: './custom-input.component.css'
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'number' | 'password' | 'email' | 'textarea' = 'text';
  @Input() required: boolean = false;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number | string = 1;
  @Input() rows: number = 4;
  @Input() errorTip: string = '';
  @Input() disabled: boolean = false;
  @Input() prefixIcon: string = '';
  
  @HostBinding('class.app-custom-input') hostClass = true;

  value: any = '';
  passwordVisible = false;
  
  onChange = (val: any) => {};
  onTouched = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  get isInvalid(): boolean {
    if (!this.ngControl) return false;
    const control = this.ngControl.control;
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  get control() {
    return this.ngControl ? this.ngControl.control : null;
  }

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInputChange(val: any) {
    this.value = val;
    this.onChange(val);
  }
  
  handleBlur() {
    this.onTouched();
  }
}
