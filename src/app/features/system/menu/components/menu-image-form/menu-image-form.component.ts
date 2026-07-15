import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoFocusDirective } from '../../../../../shared/directives/autofocus.directive';
import { ToastService } from '@core/services/toast.service';
import { MenuService } from '../../menu.service';
import { Menu, MenuImageCreateRequest } from '@shared/models/menu.model';
import { toIsoDate, toDisplayDate, getMonday } from '@shared/utils/date.util';

/**
 * Modal thêm/sửa thực đơn dạng Hình ảnh (theo tuần).
 * Luồng upload 2 bước: tải ảnh lên Cloudinary lấy URL, sau đó lưu menu.
 */
@Component({
  selector: 'app-menu-image-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoFocusDirective],
  templateUrl: './menu-image-form.component.html',
  styleUrl: './menu-image-form.component.scss'
})
export class MenuImageFormComponent implements OnInit {
  /** Menu cần sửa; bỏ trống nghĩa là thêm mới. */
  @Input() menu: Menu | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private menuService = inject(MenuService);
  private toastService = inject(ToastService);

  loading = false;

  form: MenuImageCreateRequest = {
    name: '',
    imageUrl: '',
    weekDate: toIsoDate(new Date())
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  get isEdit(): boolean {
    return !!this.menu;
  }

  ngOnInit() {
    if (this.menu) {
      this.form = {
        name: this.menu.name || '',
        imageUrl: this.menu.imageUrl || '',
        weekDate: this.menu.menuDate || toIsoDate(new Date())
      };
      this.previewUrl = this.menu.imageUrl || null;
    }
  }

  /** Nhãn hiển thị tuần đang chọn (Thứ Hai của tuần). */
  get weekLabel(): string {
    if (!this.form.weekDate) return '';
    const monday = getMonday(new Date(this.form.weekDate));
    return `Tuần bắt đầu từ ${toDisplayDate(monday)}`;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toastService.showError('Vui lòng chọn một tệp hình ảnh.');
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
  }

  onClose() {
    this.close.emit();
  }

  onSubmit() {
    if (!this.form.name || !this.form.weekDate) return;

    if (!this.selectedFile && !this.form.imageUrl) {
      this.toastService.showError('Vui lòng chọn ảnh cho thực đơn.');
      return;
    }

    this.loading = true;

    // Có ảnh mới → upload trước rồi mới lưu; ngược lại dùng lại imageUrl cũ (khi sửa).
    if (this.selectedFile) {
      this.menuService.uploadImage(this.selectedFile).subscribe({
        next: (res) => {
          const url = res.result?.url;
          if (!url) {
            this.loading = false;
            this.toastService.showError('Tải ảnh thất bại!');
            return;
          }
          this.form.imageUrl = url;
          this.persist();
        },
        error: (err) => {
          console.error('Upload image failed', err);
          this.loading = false;
        }
      });
    } else {
      this.persist();
    }
  }

  private persist() {
    const request$ = this.isEdit
      ? this.menuService.updateImageMenu(this.menu!.id!, this.form)
      : this.menuService.addImageMenu(this.form);

    request$.subscribe({
      next: () => {
        this.toastService.showSuccess(this.isEdit ? 'Cập nhật thực đơn thành công!' : 'Thêm thực đơn thành công!');
        this.loading = false;
        this.saved.emit();
      },
      error: (err) => {
        console.error('Save image menu failed', err);
        this.loading = false;
      }
    });
  }
}
