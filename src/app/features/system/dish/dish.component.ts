import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { DishService } from './dish.service';
import { Dish, DishCreateRequest, DishUpdateRequest } from '@shared/models/dish.model';
import { DishType, DISH_TYPE_LABELS } from '@shared/enums/dish-type.enum';
import { EXCEL_FILE_NAMES } from '@shared/constants/business.constants';
import { AutoFocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-dish',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent, FormModalComponent, AutoFocusDirective],
  templateUrl: './dish.component.html',
  styleUrl: './dish.component.scss'
})
export class DishComponent extends BaseCrudComponent<Dish, { keyword?: string, types?: string[], isActives?: boolean[] }, any> implements OnInit {
  private dishService = inject(DishService);

  getService() {
    return this.dishService as any;
  }

  getDefaultForm(): any {
    return {
      name: '',
      description: '',
      isActive: true,
      type: DishType.REGULAR
    };
  }

  private static readonly TYPE_FILTER_ORDER: DishType[] = [
    DishType.REGULAR,
    DishType.SPECIAL,
    DishType.DRINK,
    DishType.VEGETABLE,
    DishType.SOUP,
    DishType.RICE,
  ];

  readonly typeOptions = DishComponent.TYPE_FILTER_ORDER.map((value) => ({
    value,
    label: DISH_TYPE_LABELS[value]
  }));

  selectedType: DishType | null = null;
  selectedIsActive: boolean | null = null;

  onFilterChange() {
    this.query.types = this.selectedType ? [this.selectedType] : [];
    this.query.isActives = this.selectedIsActive === null ? [] : [this.selectedIsActive];
    this.onSearch();
  }

  override onReset() {
    this.selectedType = null;
    this.selectedIsActive = null;
    super.onReset();
  }

  onEditRow(item: Dish) {
    this.formMode = 'edit';
    this.formModel = { ...item };
    this.isFormOpen = true;
  }

  onDeleteRow(item: Dish) {
    this.onDelete([item]);
  }

  onToggleStatus(item: Dish) {
    const action = item.isActive ? 'khóa' : 'mở khóa';
    this.confirmService.confirm(`Bạn có chắc muốn ${action} món ăn "${item.name}"?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        const updatedForm: DishUpdateRequest = {
          name: item.name,
          description: item.description,
          isActive: !item.isActive,
          type: item.type
        };

        this.loading = true;
        this.dishService.edit(item.id!, updatedForm).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã ${action} món ăn thành công!`);
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
    this.dishService.exportExcel(this.query.keyword).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = EXCEL_FILE_NAMES.DISH_LIST;
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

  override onSave(formData: any) {
    if (this.formMode === 'add') {
      formData.type = formData.type || 'REGULAR';
      formData.isActive = formData.isActive !== undefined ? formData.isActive : true;
    } else {
      formData.isActive = formData.isActive !== undefined ? formData.isActive : this.formModel.isActive;
      formData.type = formData.type || this.formModel.type || 'REGULAR';
    }
    super.onSave(formData);
  }
}
