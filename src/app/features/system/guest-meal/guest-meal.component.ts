import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { AutoFocusDirective } from '@shared/directives/autofocus.directive';
import { DepartmentResponse } from '@shared/models/department.model';
import { UserResponse } from '@shared/models/user.model';
import {
  GuestMealResponse,
  GuestMealCreateRequest,
  GuestMealUpdateRequest,
  GuestMealQuery
} from '@shared/models/guest-meal.model';
import { GuestMealService } from './guest-meal.service';
import { DepartmentService } from '@features/system/department/department.service';
import { UserService } from '@features/system/user/user.service';
import { BusinessConfigService, formatVnTime } from '@core/services/business-config.service';
import { toIsoDate } from '@shared/utils/date.util';

@Component({
  selector: 'app-guest-meal',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, FormModalComponent, AutoFocusDirective],
  templateUrl: './guest-meal.component.html',
  styleUrl: './guest-meal.component.scss'
})
export class GuestMealComponent
  extends BaseCrudComponent<GuestMealResponse, GuestMealQuery, GuestMealCreateRequest | GuestMealUpdateRequest>
  implements OnInit {

  private guestMealService = inject(GuestMealService);
  private departmentService = inject(DepartmentService);
  private userService = inject(UserService);
  private businessConfig = inject(BusinessConfigService);

  departments: DepartmentResponse[] = [];
  users: UserResponse[] = [];
  hasSpecial = false;

  override ngOnInit() {
    super.ngOnInit();
    this.loadDepartments();
    this.loadUsers();
  }

  getService() {
    return {
      query: (queryObj: GuestMealQuery, page: number, size: number) =>
        this.guestMealService.getGuestMeals(page + 1, size, queryObj),
      add: (data: GuestMealCreateRequest) => this.guestMealService.createGuestMeal(data),
      edit: (id: number, data: GuestMealUpdateRequest) => this.guestMealService.updateGuestMeal(id, data),
      delete: (id: number) => this.guestMealService.deleteGuestMeal(id)
    } as any;
  }

  override getDefaultQuery(): GuestMealQuery {
    return {
      startDate: undefined,
      endDate: undefined,
      departmentId: null,
      requestedByUserId: null
    };
  }

  get cutOffLabel(): string {
    return formatVnTime(this.businessConfig.cutOffTime);
  }

  get minMealDate(): string {
    return toIsoDate(this.businessConfig.earliestOrderableDate());
  }

  get maxMealDate(): string {
    return this.businessConfig.maxOrderableDate;
  }

  get isMealDateOrderable(): boolean {
    return !!this.formModel.mealDate && this.businessConfig.isOrderable(this.formModel.mealDate);
  }

  getDefaultForm(): GuestMealCreateRequest {
    return {
      mealDate: this.firstOrderableDate(),
      departmentId: null,
      requestedByUserId: null,
      normalQuantity: 1,
      specialQuantity: 0,
      note: ''
    };
  }

  override onAdd(): void {
    this.hasSpecial = false;
    super.onAdd();
  }

  onEditRow(item: GuestMealResponse) {
    this.formMode = 'edit';
    this.hasSpecial = item.specialQuantity > 0;
    this.formModel = {
      id: item.id,
      mealDate: item.mealDate,
      departmentId: item.departmentId,
      requestedByUserId: item.requestedByUserId,
      normalQuantity: item.normalQuantity,
      specialQuantity: item.specialQuantity,
      note: item.note ?? ''
    } as any;
    this.isFormOpen = true;
  }

  onDeleteRow(item: GuestMealResponse) {
    const label = `${this.totalQuantityOf(item)} suất khách ngày ${item.mealDate} của ${item.departmentName}`;
    this.confirmService.confirm(`Bạn có chắc muốn xóa ${label}?`, 'Xác nhận xóa').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.getService().delete(item.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Đã xóa suất ăn khách thành công!');
            this.loadData();
          },
          error: () => {
            this.loading = false;
          }
        });
      }
    });
  }

  onSubmit(): void {
    this.onSave({
      mealDate: this.formModel.mealDate,
      departmentId: this.formModel.departmentId,
      requestedByUserId: this.formModel.requestedByUserId,
      normalQuantity: Number(this.formModel.normalQuantity) || 0,
      specialQuantity: this.hasSpecial ? Number(this.formModel.specialQuantity) || 0 : 0,
      note: this.formModel.note
    });
  }

  onDepartmentChange(): void {
    this.formModel.requestedByUserId = null;
  }

  onSpecialToggle(): void {
    if (!this.hasSpecial) {
      this.formModel.specialQuantity = 0;
    }
  }

  get filteredUsers(): UserResponse[] {
    const department = this.departments.find(item => item.id === this.formModel.departmentId);
    if (!department) {
      return [];
    }
    return this.users.filter(user => user.department === department.name);
  }

  get formTotalQuantity(): number {
    const normal = Number(this.formModel.normalQuantity) || 0;
    const special = this.hasSpecial ? Number(this.formModel.specialQuantity) || 0 : 0;
    return normal + special;
  }

  totalQuantityOf(item: GuestMealResponse): number {
    return item.normalQuantity + item.specialQuantity;
  }

  isEditable(item: GuestMealResponse): boolean {
    return item.mealDate >= this.minMealDate;
  }

  private loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (res) => {
        this.departments = res.result ?? [];
      }
    });
  }

  private loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users = res.result ?? [];
      }
    });
  }

  private firstOrderableDate(): string {
    const date = this.businessConfig.earliestOrderableDate();
    for (let i = 0; i < 14; i++) {
      const iso = toIsoDate(date);
      if (this.businessConfig.isOrderable(iso)) {
        return iso;
      }
      date.setDate(date.getDate() + 1);
    }
    return this.minMealDate;
  }
}
