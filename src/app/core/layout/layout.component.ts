import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './components/sidebar/admin-sidebar/admin-sidebar.component';
import { AdminNavbarComponent } from './components/navbar/admin-navbar/admin-navbar.component';
import { UserNavbarComponent } from './components/navbar/user-navbar/user-navbar.component';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminNavbarComponent,
    UserNavbarComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  private router = inject(Router);

  get showBreadcrumb(): boolean {
    return this.isAdminPage;
  }

  get isAdminPage(): boolean {
    return this.router.url.includes('/system') || this.router.url.includes('/statistic') || this.router.url.includes('/dashboard');
  }
}
