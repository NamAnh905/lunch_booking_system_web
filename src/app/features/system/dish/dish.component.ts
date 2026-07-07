import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { DishService } from './dish.service';
import { Dish, DishCreateRequest, DishUpdateRequest } from '@shared/models/dish.model';

@Component({
  selector: 'app-dish',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent],
  templateUrl: './dish.component.html',
  styleUrl: './dish.component.scss'
})
export class DishComponent extends BaseCrudComponent<Dish, { keyword?: string }, any> implements OnInit {
  private dishService = inject(DishService);

  getService() {
    return this.dishService as any;
  }

  getDefaultForm(): any {
    return {
      name: '',
      description: '',
      isActive: true
    };
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
          isActive: !item.isActive
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
    alert('Tính năng xuất Excel đang được phát triển ở phía Backend!');
  }
}
