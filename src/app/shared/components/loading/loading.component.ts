import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, NzSpinModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  @Input() isLoading: boolean = false;
  @Input() size: 'small' | 'default' | 'large' = 'large';
  @Input() tip: string = '';
}
