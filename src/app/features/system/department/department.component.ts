import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { DepartmentService } from './department.service';
import { DepartmentResponse, DepartmentCreateRequest, DepartmentUpdateRequest } from '@shared/models/department.model';
import { AutoFocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-department',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, AutoFocusDirective],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent extends BaseCrudComponent<DepartmentResponse, { keyword?: string }, DepartmentCreateRequest | DepartmentUpdateRequest> implements OnInit {
  private departmentService = inject(DepartmentService);
  
  override ngOnInit() {
    super.ngOnInit();
  }

  getService() {
    return {
      query: (queryObj: any, page: number, size: number) => this.departmentService.getDepartments(page + 1, size, queryObj.keyword),
      add: (data: DepartmentCreateRequest) => this.departmentService.createDepartment(data),
      edit: (id: number, data: DepartmentUpdateRequest) => this.departmentService.updateDepartment(id, data),
      delete: (id: number) => this.departmentService.deleteDepartment(id)
    } as any; 
  }

  getDefaultForm(): any {
    return {
      code: '',
      name: ''
    };
  }

  onEditRow(item: DepartmentResponse) {
    this.formMode = 'edit';
    this.formModel = { ...item };
    this.isFormOpen = true;
  }

  onDeleteRow(item: DepartmentResponse) {
    this.confirmService.confirm(`Bạn có chắc muốn xóa phòng ban ${item.name}?`, 'Xác nhận xóa').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.getService().delete(item.id).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã xóa phòng ban ${item.name} thành công!`);
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

}
