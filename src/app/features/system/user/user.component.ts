import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { UserService } from './user.service';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/models/user.model';
import { RoleService } from '../role/role.service';
import { DepartmentService } from '../department/department.service';
import { DepartmentResponse } from '@shared/models/department.model';
import { AutoFocusDirective } from '../../../shared/directives/autofocus.directive';
import { EXCEL_FILE_NAMES } from '@shared/constants/business.constants';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent, FormModalComponent, AutoFocusDirective],
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
    this.isRolesDropdownOpen = false;
  }

  isRolesDropdownOpen = false;

  toggleRolesDropdown() {
    this.isRolesDropdownOpen = !this.isRolesDropdownOpen;
  }

  onRoleChange(roleCode: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (!this.formModel.roles) this.formModel.roles = [];

    if (isChecked) {
      if (!this.formModel.roles.includes(roleCode)) {
        this.formModel.roles.push(roleCode);
      }
    } else {
      this.formModel.roles = this.formModel.roles.filter((r: string) => r !== roleCode);
    }
  }

  getRolesDisplayText(): string {
    if (!this.formModel.roles || this.formModel.roles.length === 0) return 'Chọn vai trò';
    return this.formModel.roles.join(', ');
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = EXCEL_FILE_NAMES.USER_LIST;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
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
