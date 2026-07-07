import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './components/admin/admin-sidebar/admin-sidebar.component';
import { AdminNavbarComponent } from './components/admin/admin-navbar/admin-navbar.component';

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet, 
    AdminSidebarComponent,
    AdminNavbarComponent
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
    return this.router.url.includes('/system') || this.router.url.includes('/dashboard');
  }
}
