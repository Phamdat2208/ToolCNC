import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-speed-dial',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzToolTipModule],
  templateUrl: './speed-dial.component.html',
  styleUrl: './speed-dial.component.css'
})
export class SpeedDialComponent {
  isOpen = false;

  toggle() {
    this.isOpen = !this.isOpen;
  }
}
