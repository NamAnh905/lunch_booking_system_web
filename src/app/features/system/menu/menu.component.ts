import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseCrudComponent } from '@shared/components/crud/base-crud.component';
import { CrudComponent } from '@shared/components/crud/crud.component';
import { MenuService } from './menu.service';
import { PriceService } from '../price/price.service';
import { DishService } from '../dish/dish.service';
import { Menu, MenuCreateRequest, MenuUpdateRequest } from '@shared/models/menu.model';
import { PriceResponse } from '@shared/models/price.model';
import { Dish } from '@shared/models/dish.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AutoFocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent, AutoFocusDirective],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent extends BaseCrudComponent<Menu, { keyword?: string }, any> implements OnInit {
  private menuService = inject(MenuService);
  private priceService = inject(PriceService);
  private dishService = inject(DishService);

  availablePrices: PriceResponse[] = [];
  availableDishes: Dish[] = [];
  selectedDishIds: number[] = [];

  currentDate = new Date();
  weekDays: { name: string; dateStr: string; label: string }[] = [];
  menuGrid: { [key: string]: Menu } = {};

  // Inline slot editing state
  activeEditSlot: { dateStr: string; priceId: number; slotIndex: number; expectedType: string } | null = null;
  dishSearchKeyword = '';

  override ngOnInit() {
    this.generateWeekDays(this.currentDate);
    super.ngOnInit();
    this.loadPrices();
    this.loadDishes();
  }

  loadPrices() {
    this.priceService.getPrices(1, 100).subscribe({
      next: (res) => {
        const pageData = (res as any).result !== undefined ? (res as any).result : res;
        let list: any[] = [];
        if (Array.isArray(pageData)) {
          list = pageData;
        } else {
          list = pageData.data || pageData.content || [];
        }
        // Exclude prices containing "sáng" (case-insensitive) to remove breakfast row
        this.availablePrices = list.filter((p: any) => p.isActive && !p.name.toLowerCase().includes('sáng'));
      },
      error: (err) => console.error('Failed to load prices', err)
    });
  }

  loadDishes() {
    this.dishService.query({}, 0, 200).subscribe({
      next: (res) => {
        const pageData = (res as any).result !== undefined ? (res as any).result : res;
        if (Array.isArray(pageData)) {
          this.availableDishes = pageData.filter((d: any) => d.isActive);
        } else {
          const list = pageData.data || pageData.content || [];
          this.availableDishes = list.filter((d: any) => d.isActive);
        }
      },
      error: (err) => console.error('Failed to load dishes', err)
    });
  }

  getService() {
    return this.menuService as any;
  }

  getDefaultForm(): any {
    return {
      menuDate: new Date().toISOString().substring(0, 10),
      priceId: '',
      status: 'ACTIVE',
      dishIds: []
    };
  }

  override loadData() {
    this.loadWeekMenus();
  }

  generateWeekDays(baseDate: Date) {
    const monday = this.getMonday(baseDate);
    this.weekDays = [];
    const dayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu'];
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().substring(0, 10);
      const dayLabel = this.formatDateLabel(date);
      this.weekDays.push({
        name: dayNames[i],
        dateStr,
        label: `${dayNames[i]}, ${dayLabel}`
      });
    }
  }

  getMonday(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  formatDateLabel(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  loadWeekMenus() {
    this.loading = true;
    if (this.weekDays.length === 0) {
      this.loading = false;
      return;
    }
    
    const startDate = this.weekDays[0].dateStr;
    const endDate = this.weekDays[this.weekDays.length - 1].dateStr;
    
    this.menuService.getWeeklyMenus(startDate, endDate).pipe(
      catchError(() => of({ result: [] as Menu[] }))
    ).subscribe({
      next: (res: any) => {
        this.menuGrid = {};
        const menus = res.result || [];
        menus.forEach((menu: Menu) => {
          if (menu.price && menu.price.id) {
            this.menuGrid[`${menu.menuDate}_${menu.price.id}`] = menu;
          }
        });
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

  getDishType(dish: Dish): string {
    if (!dish) return 'REGULAR';
    if (dish.type === 'VEGETABLE') return 'VEGETABLE';
    if (dish.type === 'SOUP') return 'SOUP';
    if (dish.type === 'RICE') return 'RICE';
    if (dish.type === 'DRINK') return 'DRINK';
    
    if (this.isDrink(dish)) return 'DRINK';
    
    return 'REGULAR';
  }

  isDrink(dish: Dish): boolean {
    if (!dish) return false;
    if (dish.type === 'DRINK') return true;
    if (dish.type === 'REGULAR' || dish.type === 'SPECIAL' || dish.type === 'VEGETABLE' || dish.type === 'SOUP' || dish.type === 'RICE') return false;
    
    // Fallback for legacy data
    if (!dish.name) return false;
    const name = dish.name.toLowerCase();
    const keywords = ['trà', 'nước', 'sữa', 'sinh tố', 'coca', 'pepsi', 'lavie', 'café', 'cà phê', 'soda', 'chanh', 'la hán', 'nhân trần', 'bí đao', 'cam ép'];
    return keywords.some(keyword => name.includes(keyword));
  }

  getFilteredDishes(expectedType: string): Dish[] {
    let list = this.availableDishes;
    
    if (expectedType) {
      list = list.filter(d => this.getDishType(d) === expectedType);
    }
    
    if (!this.dishSearchKeyword) return list;
    
    const kw = this.dishSearchKeyword.toLowerCase();
    return list.filter(d => d.name.toLowerCase().includes(kw));
  }

  isSpecialPrice(price: PriceResponse): boolean {
    if (!price || !price.name) return false;
    const name = price.name.toLowerCase();
    return name.includes('đặc biệt') || name.includes('vip') || price.amount === 40000;
  }

  getMenuSlots(menu: Menu | undefined, dayName: string, price: PriceResponse): { expectedType: string; dish?: Dish; label: string }[] {
    const isSpecial = this.isSpecialPrice(price);
    
    if (isSpecial) {
      if (dayName !== 'Thứ sáu') {
        return [];
      } else {
        let dish: Dish | undefined = undefined;
        if (menu && menu.dishes && menu.dishes.length > 0) {
          dish = menu.dishes[0];
        }
        return [{
          expectedType: 'REGULAR',
          dish,
          label: 'Thêm món ăn'
        }];
      }
    }
    
    const slotDefs = [
      { type: 'REGULAR', label: 'Thêm món ăn' },
      { type: 'REGULAR', label: 'Thêm món ăn' },
      { type: 'VEGETABLE', label: 'Thêm rau' },
      { type: 'VEGETABLE', label: 'Thêm rau' },
      { type: 'SOUP', label: 'Thêm canh' },
      { type: 'RICE', label: 'Thêm cơm' },
      { type: 'DRINK', label: 'Thêm nước' }
    ];
    
    const mappedSlots = slotDefs.map(def => ({ expectedType: def.type, dish: undefined as Dish | undefined, label: def.label }));
    
    if (menu && menu.dishes) {
      const unassignedDishes = [...menu.dishes];
      
      // First pass: strict match
      for (let i = 0; i < unassignedDishes.length; i++) {
        const dish = unassignedDishes[i];
        if (!dish) continue;
        const dType = this.getDishType(dish);
        const slot = mappedSlots.find(s => !s.dish && s.expectedType === dType);
        if (slot) {
          slot.dish = dish;
          unassignedDishes[i] = null as any;
        }
      }
      
      // Second pass: fill any empty slots for leftovers
      for (const dish of unassignedDishes) {
        if (!dish) continue;
        const emptySlot = mappedSlots.find(s => !s.dish);
        if (emptySlot) {
          emptySlot.dish = dish;
        }
      }
    }
    
    return mappedSlots;
  }

  openSlotDropdown(dateStr: string, priceId: number, slotIndex: number, expectedType: string, event: Event) {
    event.stopPropagation();
    this.activeEditSlot = { dateStr, priceId, slotIndex, expectedType };
    this.dishSearchKeyword = '';
  }

  validateDishForSlot(dish: Dish, dateStr: string, priceId: number, slotIndex: number, expectedType: string): string | null {
    const menu = this.getMenuAt(dateStr, priceId);
    if (!menu || !menu.dishes) return null;

    const price = this.availablePrices.find(p => p.id === priceId);
    const day = this.weekDays.find(d => d.dateStr === dateStr);
    if (!price || !day) return null;
    
    const slots = this.getMenuSlots(menu, day.name, price);

    const isDuplicate = slots.some((s, idx) => {
      return s.dish && s.dish.id === dish.id && idx !== slotIndex;
    });

    if (isDuplicate) {
      return `Món "${dish.name}" đã tồn tại trong thực đơn này!`;
    }

    if (expectedType !== 'DRINK') {
      const isTofu = dish.name.toLowerCase().includes('đậu');
      if (isTofu) {
        if (slotIndex === 0) {
          for (let i = 1; i <= 5; i++) {
            if (slots[i] && slots[i].dish && slots[i].dish!.name.toLowerCase().includes('đậu')) {
              return `Vì hàng khác đã có món chứa "đậu", hàng đầu tiên không thể là món "đậu"!`;
            }
          }
        } else if (slotIndex > 0 && slotIndex <= 5) {
          if (slots[0] && slots[0].dish && slots[0].dish!.name.toLowerCase().includes('đậu')) {
             return `Vì hàng đầu tiên đã là món chứa "đậu", các hàng còn lại không thể chọn món "đậu" nữa!`;
          }
        }
      }
    }

    return null;
  }

  selectDishForSlot(dish: Dish) {
    if (!this.activeEditSlot) return;
    const { dateStr, priceId, slotIndex, expectedType } = this.activeEditSlot;
    
    const errorMsg = this.validateDishForSlot(dish, dateStr, priceId, slotIndex, expectedType);
    if (errorMsg) {
      this.toastService.showError(errorMsg);
      this.activeEditSlot = null;
      return;
    }

    let menu = this.getMenuAt(dateStr, priceId);
    const price = this.availablePrices.find(p => p.id === priceId);
    const day = this.weekDays.find(d => d.dateStr === dateStr);
    if (!price || !day) return;
    
    const slots = this.getMenuSlots(menu, day.name, price);
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
    if (menu) {
      // Edit existing
      const updateReq: MenuUpdateRequest = {
        menuDate: menu.menuDate,
        priceId: menu.price!.id,
        status: menu.status || 'ACTIVE',
        dishIds
      };
      this.menuService.edit(menu.id!, updateReq).subscribe({
        next: () => {
          this.toastService.showSuccess('Cập nhật món ăn thành công!');
          this.loadWeekMenus();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    } else {
      // Add new
      const createReq: MenuCreateRequest = {
        menuDate: dateStr,
        priceId: priceId,
        status: 'ACTIVE',
        dishIds
      };
      this.menuService.add(createReq).subscribe({
        next: () => {
          this.toastService.showSuccess('Tạo thực đơn thành công!');
          this.loadWeekMenus();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
        }
      });
    }
  }

  onDeleteCell(menu: Menu) {
    this.confirmService.confirm(`Bạn có chắc muốn xóa thực đơn ngày ${menu.menuDate}?`, 'Xác nhận').subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.menuService.delete(menu.id!).subscribe({
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
        const updatedForm: MenuUpdateRequest = {
          menuDate: menu.menuDate,
          priceId: menu.price!.id,
          status: newStatus,
          dishIds: menu.dishes ? menu.dishes.map((d: any) => d.id) : []
        };

        this.loading = true;
        this.menuService.edit(menu.id!, updatedForm).subscribe({
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

  override onSave(formData: any): void {
    const payload = {
      menuDate: this.formModel.menuDate,
      priceId: Number(this.formModel.priceId),
      status: this.formModel.status || 'ACTIVE',
      dishIds: this.selectedDishIds
    };
    super.onSave(payload);
  }

  onExport() {
    this.loading = true;
    this.menuService.exportExcel().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'danh_sach_thuc_don.xlsx';
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
