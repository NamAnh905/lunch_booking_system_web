import { Directive, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PageResponse } from '@shared/models';
import { VALIDATION_PATTERNS, VALIDATION_LENGTHS } from '@shared/constants/validation.constants';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Directive()
export abstract class BaseCrudComponent<T, Q = any, F = any> implements OnInit {
  protected toastService = inject(ToastService);

  readonly VALIDATION = VALIDATION_PATTERNS;
  readonly VALIDATION_LEN = VALIDATION_LENGTHS;

  data: T[] = [];
  loading = false;
  total = 0;
  page = 1;
  size = 10;

  query: Q = {} as Q;

  isFormOpen = false;
  formModel: F = {} as F;
  formMode: 'add' | 'edit' = 'add';

  abstract getService(): {
    query(query: Q, page: number, size: number): Observable<PageResponse<T>>;
    add?(form: F): Observable<T>;
    edit?(id: number | string, form: F): Observable<T | void>;
    delete?(id: number | string): Observable<void>;
    deleteMany?(ids: (number | string)[]): Observable<void>;
  };

  abstract getDefaultForm(): F;

  getDefaultQuery(): Q {
    return {} as Q;
  }

  ngOnInit(): void {
    this.query = this.getDefaultQuery();
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.getService().query(this.query, this.page - 1, this.size).subscribe({
      next: (res) => {
        const pageData = (res as any).result !== undefined ? (res as any).result : res;

        if (Array.isArray(pageData)) {
          this.data = pageData;
          this.total = pageData.length;
        } else {
          this.data = pageData.data || pageData.content || [];
          this.total = pageData.totalElements || 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load CRUD data', err);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadData();
  }

  onSizeChange(size: number): void {
    this.size = size;
    this.page = 1; // Reset to page 1
    this.loadData();
  }

  onSearch(): void {
    this.page = 1;
    this.loadData();
  }

  onReset(): void {
    this.query = this.getDefaultQuery();
    this.page = 1;
    this.loadData();
  }

  onAdd(): void {
    this.formMode = 'add';
    this.formModel = this.getDefaultForm();
    this.isFormOpen = true;
  }

  onEdit(item: T): void {
    this.formMode = 'edit';
    this.formModel = { ...item } as any; // shallow clone
    this.isFormOpen = true;
  }

  protected confirmService = inject(ConfirmService);

  onDelete(items: T[]): void {
    const ids = items.map((item: any) => item.id);
    if (ids.length === 0) return;

    this.confirmService.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} mục đã chọn?`, 'Xác nhận xóa').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        const service = this.getService();

        const deleteObservable = service.deleteMany
          ? service.deleteMany(ids)
          : service.delete && ids.length === 1
            ? service.delete(ids[0])
            : null;

        if (deleteObservable) {
          deleteObservable.subscribe({
            next: () => {
              this.toastService.showSuccess(`Xóa thành công ${ids.length} mục!`);
              this.page = 1;
              this.loadData();
            },
            error: (err) => {
              console.error('Failed to delete items', err);
              this.loading = false;
            }
          });
        } else {
          console.warn('Delete service methods are not implemented');
          this.loading = false;
        }
      }
    });
  }

  onSave(formData: F): void {
    const service = this.getService();
    this.loading = true;

    if (this.formMode === 'add' && service.add) {
      service.add(formData).subscribe({
        next: () => {
          this.toastService.showSuccess('Thêm mới dữ liệu thành công!');
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          console.error('Failed to add item', err);
          this.loading = false;
        }
      });
    } else if (this.formMode === 'edit' && service.edit) {
      const id = (this.formModel as any).id;
      service.edit(id, formData).subscribe({
        next: () => {
          this.toastService.showSuccess('Cập nhật dữ liệu thành công!');
          this.closeForm();
          this.loadData();
        },
        error: (err) => {
          console.error('Failed to edit item', err);
          this.loading = false;
        }
      });
    } else {
      console.warn('Save method not implemented in service');
      this.loading = false;
    }
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.formModel = this.getDefaultForm();
  }
}
