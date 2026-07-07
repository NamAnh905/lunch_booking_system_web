import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { UserService } from './user.service';
import { UserResponse, UserCreateRequest, UserUpdateRequest } from '@shared/models/user.model';
import { RoleService } from '../role/role.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent extends BaseCrudComponent<UserResponse, { keyword?: string }, any> implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  
  availableRoles: any[] = [];

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
    // This is a placeholder since the backend does not have an export API yet.
    alert('Tính năng xuất Excel đang được phát triển ở phía Backend!');
  }
}
