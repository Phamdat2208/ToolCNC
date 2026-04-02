import { Component, Input, Optional, Self, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NzFormModule, NzSelectModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.css'
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Chọn một tuỳ chọn';
  @Input() options: SelectOption[] = [];
  @Input() required: boolean = false;
  @Input() errorTip: string = '';
  @Input() disabled: boolean = false;
  @Input() showSearch: boolean = false;

  @HostBinding('class.app-custom-select') hostClass = true;

  value: any = null;

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

  handleSelectChange(val: any) {
    this.value = val;
    this.onChange(val);
  }

  handleBlur() {
    this.onTouched();
  }
}
