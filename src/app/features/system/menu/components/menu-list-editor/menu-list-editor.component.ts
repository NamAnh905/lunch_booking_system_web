import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { AutoFocusDirective } from '../../../../../shared/directives/autofocus.directive';
import { ToastService } from '@core/services/toast.service';
import { ConfirmService } from '@core/services/confirm.service';
import { Menu } from '@shared/models/menu.model';
import { PriceResponse } from '@shared/models/price.model';
import { Dish } from '@shared/models/dish.model';
import { DishType } from '@shared/enums/dish-type.enum';
import { DishClassifierService } from '../../services/dish-classifier.service';
import { MenuSlotService, MenuSlot } from '../../services/menu-slot.service';
import { MenuFacade } from '../../menu.facade';
import { toIsoDate, toDisplayDate, getMonday } from '@shared/utils/date.util';

@Component({
  selector: 'app-menu-list-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, AutoFocusDirective],
  templateUrl: './menu-list-editor.component.html',
  styleUrl: './menu-list-editor.component.scss',
  providers: [MenuFacade]
})
export class MenuListEditorComponent implements OnInit {
  /** Ngày khởi tạo tuần hiển thị (YYYY-MM-DD); mặc định là tuần hiện tại. */
  @Input() initialDate?: string;
  @Output() close = new EventEmitter<void>();

  private facade = inject(MenuFacade);
  private dishClassifier = inject(DishClassifierService);
  private menuSlotService = inject(MenuSlotService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmService);

  loading = false;
  availablePrices: PriceResponse[] = [];
  availableDishes: Dish[] = [];

  currentDate = new Date();
  weekDays: { name: string; dateStr: string; label: string }[] = [];
  menuGrid: { [key: string]: Menu } = {};

  activeEditSlot: { dateStr: string; priceId: number; slotIndex: number; expectedType: DishType } | null = null;
  dishSearchKeyword = '';

  ngOnInit() {
    if (this.initialDate) {
      this.currentDate = new Date(this.initialDate);
    }
    this.generateWeekDays(this.currentDate);
    this.loadPrices();
    this.loadDishes();
    this.loadWeekMenus();
  }

  onClose() {
    this.close.emit();
  }

  loadPrices() {
    this.facade.loadActivePrices().subscribe({
      next: (list) => (this.availablePrices = list),
      error: (err) => console.error('Failed to load prices', err)
    });
  }

  loadDishes() {
    this.facade.loadActiveDishes().subscribe({
      next: (list) => (this.availableDishes = list),
      error: (err) => console.error('Failed to load dishes', err)
    });
  }

  generateWeekDays(baseDate: Date) {
    const monday = getMonday(baseDate);
    this.weekDays = [];
    const dayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu'];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      this.weekDays.push({
        name: dayNames[i],
        dateStr: toIsoDate(date),
        label: `${dayNames[i]}, ${toDisplayDate(date)}`
      });
    }
  }

  loadWeekMenus() {
    this.loading = true;
    if (this.weekDays.length === 0) {
      this.loading = false;
      return;
    }

    const startDate = this.weekDays[0].dateStr;
    const endDate = this.weekDays[this.weekDays.length - 1].dateStr;

    this.facade.loadWeekMenus(startDate, endDate).subscribe({
      next: (grid) => {
        this.menuGrid = grid;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  prevWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.generateWeekDays(this.currentDate);
    this.loadWeekMenus();
  }

  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.generateWeekDays(this.currentDate);
    this.loadWeekMenus();
  }

  thisWeek() {
    this.currentDate = new Date();
    this.generateWeekDays(this.currentDate);
    this.loadWeekMenus();
  }

  onWeekDateChange(event: any) {
    const value = event.target.value;
    if (value) {
      this.currentDate = new Date(value);
      this.generateWeekDays(this.currentDate);
      this.loadWeekMenus();
    }
  }

  getMenuAt(dateStr: string, priceId: number): Menu | undefined {
    return this.menuGrid[`${dateStr}_${priceId}`];
  }

  getDishType(dish: Dish): DishType {
    return this.dishClassifier.getDishType(dish);
  }

  isDrink(dish: Dish): boolean {
    return this.dishClassifier.isDrink(dish);
  }

  getFilteredDishes(expectedType: DishType): Dish[] {
    let list = this.availableDishes;

    if (expectedType) {
      list = list.filter(d => this.getDishType(d) === expectedType);
    }

    if (!this.dishSearchKeyword) return list;

    const kw = this.dishSearchKeyword.toLowerCase();
    return list.filter(d => d.name.toLowerCase().includes(kw));
  }

  isSpecialPrice(price: PriceResponse): boolean {
    return this.menuSlotService.isSpecialPrice(price);
  }

  getMenuSlots(menu: Menu | undefined, dayName: string, price: PriceResponse): MenuSlot[] {
    return this.menuSlotService.getMenuSlots(menu, dayName, price);
  }

  openSlotDropdown(dateStr: string, priceId: number, slotIndex: number, expectedType: DishType, event: Event) {
    event.stopPropagation();
    this.activeEditSlot = { dateStr, priceId, slotIndex, expectedType };
    this.dishSearchKeyword = '';
  }

  selectDishForSlot(dish: Dish) {
    if (!this.activeEditSlot) return;
    const { dateStr, priceId, slotIndex, expectedType } = this.activeEditSlot;

    const menu = this.getMenuAt(dateStr, priceId);
    const price = this.availablePrices.find(p => p.id === priceId);
    const day = this.weekDays.find(d => d.dateStr === dateStr);
    if (!price || !day) {
      this.activeEditSlot = null;
      return;
    }

    const slots = this.getMenuSlots(menu, day.name, price);

    const errorMsg = this.menuSlotService.validateDishForSlot(dish, slots, slotIndex, expectedType);
    if (errorMsg) {
      this.toastService.showError(errorMsg);
      this.activeEditSlot = null;
      return;
    }

    slots[slotIndex].dish = dish;
    const dishIds = slots.filter(s => s.dish).map(s => s.dish!.id!);

    this.saveMenuDishes(menu, dateStr, priceId, dishIds);
    this.activeEditSlot = null;
  }

  removeDishFromSlot(dateStr: string, priceId: number, slotIndex: number, event: Event) {
    event.stopPropagation();
    let menu = this.getMenuAt(dateStr, priceId);
    if (!menu) return;

    const price = this.availablePrices.find(p => p.id === priceId);
    const day = this.weekDays.find(d => d.dateStr === dateStr);
    if (!price || !day) return;

    const slots = this.getMenuSlots(menu, day.name, price);
    slots[slotIndex].dish = undefined;

    const dishIds = slots.filter(s => s.dish).map(s => s.dish!.id!);

    this.saveMenuDishes(menu, dateStr, priceId, dishIds);
  }

  saveMenuDishes(menu: Menu | undefined, dateStr: string, priceId: number, dishIds: number[]) {
    this.loading = true;
    const successMessage = menu ? 'Cập nhật món ăn thành công!' : 'Tạo thực đơn thành công!';
    this.facade.saveMenuDishes(menu, dateStr, priceId, dishIds).subscribe({
      next: () => {
        this.toastService.showSuccess(successMessage);
        this.loadWeekMenus();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onDeleteCell(menu: Menu) {
    this.confirmService.confirm(`Bạn có chắc muốn xóa thực đơn ngày ${menu.menuDate}?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.facade.deleteMenu(menu.id!).subscribe({
          next: () => {
            this.toastService.showSuccess('Xóa thực đơn thành công!');
            this.loadWeekMenus();
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
          }
        });
      }
    });
  }

  onToggleCellStatus(menu: Menu) {
    const action = menu.status === 'ACTIVE' ? 'khóa' : 'mở khóa';
    const newStatus = menu.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.confirmService.confirm(`Bạn có chắc muốn ${action} thực đơn ngày ${menu.menuDate}?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.facade.updateStatus(menu, newStatus).subscribe({
          next: () => {
            this.toastService.showSuccess(`Đã ${action} thực đơn thành công!`);
            this.loadWeekMenus();
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
