import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { PermissionService } from './permission.service';
import { Permission, PermissionCreateRequest, PermissionUpdateRequest } from '@shared/models/permission.model';
import { FileDownloadService } from '@core/services/file-download.service';
import { EXCEL_FILE_NAMES } from '@shared/constants/business.constants';

@Component({
  selector: 'app-permission',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent, FormModalComponent],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.scss'
})
export class PermissionComponent extends BaseCrudComponent<Permission, { keyword?: string }, PermissionCreateRequest | PermissionUpdateRequest> implements OnInit {
  private permissionService = inject(PermissionService);
  private fileDownloadService = inject(FileDownloadService);

  override ngOnInit() {
    super.ngOnInit();
  }

  getService() {
    return {
      query: (queryObj: any, page: number, size: number) => this.permissionService.getPermissions(page + 1, size, queryObj.keyword),
      add: (data: PermissionCreateRequest) => this.permissionService.createPermission(data),
      edit: (id: number, data: PermissionUpdateRequest) => this.permissionService.updatePermission(id, data),
      delete: (id: number) => this.permissionService.deletePermission(id)
    } as any;
  }

  getDefaultForm(): any {
    return {
      action: '',
      description: ''
    };
  }

  onEditRow(item: Permission) {
    this.formMode = 'edit';
    this.formModel = { ...item };
    this.isFormOpen = true;
  }

  onDeleteRow(item: Permission) {
    this.confirmService.confirm(`Bạn có chắc muốn xóa quyền ${item.action}?`, 'Xác nhận xóa').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.getService().delete(item.id).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã xóa quyền ${item.action} thành công!`);
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

  onExport() {
    this.loading = true;
    this.permissionService.exportExcel(this.query.keyword).subscribe({
      next: (blob) => {
        this.fileDownloadService.save(blob, EXCEL_FILE_NAMES.PERMISSION_LIST);
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
