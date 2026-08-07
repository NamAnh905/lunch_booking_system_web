import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoFocusDirective } from '@shared/directives/autofocus.directive';
import { ToastService } from '@shared/services/toast.service';
import { MenuService } from '../../menu.service';
import { Menu, MenuImageCreateRequest } from '@shared/models/menu.model';
import { toIsoDate, toDisplayDate, getMonday } from '@shared/utils/date.util';
import { toOptimizedImageUrl } from '@shared/utils/image.util';
import { MENU_IMAGE_UPLOAD } from '@shared/constants/upload.constants';

@Component({
  selector: 'app-menu-image-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoFocusDirective],
  templateUrl: './menu-image-form.component.html',
  styleUrl: './menu-image-form.component.scss'
})
export class MenuImageFormComponent implements OnInit {
  @Input() menu: Menu | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private menuService = inject(MenuService);
  private toastService = inject(ToastService);

  loading = false;

  form: MenuImageCreateRequest = {
    name: '',
    weekDate: toIsoDate(new Date())
  };

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  readonly uploadRules = MENU_IMAGE_UPLOAD;

  get isEdit(): boolean {
    return !!this.menu;
  }

  ngOnInit() {
    if (this.menu) {
      this.form = {
        name: this.menu.name || '',
        weekDate: this.menu.menuDate || toIsoDate(new Date())
      };
      this.previewUrl = toOptimizedImageUrl(this.menu.imageUrl) || null;
    }
  }

  get weekLabel(): string {
    if (!this.form.weekDate) return '';
    const monday = getMonday(new Date(this.form.weekDate));
    return `Tuần bắt đầu từ ${toDisplayDate(monday)}`;
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    if (!MENU_IMAGE_UPLOAD.ACCEPTED_TYPES.includes(file.type)) {
      input.value = '';
      this.toastService.showError(`Chỉ chấp nhận ảnh ${MENU_IMAGE_UPLOAD.ACCEPTED_TYPES_LABEL}.`);
      return;
    }

    if (file.size > MENU_IMAGE_UPLOAD.MAX_SIZE_BYTES) {
      input.value = '';
      this.toastService.showError(`Ảnh vượt quá ${MENU_IMAGE_UPLOAD.MAX_SIZE_LABEL}, vui lòng chọn ảnh nhỏ hơn.`);
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

    if (!this.selectedFile && !this.isEdit) {
      this.toastService.showError('Vui lòng chọn ảnh cho thực đơn.');
      return;
    }

    this.loading = true;

    const request$ = this.isEdit
      ? this.menuService.updateImageMenu(this.menu!.id!, this.form, this.selectedFile)
      : this.menuService.addImageMenu(this.form, this.selectedFile!);

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
