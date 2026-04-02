import { Component, Input, Optional, Self, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector: 'app-custom-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzInputModule],
  templateUrl: './custom-textarea.component.html',
  styleUrl: './custom-textarea.component.css'
})
export class CustomTextareaComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() required: boolean = false;
  @Input() rows: number = 4;
  @Input() errorTip: string = '';
  @Input() disabled: boolean = false;
  
  @HostBinding('class.app-custom-textarea') hostClass = true;

  value: any = '';
  
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
