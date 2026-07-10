import { Component, inject, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { LucideUser, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../../../auth/auth.service';

@Component({
  selector: 'app-admin-navbar',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, LucideUser, LucideLogOut],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.scss'
})
export class AdminNavbarComponent {
  @Input() showBreadcrumb = true;
  
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  // Expose current user to the template
  currentUser$ = this.authService.currentUser$;
  isDropdownOpen = false;

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  goToProfile(): void {
    this.isDropdownOpen = false;
    this.router.navigate(['/system/profile']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Fallback navigate to login even if API fails
        this.router.navigate(['/login']);
      }
    });
  }
}
