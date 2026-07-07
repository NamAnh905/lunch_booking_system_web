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

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, CrudComponent],
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
  activeEditSlot: { dateStr: string; priceId: number; slotIndex: number; isDrinkSlot: boolean } | null = null;
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
    const dates = this.weekDays.map(d => d.dateStr);
    const requests = dates.map(date => 
      this.menuService.getByDate(date).pipe(
        catchError(() => of({ result: [] as Menu[] }))
      )
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.menuGrid = {};
        responses.forEach((res: any, index) => {
          const dateStr = dates[index];
          const menus = res.result || [];
          menus.forEach((menu: Menu) => {
            if (menu.price && menu.price.id) {
              this.menuGrid[`${dateStr}_${menu.price.id}`] = menu;
            }
          });
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

  isDrink(dish: Dish): boolean {
    if (!dish || !dish.name) return false;
    const name = dish.name.toLowerCase();
    const keywords = ['trà', 'nước', 'sữa', 'sinh tố', 'coca', 'pepsi', 'lavie', 'café', 'cà phê', 'soda', 'chanh', 'la hán', 'nhân trần', 'bí đao', 'cam ép'];
    return keywords.some(keyword => name.includes(keyword));
  }

  getFilteredDishes(isDrinkSlot: boolean): Dish[] {
    const list = isDrinkSlot 
      ? this.availableDishes.filter(d => this.isDrink(d))
      : this.availableDishes.filter(d => !this.isDrink(d));
    
    if (!this.dishSearchKeyword) return list;
    
    const kw = this.dishSearchKeyword.toLowerCase();
    return list.filter(d => d.name.toLowerCase().includes(kw));
  }

  isSpecialPrice(price: PriceResponse): boolean {
    if (!price || !price.name) return false;
    const name = price.name.toLowerCase();
    return name.includes('đặc biệt') || name.includes('vip') || price.amount === 40000;
  }

  getMenuSlots(menu: Menu | undefined, dayName: string, price: PriceResponse): { isDrinkSlot: boolean; dish?: Dish; label: string }[] {
    const slots: { isDrinkSlot: boolean; dish?: Dish; label: string }[] = [];
    
    // Check if it is a special lunch
    const isSpecial = this.isSpecialPrice(price);
    
    if (isSpecial) {
      if (dayName !== 'Thứ sáu') {
        // Monday to Thursday for special lunch: no slots
        return [];
      } else {
        // Friday for special lunch: exactly 1 food slot
        let dish: Dish | undefined = undefined;
        if (menu && menu.dishes && menu.dishes.length > 0) {
          dish = menu.dishes[0];
        }
        return [{
          isDrinkSlot: false,
          dish,
          label: 'Thêm món ăn'
        }];
      }
    }
    
    // Regular lunch: 7 slots (6 food + 1 drink)
    let foods: Dish[] = [];
    let drinks: Dish[] = [];
    
    if (menu && menu.dishes) {
      foods = menu.dishes.filter(d => !this.isDrink(d));
      drinks = menu.dishes.filter(d => this.isDrink(d));
    }
    
    // 6 food slots
    for (let i = 0; i < 6; i++) {
      slots.push({
        isDrinkSlot: false,
        dish: foods[i] || undefined,
        label: foods[i] ? foods[i].name : 'Thêm món ăn'
      });
    }
    
    // 1 drink slot
    slots.push({
      isDrinkSlot: true,
      dish: drinks[0] || undefined,
      label: drinks[0] ? drinks[0].name : 'Thêm nước'
    });
    
    return slots;
  }

  openSlotDropdown(dateStr: string, priceId: number, slotIndex: number, isDrinkSlot: boolean, event: Event) {
    event.stopPropagation();
    this.activeEditSlot = { dateStr, priceId, slotIndex, isDrinkSlot };
    this.dishSearchKeyword = '';
  }

  validateDishForSlot(dish: Dish, dateStr: string, priceId: number, slotIndex: number): string | null {
    const menu = this.getMenuAt(dateStr, priceId);
    if (!menu || !menu.dishes) return null;

    const foods = menu.dishes.filter(d => !this.isDrink(d));

    // 1. General duplication check: A dish cannot appear twice in the menu
    const isDuplicate = menu.dishes.some((d, idx) => {
      // If we are replacing the dish at the current slot, it's not a duplicate
      const isCurrentSlot = this.isDrink(dish)
        ? (this.isDrink(d) && idx === slotIndex - 6)
        : (!this.isDrink(d) && foods.indexOf(d) === slotIndex);
      return d.id === dish.id && !isCurrentSlot;
    });

    if (isDuplicate) {
      return `Món "${dish.name}" đã tồn tại trong thực đơn này!`;
    }

    // 2. Tofu conflict check
    if (!this.isDrink(dish)) {
      const isTofu = dish.name.toLowerCase().includes('đậu');
      if (isTofu) {
        if (slotIndex === 0) {
          // Setting the first slot to Tofu. Check if any other slots have Tofu.
          for (let i = 1; i < 6; i++) {
            if (foods[i] && foods[i].name.toLowerCase().includes('đậu')) {
              return `Vì hàng khác đã có món chứa "đậu", hàng đầu tiên không thể là món "đậu"!`;
            }
          }
        } else {
          // Setting slot 1-5 to Tofu. Check if the first slot is Tofu.
          if (foods[0] && foods[0].name.toLowerCase().includes('đậu')) {
            return `Vì hàng đầu tiên đã là món chứa "đậu", các hàng còn lại không thể chọn món "đậu" nữa!`;
          }
        }
      }
    }

    return null;
  }

  selectDishForSlot(dish: Dish) {
    if (!this.activeEditSlot) return;
    const { dateStr, priceId, slotIndex, isDrinkSlot } = this.activeEditSlot;
    
    // Check validation first
    const errorMsg = this.validateDishForSlot(dish, dateStr, priceId, slotIndex);
    if (errorMsg) {
      this.toastService.showError(errorMsg);
      this.activeEditSlot = null;
      return;
    }

    // Find if menu exists
    let menu = this.getMenuAt(dateStr, priceId);
    
    let currentDishes = menu ? [...(menu.dishes || [])] : [];
    
    // Separate food and drinks
    let foods = currentDishes.filter(d => !this.isDrink(d));
    let drinks = currentDishes.filter(d => this.isDrink(d));
    
    if (isDrinkSlot) {
      // For drink slot, we replace or set the drink
      drinks = [dish];
    } else {
      // For food slot, we replace the food at slotIndex
      // Pad foods if needed
      while (foods.length <= slotIndex) {
        foods.push(null as any);
      }
      foods[slotIndex] = dish;
      // Filter out nulls
      foods = foods.filter(f => f !== null);
    }
    
    const newDishes = [...foods, ...drinks];
    const dishIds = newDishes.map(d => d.id!);
    
    this.saveMenuDishes(menu, dateStr, priceId, dishIds);
    this.activeEditSlot = null;
  }

  removeDishFromSlot(dateStr: string, priceId: number, slotIndex: number, isDrinkSlot: boolean, event: Event) {
    event.stopPropagation();
    let menu = this.getMenuAt(dateStr, priceId);
    if (!menu) return;
    
    let currentDishes = [...(menu.dishes || [])];
    let foods = currentDishes.filter(d => !this.isDrink(d));
    let drinks = currentDishes.filter(d => this.isDrink(d));
    
    if (isDrinkSlot) {
      drinks = [];
    } else {
      if (slotIndex < foods.length) {
        foods.splice(slotIndex, 1);
      }
    }
    
    const newDishes = [...foods, ...drinks];
    const dishIds = newDishes.map(d => d.id!);
    
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
    alert('Tính năng xuất Excel đang được phát triển ở phía Backend!');
  }
}
