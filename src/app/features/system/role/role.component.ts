import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { RoleService } from './role.service';
import { RoleResponse, RoleCreateRequest, RoleUpdateRequest } from '@shared/models/role.model';
import { PermissionService } from '../permission/permission.service';
import { Permission } from '@shared/models/permission.model';

@Component({
  selector: 'app-role',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss'
})
export class RoleComponent extends BaseCrudComponent<RoleResponse, { keyword?: string }, any> {
  private roleService = inject(RoleService);
  private permissionService = inject(PermissionService);

  availablePermissions: Permission[] = [];
  isPermissionsDropdownOpen = false;

  override ngOnInit() {
    super.ngOnInit();
    this.permissionService.getPermissions(1, 1000, '').subscribe({
      next: (res: any) => {
        const pageData = res.result !== undefined ? res.result : res;
        this.availablePermissions = Array.isArray(pageData) ? pageData : (pageData.data || pageData.content || []);
      },
      error: (err) => console.error('Failed to load permissions', err)
    });
  }

  override getService() {
    return this.roleService;
  }

  override getDefaultForm(): any {
    return {
      code: '',
      name: '',
      description: '',
      permissions: []
    };
  }

  override getDefaultQuery() {
    return {
      keyword: ''
    };
  }

  override onSave(formData: any): void {
    formData.permissions = this.formModel.permissions || [];
    super.onSave(formData);
  }

  override onEdit(item: RoleResponse): void {
    super.onEdit(item);
    if (item.permissions && item.permissions.length > 0) {
      this.formModel.permissions = item.permissions.map((p: any) => p.action || p);
    } else {
      this.formModel.permissions = [];
    }
    this.isPermissionsDropdownOpen = false;
  }

  togglePermissionsDropdown() {
    this.isPermissionsDropdownOpen = !this.isPermissionsDropdownOpen;
  }

  onPermissionChange(action: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (!this.formModel.permissions) this.formModel.permissions = [];
    
    if (isChecked) {
      if (!this.formModel.permissions.includes(action)) {
        this.formModel.permissions.push(action);
      }
    } else {
      this.formModel.permissions = this.formModel.permissions.filter((p: string) => p !== action);
    }
  }

  getPermissionsDisplayText(): string {
    if (!this.formModel.permissions || this.formModel.permissions.length === 0) return 'Chọn quyền (Permissions)';
    return this.formModel.permissions.join(', ');
  }

  onExport() {
    this.toastService.showWarning('Tính năng xuất Excel danh sách vai trò đang được phát triển!');
  }
}
