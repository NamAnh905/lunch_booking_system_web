import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { MenuService } from './menu.service';
import { Menu } from '@shared/models/menu.model';
import { MenuType } from '@shared/enums/menu-type.enum';
import { FileDownloadService } from '@core/services/file-download.service';
import { EXCEL_FILE_NAMES, APP_DATE_TIME_FORMAT } from '@shared/constants/business.constants';
import { MenuListEditorComponent } from './components/menu-list-editor/menu-list-editor.component';
import { MenuImageFormComponent } from './components/menu-image-form/menu-image-form.component';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, MenuListEditorComponent, MenuImageFormComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent extends BaseCrudComponent<Menu, { keyword?: string }, any> {
  private menuService = inject(MenuService);
  private fileDownloadService = inject(FileDownloadService);

  readonly MenuType = MenuType;
  readonly dateTimeFormat = APP_DATE_TIME_FORMAT;

  // View state
  isAddMenuOpen = false;
  showListEditor = false;
  listEditorDate: string | undefined;
  showImageForm = false;
  imageFormMenu: Menu | null = null;

  // Preview state
  previewMenu: Menu | null = null;

  getService() {
    return this.menuService as any;
  }

  getDefaultForm(): any {
    return {};
  }

  // ---- Add dropdown ----
  toggleAddMenu() {
    this.isAddMenuOpen = !this.isAddMenuOpen;
  }

  closeAddMenu() {
    this.isAddMenuOpen = false;
  }

  /** Đóng dropdown khi click ra ngoài. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isAddMenuOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.add-menu-wrapper')) {
      this.isAddMenuOpen = false;
    }
  }

  openListEditor(date?: string) {
    this.closeAddMenu();
    this.listEditorDate = date;
    this.showListEditor = true;
  }

  openImageForm(menu: Menu | null = null) {
    this.closeAddMenu();
    this.imageFormMenu = menu;
    this.showImageForm = true;
  }

  onListEditorClose() {
    this.showListEditor = false;
    this.listEditorDate = undefined;
    this.loadData();
  }

  onImageFormClose() {
    this.showImageForm = false;
    this.imageFormMenu = null;
  }

  onImageFormSaved() {
    this.onImageFormClose();
    this.loadData();
  }

  // ---- Row actions ----
  isImage(item: Menu): boolean {
    return item.type === MenuType.IMAGE;
  }

  typeLabel(item: Menu): string {
    return this.isImage(item) ? 'Hình ảnh' : 'Danh sách';
  }

  onEditRow(item: Menu) {
    if (this.isImage(item)) {
      this.openImageForm(item);
    } else {
      this.openListEditor(item.menuDate);
    }
  }

  onDeleteRow(item: Menu) {
    const label = item.name || `thực đơn ngày ${item.menuDate}`;
    this.confirmService.confirm(`Bạn có chắc muốn xóa ${label}?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.menuService.delete(item.id!).subscribe({
          next: () => {
            this.toastService.showSuccess('Xóa thực đơn thành công!');
            this.loadData();
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
          }
        });
      }
    });
  }

  onPreview(item: Menu) {
    this.previewMenu = item;
  }

  closePreview() {
    this.previewMenu = null;
  }

  onExport() {
    this.loading = true;
    this.menuService.exportExcel(this.query.keyword).subscribe({
      next: (blob) => {
        this.fileDownloadService.save(blob, EXCEL_FILE_NAMES.MENU_LIST);
        this.loading = false;
        this.toastService.showSuccess('Xuất file Excel thành công!');
      },
      error: (err) => {
        console.error('Failed to export excel', err);
        this.loading = false;
        this.toastService.showError('Xuất file Excel thất bại!');
      }
    });
  }
}
