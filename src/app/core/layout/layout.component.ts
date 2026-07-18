import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
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

  mobileSidebarOpen = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => this.mobileSidebarOpen.set(false));
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  get showBreadcrumb(): boolean {
    return this.isAdminPage;
  }

  get isAdminPage(): boolean {
    return this.router.url.includes('/system') || this.router.url.includes('/statistic') || this.router.url.includes('/dashboard');
  }
}
