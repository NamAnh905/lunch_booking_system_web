import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { SortHeaderComponent } from '@shared/components/crud/sort-header.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { UserService } from './user.service';
import { UserImportResultResponse, UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/models/user.model';
import { UserImportResultModalComponent } from './components/user-import-result-modal/user-import-result-modal.component';
import { RoleService } from '../role/role.service';
import { DepartmentService } from '../department/department.service';
import { DepartmentResponse } from '@shared/models/department.model';
import { AutoFocusDirective } from '@shared/directives/autofocus.directive';
import { EXCEL_FILE_NAMES } from '@shared/constants/business.constants';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent, SortHeaderComponent, FormModalComponent, AutoFocusDirective, UserImportResultModalComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent extends BaseCrudComponent<UserResponse, { keyword?: string, departmentIds?: number[], isActives?: boolean[] }, any> implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private departmentService = inject(DepartmentService);

  availableRoles: any[] = [];
  availableDepartments: DepartmentResponse[] = [];

  override ngOnInit() {
    super.ngOnInit();
    this.roleService.query({}).subscribe({
      next: (res) => {
        const pageData = (res as any).result !== undefined ? (res as any).result : res;
        if (Array.isArray(pageData)) {
          this.availableRoles = pageData;
        } else {
          this.availableRoles = pageData.data || pageData.content || [];
        }
      },
      error: (err) => console.error('Failed to load roles', err)
    });

    this.departmentService.getAllDepartments().subscribe({
      next: (res) => {
        const pageData = (res as any).result !== undefined ? (res as any).result : res;
        this.availableDepartments = pageData.data || pageData.content || pageData || [];
      },
      error: (err) => console.error('Failed to load departments', err)
    });
  }

  getService() {
    return this.userService as any;
  }

  getDefaultForm(): any {
    return {
      username: '',
      password: '',
      fullName: '',
      department: '',
      isActive: true,
      roles: ['USER']
    };
  }

  selectedDepartmentId: number | null = null;
  selectedIsActive: boolean | null = null;

  onFilterChange() {
    this.query.departmentIds = this.selectedDepartmentId === null ? [] : [this.selectedDepartmentId];
    this.query.isActives = this.selectedIsActive === null ? [] : [this.selectedIsActive];
    this.onSearch();
  }

  override onReset() {
    this.selectedDepartmentId = null;
    this.selectedIsActive = null;
    super.onReset();
  }

  onEditRow(item: any) {
    this.formMode = 'edit';
    this.formModel = { ...item };
    if (!this.formModel.roles) {
      this.formModel.roles = [];
    }
    this.formModel.password = ''; // empty password field for editing
    this.isFormOpen = true;
  }

  showPassword = false;

  override closeForm(): void {
    this.showPassword = false;
    super.closeForm();
  }

  get selectedRole(): string {
    return this.formModel.roles?.[0] ?? '';
  }

  set selectedRole(roleCode: string) {
    this.formModel.roles = roleCode ? [roleCode] : [];
  }

  onToggleStatus(item: any) {
    const action = item.isActive ? 'khóa' : 'mở khóa';
    this.confirmService.confirm(`Bạn có chắc muốn ${action} tài khoản ${item.username}?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        const updatedForm = {
          fullName: item.fullName,
          department: item.department,
          isActive: !item.isActive,
          roles: item.roles
        };

        this.loading = true;
        this.getService().edit(item.id, updatedForm).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã ${action} tài khoản thành công!`);
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

  override onSave(formData: any): void {
    formData.roles = this.formModel.roles || [];
    delete formData.role;

    // Do not send empty password on update
    if (!formData.password) {
      delete formData.password;
    }

    super.onSave(formData);
  }

  onExport() {
    this.loading = true;
    this.userService.exportExcel(this.query.keyword).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, EXCEL_FILE_NAMES.USER_LIST);
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

  importResult: UserImportResultResponse | null = null;
  importedFileName = '';

  onDownloadTemplate() {
    this.loading = true;
    this.userService.downloadImportTemplate().subscribe({
      next: (blob) => {
        this.downloadBlob(blob, EXCEL_FILE_NAMES.USER_IMPORT_TEMPLATE);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to download import template', err);
        this.loading = false;
      }
    });
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    this.loading = true;
    this.importedFileName = file.name;
    this.userService.importExcel(file).subscribe({
      next: (res) => {
        this.loading = false;
        this.importResult = res.result ?? null;

        if (this.importResult && this.importResult.successCount > 0) {
          this.toastService.showSuccess(`Đã thêm ${this.importResult.successCount} người dùng từ file Excel.`);
          this.loadData();
        }
      },
      error: (err) => {
        console.error('Failed to import excel', err);
        this.loading = false;
        this.importedFileName = '';
      }
    });
  }

  closeImportResult() {
    this.importResult = null;
    this.importedFileName = '';
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
