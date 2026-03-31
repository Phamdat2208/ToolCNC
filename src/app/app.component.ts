import { Component, inject, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpeedDialComponent } from './shared/components/speed-dial/speed-dial.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpeedDialComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tool-cnc-app';
}

