import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { ProfileService } from '@core/services/profile.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) {
    return null;
  }
  return newPassword === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-user-password-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormModalComponent],
  templateUrl: './user-password-modal.component.html',
  styleUrl: './user-password-modal.component.scss',
})
export class UserPasswordModalComponent implements OnChanges {
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);

  saving = false;

  form = this.fb.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.form.reset({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { oldPassword, newPassword } = this.form.value;
    this.saving = true;
    this.profileService
      .changePassword({ oldPassword: oldPassword ?? '', newPassword: newPassword ?? '' })
      .subscribe({
        next: () => {
          this.saving = false;
          this.form.reset();
          this.closed.emit();
          Swal.fire('Thành công', 'Đổi mật khẩu thành công!', 'success');
        },
        error: (err) => {
          console.error('Đổi mật khẩu thất bại', err);
          this.saving = false;
          const message = err?.error?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.';
          Swal.fire('Thất bại', message, 'error');
        },
      });
  }

  onCancel(): void {
    if (!this.saving) {
      this.closed.emit();
    }
  }
}
