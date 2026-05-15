import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CompareBarComponent } from '../../shared/components/compare-bar/compare-bar.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NzLayoutModule, HeaderComponent, FooterComponent, CompareBarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent { }

