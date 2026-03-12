import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNzI18n, vi_VN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import vi from '@angular/common/locales/vi';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { provideNzConfig } from 'ng-zorro-antd/core/config';
import { NzModalModule } from 'ng-zorro-antd/modal';

import {
  CheckCircleOutline,
  ShoppingCartOutline,
  DownOutline,
  ArrowLeftOutline,
  ShoppingOutline,
  SearchOutline,
  PhoneOutline,
  MailOutline,
  SettingOutline,
  ToolOutline,
  ScissorOutline,
  AppstoreOutline,
  DashboardOutline,
  ExperimentOutline,
  DeleteTwoTone,
  DeleteOutline,
  UserOutline,
  LockOutline,
  EyeOutline,
  EyeInvisibleOutline,
  ProfileOutline,
  HistoryOutline,
  LogoutOutline,
  PlusCircleOutline,
  EditOutline
} from '@ant-design/icons-angular/icons';

const icons = [
  CheckCircleOutline,
  ShoppingCartOutline,
  DownOutline,
  ArrowLeftOutline,
  ShoppingOutline,
  SearchOutline,
  PhoneOutline,
  MailOutline,
  SettingOutline,
  ToolOutline,
  ScissorOutline,
  AppstoreOutline,
  DashboardOutline,
  ExperimentOutline,
  DeleteTwoTone,
  DeleteOutline,
  UserOutline,
  LockOutline,
  EyeOutline,
  EyeInvisibleOutline,
  ProfileOutline,
  HistoryOutline,
  LogoutOutline,
  PlusCircleOutline,
  EditOutline
];

registerLocaleData(vi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideNzI18n(vi_VN),
    provideNzIcons(icons),
    provideNzConfig({ notification: { nzDuration: 3000, nzMaxStack: 3, nzPlacement: 'bottomRight' } }),
    importProvidersFrom(NzModalModule)
  ]
};
