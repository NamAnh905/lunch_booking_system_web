import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { ProfileService } from '@core/services/profile.service';
import { AuthService } from '@core/auth/auth.service';
import { UserResponse } from '@shared/models/user.model';

@Component({
  selector: 'app-user-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormModalComponent],
  templateUrl: './user-profile-modal.component.html',
  styleUrl: './user-profile-modal.component.scss',
})
export class UserProfileModalComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  loading = false;
  saving = false;
  user: UserResponse | null = null;

  form = this.fb.group({
    fullName: ['', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.loadProfile();
    }
  }

  get statusLabel(): string {
    return this.user?.isActive ? 'Hoạt động' : 'Khóa';
  }

  get rolesLabel(): string {
    return this.user?.roles?.length ? this.user.roles.join(', ') : 'Chưa có vai trò';
  }

  private loadProfile(): void {
    this.loading = true;
    this.profileService.getMe().subscribe({
      next: (res) => {
        this.user = res.result ?? null;
        this.form.reset({ fullName: this.user?.fullName ?? '' });
        this.loading = false;
      },
      error: (err) => {
        console.error('Không tải được thông tin cá nhân', err);
        this.loading = false;
      },
    });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fullName = (this.form.value.fullName ?? '').trim();
    this.saving = true;
    this.profileService.updateMe({ fullName }).subscribe({
      next: (res) => {
        this.user = res.result ?? this.user;
        this.authService.patchCurrentUser({ fullName: res.result?.fullName ?? fullName });
        this.saving = false;
        this.closed.emit();
        Swal.fire('Thành công', 'Cập nhật thông tin cá nhân thành công!', 'success');
      },
      error: (err) => {
        console.error('Cập nhật thông tin thất bại', err);
        this.saving = false;
        Swal.fire('Thất bại', 'Cập nhật thông tin cá nhân thất bại!', 'error');
      },
    });
  }

  onCancel(): void {
    if (!this.saving) {
      this.closed.emit();
    }
  }
}
