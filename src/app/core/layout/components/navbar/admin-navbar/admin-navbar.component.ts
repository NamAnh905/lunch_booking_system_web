import { Component, inject, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { LucideUser, LucideLogOut, LucideKeyRound, LucideUtensils, LucideMenu } from '@lucide/angular';
import { AuthService } from '../../../../auth/auth.service';
import { UserProfileModalComponent } from '@shared/components/account-modals/user-profile-modal/user-profile-modal.component';
import { UserPasswordModalComponent } from '@shared/components/account-modals/user-password-modal/user-password-modal.component';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    LucideUser,
    LucideLogOut,
    LucideKeyRound,
    LucideUtensils,
    LucideMenu,
    UserProfileModalComponent,
    UserPasswordModalComponent
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss'
})
export class AdminNavbarComponent {
  @Input() showBreadcrumb = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  currentUser$ = this.authService.currentUser$;
  isDropdownOpen = false;
  profileModalOpen = false;
  passwordModalOpen = false;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  openProfile(): void {
    this.isDropdownOpen = false;
    this.profileModalOpen = true;
  }

  openPassword(): void {
    this.isDropdownOpen = false;
    this.passwordModalOpen = true;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
