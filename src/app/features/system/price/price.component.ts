import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { CrudActionsComponent } from '@shared/components/crud/crud-actions.component';
import { CrudSearchComponent } from '@shared/components/crud/crud-search.component';
import { FormModalComponent } from '@shared/components/form-modal/form-modal.component';
import { PriceService } from './price.service';
import { PriceResponse, PriceCreateRequest, PriceUpdateRequest } from '@shared/models/price.model';
import { AutoFocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-price',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, CrudActionsComponent, CrudSearchComponent, FormModalComponent, AutoFocusDirective],
  templateUrl: './price.component.html',
  styleUrl: './price.component.scss'
})
export class PriceComponent extends BaseCrudComponent<PriceResponse, { keyword?: string }, PriceCreateRequest | PriceUpdateRequest> implements OnInit {
  private priceService = inject(PriceService);
  
  override ngOnInit() {
    super.ngOnInit();
  }

  getService() {
    return {
      query: (queryObj: any, page: number, size: number) => this.priceService.getPrices(page + 1, size, queryObj.keyword),
      add: (data: PriceCreateRequest) => this.priceService.createPrice(data),
      edit: (id: number, data: PriceUpdateRequest) => this.priceService.updatePrice(id, data),
      delete: (id: number) => this.priceService.deletePrice(id)
    } as any; 
  }

  getDefaultForm(): any {
    return {
      name: '',
      amount: 0,
      description: '',
      isActive: true
    };
  }

  onEditRow(item: PriceResponse) {
    this.formMode = 'edit';
    this.formModel = { ...item };
    this.isFormOpen = true;
  }

  onDeleteRow(item: PriceResponse) {
    this.confirmService.confirm(`Bạn có chắc muốn xóa giá ${item.name}?`, 'Xác nhận xóa').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.getService().delete(item.id).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã xóa giá ${item.name} thành công!`);
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

  onToggleStatus(item: PriceResponse) {
    const action = item.isActive ? 'Khóa' : 'Mở khóa';
    this.confirmService.confirm(`Bạn có chắc muốn ${action.toLowerCase()} giá ${item.name}?`, `Xác nhận ${action.toLowerCase()}`).subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        const updateData: PriceUpdateRequest = {
          name: item.name,
          amount: item.amount,
          description: item.description,
          isActive: !item.isActive
        };
        this.getService().edit(item.id, updateData).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã ${action.toLowerCase()} giá ${item.name} thành công!`);
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
