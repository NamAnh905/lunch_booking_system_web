import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { UserNavbarComponent } from '@core/layout/components/navbar/user-navbar/user-navbar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UserNavbarComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  private readonly requiredMessages: Record<string, string> = {
    username: 'Không được để trống tài khoản',
    password: 'Không được để trống mật khẩu',
  };

  /**
   * Map mã lỗi xác thực từ Backend (ApiResponse.code) sang { field, message }
   * để hiển thị NGAY DƯỚI ô tương ứng như một lỗi validate — không dùng banner/toast.
   */
  private readonly authErrors: Record<number, { field: string; message: string }> = {
    2001: { field: 'username', message: 'Tài khoản không tồn tại' },        // USER_NOT_FOUND
    2002: { field: 'username', message: 'Tài khoản đã bị khóa' },           // USER_LOCKED
    1001: { field: 'password', message: 'Sai tên đăng nhập hoặc mật khẩu' }, // UNAUTHENTICATED
  };

  private readonly TOO_MANY_LOGIN_ATTEMPTS = 1004;

  /** Lỗi trả về từ Backend, gắn theo tên field (được xoá ngay khi người dùng gõ lại). */
  private serverErrors: Record<string, string> = {};

  loading = false;
  showPassword = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearServerErrors(): void {
    this.serverErrors = {};
  }

  /**
   * Lỗi hiển thị dưới ô: ưu tiên lỗi Backend, sau đó tới lỗi required (on blur).
   */
  getFieldError(fieldName: string): string {
    if (this.serverErrors[fieldName]) {
      return this.serverErrors[fieldName];
    }
    const control = this.loginForm.get(fieldName);
    if (control && control.invalid && control.touched) {
      return this.requiredMessages[fieldName] ?? '';
    }
    return '';
  }

  private tooManyAttemptsMessage(retryAfterSeconds: unknown): string {
    const seconds = typeof retryAfterSeconds === 'number' ? Math.ceil(retryAfterSeconds) : 0;
    if (seconds <= 0) {
      return 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau.';
    }
    const wait = seconds < 60 ? `${seconds} giây` : `${Math.ceil(seconds / 60)} phút`;
    return `Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${wait}.`;
  }

  onSubmit(): void {
    // Nút Submit luôn bật; nếu form trống/không hợp lệ thì lộ lỗi required, không gọi API.
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.clearServerErrors();

    const { username, password } = this.loginForm.value;

    this.authService.login({ username, password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.authenticated) {
          if (this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN')) {
            this.router.navigate(['statistic/order-monthly']);
          } else {
            this.router.navigate(['/portal/meal-order']);
          }
        } else {
          this.serverErrors = { password: 'Sai tên đăng nhập hoặc mật khẩu' };
        }
      },
      error: (err) => {
        this.loading = false;

        if (err.error?.code === this.TOO_MANY_LOGIN_ATTEMPTS) {
          this.serverErrors = {
            password: this.tooManyAttemptsMessage(err.error?.result?.retryAfterSeconds),
          };
          return;
        }

        const mapped = this.authErrors[err.error?.code];
        this.serverErrors = mapped
          ? { [mapped.field]: mapped.message }
          : { password: 'Có lỗi xảy ra trong quá trình đăng nhập.' };
      },
    });
  }
}
