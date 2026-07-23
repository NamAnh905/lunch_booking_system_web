import { Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '@core/auth/auth.service';
import { UserProfileModalComponent } from '@shared/components/account-modals/user-profile-modal/user-profile-modal.component';
import { UserPasswordModalComponent } from '@shared/components/account-modals/user-password-modal/user-password-modal.component';
import { NotificationBellComponent } from '@core/layout/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-user-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserProfileModalComponent,
    UserPasswordModalComponent,
    NotificationBellComponent,
  ],
  templateUrl: './user-navbar.component.html',
  styleUrl: './user-navbar.component.scss'
})
export class UserNavbarComponent {
  /** Ẩn menu user (dropdown thông tin/đổi mật khẩu/đăng xuất) khi chưa đăng nhập, vd trang login. */
  @Input() showUserMenu = true;

  @ViewChild('dropdownRef') dropdownRef?: ElementRef<HTMLElement>;

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;
  displayName$ = this.currentUser$.pipe(
    map(user => user?.fullName?.trim() || user?.username)
  );
  isAdmin$ = this.currentUser$.pipe(
    map(user => !!user?.roles?.some(role => role === 'ADMIN' || role === 'SUPER_ADMIN'))
  );
  dropdownOpen = false;
  notificationOpen = false;
  profileModalOpen = false;
  passwordModalOpen = false;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.dropdownOpen && !this.dropdownRef?.nativeElement.contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  openProfile(): void {
    this.dropdownOpen = false;
    this.profileModalOpen = true;
  }

  openPassword(): void {
    this.dropdownOpen = false;
    this.passwordModalOpen = true;
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
